// ============================================================
// Claude AI — Photo Moderation, Translation, PDF Generation
// ============================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

interface ClaudeContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

/**
 * A. PHOTO MODERATION — Validate civic issue photos before submission
 */
export async function moderatePhoto(
  imageBase64: string,
  mediaType: string
): Promise<{ is_valid: boolean; detected_category: string; reason: string }> {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Does this image show a real civic infrastructure problem (pothole, broken streetlight, water tap issue, damaged bus stop, garbage dumping, or similar)?

Reply ONLY valid JSON (no markdown, no code block):
{"is_valid": boolean, "detected_category": "pothole"|"streetlight"|"water_tap"|"bus_stop"|"garbage"|"other", "reason": "brief explanation in the language of the user's country"}`,
          },
        ],
      },
    ],
  };

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Claude moderation failed: ${res.status}`);

  const data = await res.json();
  const text = data.content[0].text.trim();
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

/**
 * B. MULTILINGUAL COMPLAINT GENERATOR
 * Accepts user description in ANY language, returns formalized complaint
 */
export async function formalizeComplaint(
  rawDescription: string,
  gpsLat: number,
  gpsLng: number,
  category: string
): Promise<{
  language_detected: string;
  description_formal: string;
  subject: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}> {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        text: `You are a civic complaint formalizer. Analyze this citizen report about a "${category}" issue at GPS (${gpsLat}, ${gpsLng}).

ORIGINAL REPORT: """${rawDescription}"""

Return ONLY valid JSON (no markdown):
{
  "language_detected": "ISO 639-1 code of the original text",
  "subject": "Formal subject line in English",
  "description_formal": "Structured formal complaint with: Location context, Issue description, Impact on citizens, Requested action. Write in formal English suitable for government communication.",
  "urgency": "low"|"medium"|"high"|"critical"
}`,
      },
    ],
  };

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Claude translation failed: ${res.status}`);

  const data = await res.json();
  const text = data.content[0].text.trim();
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

/**
 * B2. Translate formal complaint to regional language
 */
export async function translateToRegional(
  formalEnglish: string,
  targetLanguage: string,
  regionName: string
): Promise<string> {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        text: `Translate this formal civic complaint into ${targetLanguage} (used in ${regionName}). Maintain formal government-complaint tone. Return ONLY the translated text, no commentary.

ENGLISH TEXT:
"""${formalEnglish}"""`,
      },
    ],
  };

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Claude translation failed: ${res.status}`);

  const data = await res.json();
  return data.content[0].text.trim();
}

/**
 * C. PDF REPORT BUILDER — Generate formal complaint PDF content
 * Returns structured HTML that can be rendered to PDF via an Edge Function
 */
export async function generateComplaintReportContent(params: {
  photo_url: string;
  category: string;
  description_formal: string;
  description_regional: string;
  gps_lat: number;
  gps_lng: number;
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_ratings: number;
  language: string;
  wardInfo?: string;
}): Promise<string> {
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        text: `Generate a formal government complaint report as clean HTML (no CSS needed, just semantic HTML for PDF rendering).

DATA:
- Category: ${params.category}
- Location: ${params.gps_lat}, ${params.gps_lng}${params.wardInfo ? ` (${params.wardInfo})` : ''}
- Formal Complaint (English): """${params.description_formal}"""
- Regional Translation: """${params.description_regional}"""
- Citizen Ratings: 🔴 ${params.red_count} Critical | 🟡 ${params.yellow_count} Needs Attention | 🟢 ${params.green_count} Looks Fixed
- Total Petitioners: ${params.total_ratings}

Structure the HTML with:
1. Official header: "CIVIC COMPLAINT — CITIZEN VERIFIED" with date
2. Photo section (use <img src="${params.photo_url}" />)
3. Subject line
4. Location details with GPS coordinates
5. Complaint body (both English and regional language)
6. Rating breakdown table
7. Petition statement: "${params.total_ratings} verified citizens have reported this issue"
8. Footer: "This complaint was generated automatically when the collective reporting threshold was reached. Generated by Civic Crowdsourcing Platform."

Return ONLY valid semantic HTML (no markdown wrapping, no \`\`\`html).`,
      },
    ],
  };

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Claude PDF generation failed: ${res.status}`);

  const data = await res.json();
  return data.content[0].text.trim();
}
