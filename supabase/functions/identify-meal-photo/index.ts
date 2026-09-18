// Proxies meal-photo identification to OpenAI so the API key never ships
// inside the app bundle. Deployed with Supabase's default JWT verification
// (no `--no-verify-jwt` flag, no override in supabase/config.toml), so only
// requests carrying a valid Supabase session — including anonymous sessions,
// which is what the app signs in with by default — reach this code at all.
//
// Sibling to estimate-calories: same OpenAI account/secret, but a separate
// function because the request shape (image, not text), prompt, and
// max_tokens budget (needs room for a description, not just a number) are
// different enough that branching one function on `req.body.image` would
// make both paths harder to read and test.
//
// Deploy:
//   supabase functions deploy identify-meal-photo
//   supabase secrets set OPENAI_API_KEY=sk-...   # shared with estimate-calories
//   supabase secrets set OPENAI_MODEL=gpt-4o-mini   # optional — this is the default
//
// Request:  POST { image: base64 string (no data: prefix), mimeType?: string }
// Response: { text: string, calories: number | null } | { text: null, calories: null, reason: string }
//
// Raw fetch, not the openai npm SDK — same reasoning as estimate-calories.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Guards against oversized uploads reaching OpenAI (and the Edge Function's
// own request-body limit) — the client resizes/compresses before sending,
// this is a backstop, not the primary control.
const MAX_BASE64_LENGTH = 6_000_000; // ~4.5MB decoded

const SYSTEM_PROMPT =
  'You identify a home-cooked or restaurant meal from a photo. Respond with ONLY a ' +
  'compact JSON object, no other text, no markdown fences: ' +
  '{"text": "<short natural description, e.g. \'grilled chicken, rice, broccoli\'>", ' +
  '"calories": <integer, your best estimate for the visible serving>} — or, if the ' +
  'photo does not plausibly show food, {"text": null, "calories": null, ' +
  '"reason": "<short reason>"}.';

/** Same defensive extraction as lib/errors.ts on the client — not every rejection is an Error instance. */
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ text: null, calories: null, reason: 'method not allowed' }, 405);
  }

  let image: string;
  let mimeType: string;
  try {
    const body = await req.json();
    image = String(body?.image ?? '').trim();
    mimeType = String(body?.mimeType ?? 'image/jpeg').trim() || 'image/jpeg';
  } catch {
    return json({ text: null, calories: null, reason: 'invalid request body' }, 400);
  }
  if (!image) {
    return json({ text: null, calories: null, reason: 'no image provided' });
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return json({ text: null, calories: null, reason: 'image too large' });
  }
  if (!OPENAI_API_KEY) {
    return json({ text: null, calories: null, reason: 'OPENAI_API_KEY not configured' });
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify the meal in this photo.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return json({
        text: null,
        calories: null,
        reason: `OpenAI HTTP ${res.status}: ${body.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return json({ text: null, calories: null, reason: 'no content in OpenAI response' });
    }

    const parsed = JSON.parse(content.trim());
    const text = typeof parsed.text === 'string' && parsed.text.trim() ? parsed.text.trim() : null;
    const calories =
      typeof parsed.calories === 'number' && parsed.calories > 0 ? Math.round(parsed.calories) : null;
    return json({
      text,
      calories,
      reason: text == null ? parsed.reason ?? 'no food recognized in photo' : undefined,
    });
  } catch (e) {
    const reason = errorMessage(e);
    return json({ text: null, calories: null, reason: `OpenAI request failed: ${reason}` });
  }
});
