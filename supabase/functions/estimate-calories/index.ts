// Proxies calorie estimation to OpenAI so the API key never ships inside
// the app bundle. Deployed with Supabase's default JWT verification
// (no `--no-verify-jwt` flag, no override in supabase/config.toml), so only
// requests carrying a valid Supabase session — including anonymous sessions,
// which is what the app signs in with by default — reach this code at all.
//
// Deploy:
//   supabase functions deploy estimate-calories
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase secrets set OPENAI_MODEL=gpt-4o-mini   # optional — this is the default
//
// Request:  POST { text: string }
// Response: { calories: number } | { calories: null, reason: string }
// (mirrors lib/nutrition.ts's CalorieEstimate shape, so the client's
// interpretation of "no estimate" doesn't change no matter which provider
// is behind this function.)
//
// Raw fetch, not the openai npm SDK — one simple, stable endpoint (Chat
// Completions + JSON mode), and it sidesteps any question of whether that
// SDK's Node-oriented bits import cleanly under Deno.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT =
  'You estimate calories for a home-cooked meal described in casual free text, ' +
  'with no quantities given. Respond with ONLY a compact JSON object, no other ' +
  'text, no markdown fences: {"calories": <integer>} for your best estimate of ' +
  'a typical single serving, or {"calories": null, "reason": "<short reason>"} ' +
  "if the text doesn't plausibly describe food at all.";

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
    return json({ calories: null, reason: 'method not allowed' }, 405);
  }

  let text: string;
  try {
    const body = await req.json();
    text = String(body?.text ?? '').trim();
  } catch {
    return json({ calories: null, reason: 'invalid request body' }, 400);
  }
  if (!text) {
    return json({ calories: null, reason: 'empty meal text' });
  }
  if (!OPENAI_API_KEY) {
    return json({ calories: null, reason: 'OPENAI_API_KEY not configured' });
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
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return json({
        calories: null,
        reason: `OpenAI HTTP ${res.status}: ${body.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
      return json({ calories: null, reason: 'no content in OpenAI response' });
    }

    const parsed = JSON.parse(content.trim());
    const calories =
      typeof parsed.calories === 'number' && parsed.calories > 0
        ? Math.round(parsed.calories)
        : null;
    return json({
      calories,
      reason: calories == null ? parsed.reason ?? 'model returned no estimate' : undefined,
    });
  } catch (e) {
    const reason = errorMessage(e);
    return json({ calories: null, reason: `OpenAI request failed: ${reason}` });
  }
});
