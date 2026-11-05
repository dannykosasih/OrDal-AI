// Netlify Function (v2, Request/Response) — every chat turn goes through this.
// Grounds the model in the active persona's full system_prompt so the character and
// its guardrails stay consistent even for completely free-form questions. API key
// stays server-side only.
//
// Provider: Google Gemini. No GEMINI_API_KEY configured => responds 503 and the
// client shows a scripted "lagi gak nyambung" line instead (see src/lib/chat.ts
// OFFLINE_FALLBACK). Any failure here is logged with console.error so it shows up
// in Netlify's function logs (Site → Logs → Functions) — check there first if
// replies keep looking generic.

const FALLBACK_MODEL = "gemini-flash-latest"; // Google's rolling alias for the current recommended Flash model

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function callGemini(model, apiKey, systemPrompt, contents, maxTokens) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.85, maxOutputTokens: maxTokens },
    }),
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "POST only." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set on this deploy.");
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
  const maxTokens = Number.isFinite(payload.maxTokens) ? Math.min(600, Math.max(40, payload.maxTokens)) : 320;

  if (!systemPrompt || !message) {
    return json(400, { error: "Missing systemPrompt or message." });
  }

  // Gemini has no separate "assistant" role — the model's own turns are role "model".
  const contents = history
    .filter((turn) => turn && typeof turn.text === "string" && (turn.role === "user" || turn.role === "persona"))
    .map((turn) => ({ role: turn.role === "user" ? "user" : "model", parts: [{ text: turn.text }] }));
  contents.push({ role: "user", parts: [{ text: message }] });

  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    let response = await callGemini(primaryModel, apiKey, systemPrompt, contents, maxTokens);

    // One retry against Google's rolling "latest" alias — covers a stale/renamed model id
    // without needing a redeploy, and tells us (via the log) whether that was the problem.
    if (!response.ok && primaryModel !== FALLBACK_MODEL) {
      const firstErr = await response.text();
      console.error(`Gemini call failed for model "${primaryModel}" (${response.status}): ${firstErr.slice(0, 400)}`);
      response = await callGemini(FALLBACK_MODEL, apiKey, systemPrompt, contents, maxTokens);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini call failed (${response.status}): ${errText.slice(0, 400)}`);
      return json(502, { error: `AI provider error (${response.status}): ${errText.slice(0, 200)}` });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      const blockReason = data?.promptFeedback?.blockReason;
      console.error("Gemini returned no text:", JSON.stringify(data).slice(0, 500));
      return json(502, {
        error: blockReason ? `AI provider blocked the response (${blockReason}).` : "AI provider returned no text.",
      });
    }
    return json(200, { text });
  } catch (err) {
    console.error("Gemini call threw:", err);
    return json(500, { error: err instanceof Error ? err.message : "AI call failed." });
  }
};
