// Vercel serverless function — premium per-persona voice.
// Same shape as deka-agent-web's /api/danny/tts.mjs: proxies Google Cloud
// Text-to-Speech so the API key never reaches the browser. When
// GOOGLE_TTS_API_KEY isn't set, this responds 503 and the client falls back
// to the free Web Speech API voice automatically (see src/lib/voice.ts).

const MAX_BODY = 4000;
const MAX_CHARS = 600;

// One distinct Google Cloud voice per persona — see src/data/personaStyles.ts
// for the same mapping (kept in sync so premium and fallback stay aligned).
const PERSONA_VOICES = {
  pak_bohir: "id-ID-Wavenet-B",
  mas_kenalan: "id-ID-Wavenet-C",
  bu_acc: "id-ID-Wavenet-A",
  bos_modal: "id-ID-Standard-B",
  bu_evaluator: "id-ID-Wavenet-D",
  orang_bijak: "id-ID-Standard-C",
};

const PERSONA_RATE = {
  pak_bohir: 0.92,
  mas_kenalan: 1.12,
  bu_acc: 1.0,
  bos_modal: 1.05,
  bu_evaluator: 0.9,
  orang_bijak: 0.85,
};

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

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: "Premium voice not configured. The browser voice works without GOOGLE_TTS_API_KEY." });
    return;
  }

  let payload;
  try {
    const raw = typeof req.body === "string" ? req.body : await readBody(req);
    payload = typeof req.body === "object" && req.body ? req.body : JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: "Send JSON with text and personaId." });
    return;
  }

  const text = typeof payload.text === "string" ? payload.text.trim().slice(0, MAX_CHARS) : "";
  const personaId = typeof payload.personaId === "string" ? payload.personaId : "";
  const voiceName = PERSONA_VOICES[personaId];
  if (!text || !voiceName) {
    sendJson(res, 400, { error: "Missing/unknown text or personaId." });
    return;
  }

  const speakingRate = PERSONA_RATE[personaId] ?? 1.0;

  try {
    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "id-ID", name: voiceName },
        audioConfig: { audioEncoding: "MP3", speakingRate: Math.min(1.4, Math.max(0.6, speakingRate)) },
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      sendJson(res, 502, { error: `Google TTS failed (${response.status}): ${raw.slice(0, 200)}` });
      return;
    }

    const parsed = JSON.parse(raw);
    const audioContent = parsed?.audioContent;
    if (typeof audioContent !== "string" || !audioContent) {
      sendJson(res, 502, { error: "Google TTS response had no audioContent." });
      return;
    }

    const buffer = Buffer.from(audioContent, "base64");
    res.writeHead(200, {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
      "content-length": buffer.length,
    });
    res.end(buffer);
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : "Speech synthesis failed." });
  }
}
