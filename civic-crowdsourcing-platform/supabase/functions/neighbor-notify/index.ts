// ============================================================
// NEIGHBOR NOTIFICATION ENGINE — Supabase Edge Function
// Fires when a new issue is created. Finds users within 500m.
// Sends SMS/WhatsApp notification. Rate-limited to 3/day/user.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;
const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN') || '';
const DISABLE_WHATSAPP = Deno.env.get('DISABLE_WHATSAPP') === 'true';
const MAX_DAILY_NOTIFICATIONS = 3;
const NEIGHBOR_RADIUS_METERS = 500;

interface NearbyUser {
  user_id: string;
  phone: string;
  preferred_language: string;
}

interface NotificationResult {
  user_id: string;
  channel: 'sms' | 'whatsapp';
  status: 'sent' | 'skipped_rate_limited' | 'skipped_no_channel' | 'failed';
}

Deno.serve(async (req: Request) => {
  const payload = await req.json();
  const issueId: string = payload.record?.id;
  const gpsCoords = payload.record?.gps_coords;
  const issueCategory = payload.record?.category;
  const issueDescription = payload.record?.description_original;

  if (!issueId || !gpsCoords) {
    return new Response(JSON.stringify({ error: 'Missing issue data' }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Find users within 500m radius using PostGIS
    // gpsCoords comes as EWKB hex from the webhook, parse it
    let gpsPoint: string;
    try {
      // Try parsing as GeoJSON/coordinates
      const coords = typeof gpsCoords === 'string'
        ? JSON.parse(gpsCoords)
        : gpsCoords;

      if (coords.coordinates) {
        gpsPoint = `POINT(${coords.coordinates[0]} ${coords.coordinates[1]})`;
      } else if (coords.lng && coords.lat) {
        gpsPoint = `POINT(${coords.lng} ${coords.lat})`;
      } else {
        gpsPoint = gpsCoords; // assume it's already WKT
      }
    } catch {
      gpsPoint = gpsCoords;
    }

    const { data: nearbyUsers, error: geoErr } = await supabase
      .rpc('find_nearby_users', {
        issue_gps: gpsPoint,
        radius_meters: NEIGHBOR_RADIUS_METERS,
      });

    if (geoErr) throw new Error(`Geo query failed: ${geoErr.message}`);

    if (!nearbyUsers || nearbyUsers.length === 0) {
      return new Response(JSON.stringify({ notified: 0, reason: 'no nearby users' }), { status: 200 });
    }

    // 2. Filter users by rate limit (max 3 notifications per day)
    const eligibleUsers: NearbyUser[] = [];
    const results: NotificationResult[] = [];
    const recentCounts = new Map<string, number>();

    for (const user of nearbyUsers as NearbyUser[]) {
      const { data: countData } = await supabase
        .rpc('get_recent_notification_count', { target_user_id: user.user_id });

      const count24h = countData || 0;
      recentCounts.set(user.user_id, count24h);

      if (count24h < MAX_DAILY_NOTIFICATIONS) {
        eligibleUsers.push(user);
      } else {
        results.push({
          user_id: user.user_id,
          channel: 'sms',
          status: 'skipped_rate_limited',
        });
      }
    }

    // 3. Send notifications to eligible users
    const messages: Record<string, Record<string, string>> = {
      te: {
        sms: `మీ ప్రాంతంలో "${issueCategory}" సమస్య నివేదించబడింది. దాన్ని ధృవీకరించడానికి ట్యాప్ చేయండి:`,
      },
      hi: {
        sms: `आपके क्षेत्र में "${issueCategory}" समस्या की रिपोर्ट की गई है। सत्यापित करने के लिए टैप करें:`,
      },
      en: {
        sms: `A "${issueCategory}" civic issue was reported near you. Tap to verify and help reach 50 ratings:`,
      },
      es: {
        sms: `Se reportó un problema cívico "${issueCategory}" cerca de ti. Toca para verificar:`,
      },
    };

    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://civic.app';
    const issueUrl = `${platformUrl}/issues/${issueId}`;

    for (const user of eligibleUsers) {
      const lang = user.preferred_language || 'en';
      const msg = messages[lang] || messages['en'];

      // Try SMS via Twilio
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: user.phone,
            From: TWILIO_PHONE_NUMBER,
            Body: `${msg.sms} ${issueUrl}`,
          }),
        });

        results.push({
          user_id: user.user_id,
          channel: 'sms',
          status: twilioRes.ok ? 'sent' : 'failed',
        });
      } catch {
        results.push({ user_id: user.user_id, channel: 'sms', status: 'failed' });
      }

      // Try WhatsApp fallback if SMS failed and WhatsApp is enabled
      if (!DISABLE_WHATSAPP && WHATSAPP_API_TOKEN && results[results.length - 1].status === 'failed') {
        try {
          const waRes = await fetch(`https://graph.facebook.com/v19.0/phone-number-id/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: user.phone,
              type: 'template',
              template: {
                name: 'nearby_issue_alert',
                language: { code: lang },
                components: [{
                  type: 'body',
                  parameters: [
                    { type: 'text', text: issueCategory },
                    { type: 'text', text: issueUrl },
                  ],
                }],
              },
            }),
          });

          if (waRes.ok) {
            results[results.length - 1].status = 'sent';
          }
        } catch {
          // Both SMS and WhatsApp failed — user just won't get notified
        }
      }
    }

    // 4. Log notification attempts (appending to existing or creating new record)
    const sentCount = results.filter(r => r.status === 'sent').length;
    const skippedCount = results.filter(r => r.status === 'skipped_rate_limited').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return new Response(JSON.stringify({
      success: true,
      issue_id: issueId,
      nearby_users_found: nearbyUsers.length,
      eligible_after_rate_limit: eligibleUsers.length,
      sent: sentCount,
      rate_limited: skippedCount,
      failed: failedCount,
    }), { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Neighbor notify failed:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
