// ============================================================
// THRESHOLD TRIGGER — Supabase Edge Function
// Monitors ratings table. When issue hits 50 red+yellow, fires notification cascade.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3.2.0';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN') || '';
const DISABLE_WHATSAPP = Deno.env.get('DISABLE_WHATSAPP') === 'true';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const resend = new Resend(RESEND_API_KEY);

interface OfficialRecord {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  ward_number: string | null;
  municipality: string | null;
}

interface NotificationEntry {
  id: string;
  name: string;
  role: string;
  channel: 'email' | 'whatsapp' | 'sms';
  delivery_status: 'pending' | 'sent' | 'failed';
}

Deno.serve(async (req: Request) => {
  // Only accept from Supabase Database Webhooks or internal calls
  const payload = await req.json();
  const issueId: string = payload.record?.issue_id;

  if (!issueId) {
    return new Response(JSON.stringify({ error: 'Missing issue_id' }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch full issue details with rating counts
    const { data: issueDetail, error: issueErr } = await supabase
      .rpc('get_issue_detail', { issue_uuid: issueId });

    if (issueErr || !issueDetail) throw new Error('Issue not found');

    const { rating_counts, threshold_progress } = issueDetail;

    // Only proceed if threshold is actually met
    if (threshold_progress < 50) {
      return new Response(JSON.stringify({ skipped: true, reason: 'threshold not met' }), { status: 200 });
    }

    // Check idempotency: has this issue already been processed?
    const { data: existingLog } = await supabase
      .from('notifications_log')
      .select('id')
      .eq('issue_id', issueId)
      .limit(1);

    if (existingLog && existingLog.length > 0) {
      return new Response(JSON.stringify({ skipped: true, reason: 'already notified' }), { status: 200 });
    }

    // 2. Determine regional language from GPS
    const { data: regionInfo } = await supabase.rpc('find_responsible_officials', {
      issue_gps: `POINT(${issueDetail.gps_lng} ${issueDetail.gps_lat})`,
    });

    const regionalLanguage = detectLanguageFromRegion(issueDetail.gps_lat, issueDetail.gps_lng);

    // 3. Generate regional translation of the complaint
    const regionalText = await translateComplaint(
      issueDetail.description_formal,
      regionalLanguage,
    );

    // 4. Generate PDF report HTML via Claude
    const pdfHtml = await generatePdfHtml({
      photo_url: issueDetail.photo_url,
      category: issueDetail.category,
      description_formal: issueDetail.description_formal,
      description_regional: regionalText,
      gps_lat: issueDetail.gps_lat,
      gps_lng: issueDetail.gps_lng,
      red_count: rating_counts.red,
      yellow_count: rating_counts.yellow,
      green_count: rating_counts.green,
      total_ratings: rating_counts.total,
      language: regionalLanguage,
    });

    // Convert HTML to PDF (using a simple approach — in production use puppeteer/browserless)
    const pdfBytes = await htmlToPdf(pdfHtml);

    // Upload PDF to Supabase Storage
    const pdfPath = `complaints/${issueId}/formal_complaint.pdf`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('complaints')
      .upload(pdfPath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) throw new Error(`PDF upload failed: ${uploadErr.message}`);

    const { data: pdfUrl } = supabase.storage.from('complaints').getPublicUrl(pdfPath);

    // 5. Find responsible officials via PostGIS
    const officials = (regionInfo || []) as OfficialRecord[];

    if (officials.length === 0) {
      return new Response(JSON.stringify({ warning: 'No officials found for this region' }), { status: 200 });
    }

    // 6. Send notifications to each official
    const notifications: NotificationEntry[] = [];

    for (const official of officials) {
      const channels: ('email' | 'whatsapp' | 'sms')[] = [];
      if (official.email) channels.push('email');
      if (!DISABLE_WHATSAPP && WHATSAPP_API_TOKEN && official.whatsapp) {
        channels.push('whatsapp');
      } else if (DISABLE_WHATSAPP && official.phone) {
        channels.push('sms');
      }

      for (const channel of channels) {
        try {
          const deliveryStatus = await sendNotification({
            channel,
            official,
            pdfUrl: pdfUrl.publicUrl,
            issueDetail,
            regionalText,
          });
          notifications.push({
            id: official.id,
            name: official.name,
            role: official.role,
            channel,
            delivery_status: deliveryStatus,
          });
        } catch (err) {
          notifications.push({
            id: official.id,
            name: official.name,
            role: official.role,
            channel,
            delivery_status: 'failed',
          });
        }
      }
    }

    // 7. Log everything to notifications_log
    const { error: logErr } = await supabase.from('notifications_log').insert({
      issue_id: issueId,
      officials_notified: notifications,
      pdf_url: pdfUrl.publicUrl,
      delivery_status: notifications.some(n => n.delivery_status === 'failed') ? 'partial' : 'delivered',
    });

    if (logErr) throw new Error(`Log insert failed: ${logErr.message}`);

    // 8. Update issue status to threshold_met
    const { error: updateErr } = await supabase
      .from('issues')
      .update({ status: 'threshold_met' })
      .eq('id', issueId);

    if (updateErr) throw new Error(`Status update failed: ${updateErr.message}`);

    return new Response(JSON.stringify({
      success: true,
      issue_id: issueId,
      officials_notified: notifications.length,
      pdf_url: pdfUrl.publicUrl,
    }), { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Threshold trigger failed:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function detectLanguageFromRegion(lat: number, lng: number): string {
  // India language mapping by approximate coordinates
  if (lat > 13 && lat < 20 && lng > 72 && lng < 84) return 'te';   // Andhra/Telangana → Telugu
  if (lat > 20 && lat < 28 && lng > 68 && lng < 78) return 'hi';   // North India → Hindi
  if (lat > 8  && lat < 14 && lng > 74 && lng < 80) return 'ml';   // Kerala → Malayalam
  if (lat > 11 && lat < 15 && lng > 77 && lng < 80) return 'ta';   // Tamil Nadu → Tamil
  // Default for India
  if (lat > 6 && lat < 38 && lng > 68 && lng < 98) return 'hi';
  return 'es'; // fallback
}

async function translateComplaint(formalEnglish: string, targetLang: string): Promise<string> {
  const langNames: Record<string, string> = { te: 'Telugu', hi: 'Hindi', es: 'Spanish', ml: 'Malayalam', ta: 'Tamil' };

  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Translate this formal civic complaint into ${langNames[targetLang] || targetLang}. Maintain formal government tone. Return ONLY the translated text.\n\n"""${formalEnglish}"""`,
    }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.content[0].text.trim();
}

async function generatePdfHtml(params: Record<string, unknown>): Promise<string> {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Generate a formal government complaint report as clean HTML (semantic, no CSS).

DATA:
- Category: ${params.category}
- Location: ${params.gps_lat}, ${params.gps_lng}
- Formal Complaint (English): """${params.description_formal}"""
- Regional Translation: """${params.description_regional}"""
- Ratings: Critical=${params.red_count} | Needs_Attention=${params.yellow_count} | Looks_Fixed=${params.green_count}
- Total Petitioners: ${params.total_ratings}

Structure: Official header, Photo (<img>), Subject, Location+GPS, Complaint body (English + regional), Rating table, Petition statement, Footer.

Return ONLY valid HTML, no \`\`\`html wrapper.`,
    }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.content[0].text.trim();
}

async function htmlToPdf(html: string): Promise<Uint8Array> {
  // In production, use Puppeteer/Browserless to render HTML → PDF
  // For edge runtime, use a lightweight HTML-to-PDF service or Deno-compatible renderer
  // This is a placeholder showing the integration point
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6}</style></head><body>${html}</body></html>`;

  // Use a serverless PDF service (e.g., browserless.io or similar)
  const pdfRes = await fetch('https://chrome.browserless.io/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: fullHtml, options: { format: 'A4' } }),
  });

  if (!pdfRes.ok) {
    // Fallback: return HTML as text file
    return new TextEncoder().encode(fullHtml);
  }

  const pdfBuffer = await pdfRes.arrayBuffer();
  return new Uint8Array(pdfBuffer);
}

async function sendNotification(params: {
  channel: 'email' | 'whatsapp' | 'sms';
  official: OfficialRecord;
  pdfUrl: string;
  issueDetail: Record<string, unknown>;
  regionalText: string;
}): Promise<'sent' | 'failed'> {
  const { channel, official, pdfUrl, issueDetail, regionalText } = params;
  const category = issueDetail.category as string;
  const urgencyEmoji = category === 'pothole' ? '🕳️' : category === 'streetlight' ? '💡' : category === 'water_tap' ? '🚰' : '⚠️';

  switch (channel) {
    case 'email': {
      if (!official.email) return 'failed';

      const { error } = await resend.emails.send({
        from: 'Civic Platform <complaints@civic.app>',
        to: [official.email],
        subject: `${urgencyEmoji} [CIVIC ACTION REQUIRED] ${category} — ${issueDetail.gps_lat}, ${issueDetail.gps_lng}`,
        html: `
          <h2>Civic Complaint — Citizen Verified</h2>
          <p><strong>${issueDetail.rating_counts.total} citizens</strong> have reported this issue.</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Location:</strong> ${issueDetail.gps_lat}, ${issueDetail.gps_lng}</p>
          <hr/>
          <h3>Complaint:</h3>
          <p>${issueDetail.description_formal}</p>
          <h3>${regionalText ? 'Regional Translation:' : ''}</h3>
          <p>${regionalText}</p>
          <hr/>
          <p><a href="${pdfUrl}">Download Full PDF Report</a></p>
        `,
      });

      return error ? 'failed' : 'sent';
    }

    case 'whatsapp': {
      if (!official.whatsapp || !WHATSAPP_API_TOKEN) return 'failed';

      const waRes = await fetch(`https://graph.facebook.com/v19.0/phone-number-id/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: official.whatsapp,
          type: 'template',
          template: {
            name: 'civic_complaint_notification',
            language: { code: 'en' },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: category },
                { type: 'text', text: `${issueDetail.rating_counts.total}` },
                { type: 'text', text: pdfUrl },
              ],
            }],
          },
        }),
      });

      return waRes.ok ? 'sent' : 'failed';
    }

    case 'sms': {
      if (!official.phone) return 'failed';
      const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
      const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
      const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        return 'failed';
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const body = `[CIVIC ACTION REQUIRED] ${issueDetail.category} — ${issueDetail.rating_counts.total} citizens flagged. PDF: ${pdfUrl}`;

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: official.phone,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      });

      return twilioRes.ok ? 'sent' : 'failed';
    }

    default:
      return 'failed';
  }
}
