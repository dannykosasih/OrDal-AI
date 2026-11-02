// Netlify Function (v2, Request/Response) — AI fallback for the chat room.
// Only called when the client's scripted-scenario matcher (src/lib/matching.ts)
// finds nothing above threshold. Keeps the API key server-side only.
//
// Provider: Google Gemini. No GEMINI_API_KEY configured => responds 503 and the
// client shows a scripted "lagi gak nyambung" line instead (see src/lib/chat.ts
// OFFLINE_FALLBACK).

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "POST only." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(503, { error: "AI fallback not configured (GEMINI_API_KEY missing)." });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Send JSON with personaId, systemPrompt, message." });
  }

  const systemPrompt = typeof payload.systemPrompt === "string" ? payload.systemPrompt.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];
  const maxTokens = Number.isFinite(payload.maxTokens) ? Math.min(300, Math.max(40, payload.maxTokens)) : 120;

  if (!systemPrompt || !message) {
    return json(400, { error: "Missing systemPrompt or message." });
  }

  // Gemini has no separate "assistant" role — the model's own turns are role "model".
  const contents = history
    .filter((turn) => turn && typeof turn.text === "string" && (turn.role === "user" || turn.role === "persona"))
    .map((turn) => ({ role: turn.role === "user" ? "user" : "model", parts: [{ text: turn.text }] }));
  contents.push({ role: "user", parts: [{ text: message }] });

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.85, maxOutputTokens: maxTokens },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      return json(502, { error: `AI provider error (${response.status}): ${errText.slice(0, 200)}` });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      const blockReason = data?.promptFeedback?.blockReason;
      return json(502, {
        error: blockReason ? `AI provider blocked the response (${blockReason}).` : "AI provider returned no text.",
      });
    }
    return json(200, { text });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "AI call failed." });
  }
};
