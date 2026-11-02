// Netlify Function (v2, Request/Response) — premium per-persona voice.
// Same provider/voice mapping as before (Google Cloud Text-to-Speech, same
// pattern as deka-agent-web's /api/danny/tts.mjs); only the function runtime
// wrapper changed from Vercel's (req,res) style to Netlify's Request/Response.
// Without GOOGLE_TTS_API_KEY this responds 503 and the client falls back to
// the free Web Speech API voice automatically (see src/lib/voice.ts).

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

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return json(503, { error: "Premium voice not configured. The browser voice works without GOOGLE_TTS_API_KEY." });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Send JSON with text and personaId." });
  }

  const text = typeof payload.text === "string" ? payload.text.trim().slice(0, MAX_CHARS) : "";
  const personaId = typeof payload.personaId === "string" ? payload.personaId : "";
  const voiceName = PERSONA_VOICES[personaId];
  if (!text || !voiceName) {
    return json(400, { error: "Missing/unknown text or personaId." });
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
      return json(502, { error: `Google TTS failed (${response.status}): ${raw.slice(0, 200)}` });
    }

    const parsed = JSON.parse(raw);
    const audioContent = parsed?.audioContent;
    if (typeof audioContent !== "string" || !audioContent) {
      return json(502, { error: "Google TTS response had no audioContent." });
    }

    const buffer = Buffer.from(audioContent, "base64");
    return new Response(buffer, {
      status: 200,
      headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Speech synthesis failed." });
  }
};
