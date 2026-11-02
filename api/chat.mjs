// Vercel serverless function — AI fallback for the chat room.
// Only called when the client's scripted-scenario matcher (src/lib/matching.ts)
// finds nothing above threshold. Keeps the AI provider's API key server-side only.
//
// Default provider: Anthropic (Claude Haiku — cheap/fast, per ANTHROPIC_MODEL).
// No ANTHROPIC_API_KEY configured => responds 503 and the client shows a
// scripted "lagi gak nyambung" line instead (see src/lib/chat.ts OFFLINE_FALLBACK).

const MAX_BODY = 8000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "POST only." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: "AI fallback not configured (ANTHROPIC_API_KEY missing)." });
    return;
  }

  let payload;
  try {
    const raw = typeof req.body === "string" ? req.body : await readBody(req);
    payload = typeof req.body === "object" && req.body ? req.body : JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: "Send JSON with personaId, systemPrompt, message." });
    return;
  }

  const systemPrompt = typeof payload.systemPrompt === "string" ? payload.systemPrompt.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];
  const maxTokens = Number.isFinite(payload.maxTokens) ? Math.min(300, Math.max(40, payload.maxTokens)) : 120;

  if (!systemPrompt || !message) {
    sendJson(res, 400, { error: "Missing systemPrompt or message." });
    return;
  }

  const anthropicMessages = history
    .filter((turn) => turn && typeof turn.text === "string" && (turn.role === "user" || turn.role === "persona"))
    .map((turn) => ({ role: turn.role === "user" ? "user" : "assistant", content: turn.text }));
  anthropicMessages.push({ role: "user", content: message });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: maxTokens,
        temperature: 0.85,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      sendJson(res, 502, { error: `AI provider error (${response.status}): ${errText.slice(0, 200)}` });
      return;
    }

    const json = await response.json();
    const text = json?.content?.find((block) => block.type === "text")?.text?.trim();
    if (!text) {
      sendJson(res, 502, { error: "AI provider returned no text." });
      return;
    }
    sendJson(res, 200, { text });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : "AI call failed." });
  }
}
