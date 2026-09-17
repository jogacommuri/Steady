// Proxies calorie estimation to Claude so the Anthropic API key never ships
// inside the app bundle. Deployed with Supabase's default JWT verification
// (no `--no-verify-jwt` flag, no override in supabase/config.toml), so only
// requests carrying a valid Supabase session — including anonymous sessions,
// which is what the app signs in with by default — reach this code at all.
//
// Deploy:
//   supabase functions deploy estimate-calories
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Request:  POST { text: string }
// Response: { calories: number } | { calories: null, reason: string }
// (mirrors lib/nutrition.ts's CalorieEstimate shape, so the client's
// interpretation of "no estimate" doesn't change no matter which provider
// is behind this function.)

import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const SYSTEM_PROMPT =
  'You estimate calories for a home-cooked meal described in casual free text, ' +
  'with no quantities given. Respond with ONLY a compact JSON object, no other ' +
  'text, no markdown fences: {"calories": <integer>} for your best estimate of ' +
  'a typical single serving, or {"calories": null, "reason": "<short reason>"} ' +
  "if the text doesn't plausibly describe food at all.";

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

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const block = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    );
    if (!block) {
      return json({ calories: null, reason: 'no text response from model' });
    }

    const parsed = JSON.parse(block.text.trim());
    const calories =
      typeof parsed.calories === 'number' && parsed.calories > 0
        ? Math.round(parsed.calories)
        : null;
    return json({
      calories,
      reason: calories == null ? parsed.reason ?? 'model returned no estimate' : undefined,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return json({ calories: null, reason: `Claude request failed: ${reason}` });
  }
});
