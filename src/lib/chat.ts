import type { ChatMessage, OrdalData, Persona, PersonaId } from "../types";

export interface ReplyOutcome {
  text: string;
  source: "ai" | "fallback-offline";
}

const OFFLINE_FALLBACK: Record<PersonaId, string> = {
  pak_bohir: "Hmm, pertanyaan lo di luar jangkauan gue saat ini. Coba cerita masalah lo dengan kata lain, atau pilih salah satu topik di bawah.",
  mas_kenalan: "Waduh, gue lagi gak nyambung sama pertanyaan itu. Coba kata lain deh, atau klik salah satu topik di bawah.",
  bu_acc: "Secara sistem, pertanyaan itu belum bisa saya proses sekarang. Coba ulangi dengan kalimat lain, atau pilih topik yang tersedia.",
  bos_modal: "Gak kebaca. Coba lebih spesifik, atau pilih salah satu topik di bawah.",
  bu_evaluator: "Jujur, saya belum nangkep maksud pertanyaan lo. Coba tulis ulang, atau klik salah satu topik.",
  orang_bijak: "Maaf, Nak, pertanyaan itu belum bisa Bapak jawab saat ini. Coba ceritakan lagi dengan kata lain, atau pilih salah satu topik di bawah.",
};

/**
 * Every user turn goes straight to the AI (Google Gemini, via
 * netlify/functions/chat.mjs), grounded in the active persona's full
 * system_prompt so the character and its safety guardrails stay consistent
 * even for completely free-form questions — nothing is limited to the 8
 * scenarios in the data file any more; those are only shown as inspiration
 * chips in ChatRoom.tsx.
 *
 * If the AI call itself fails (no GEMINI_API_KEY configured, network error,
 * provider error), one in-character offline line is shown instead of a raw
 * error — the real error is still logged to the console so it's easy to spot
 * during testing (and the same failure is logged server-side too, in
 * Netlify's function logs).
 */
export async function getReply(
  userText: string,
  persona: Persona,
  data: OrdalData,
  history: ChatMessage[],
): Promise<ReplyOutcome> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personaId: persona.id,
        systemPrompt: persona.system_prompt,
        message: userText,
        history: history.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        maxTokens: data.ai_fallback_config.max_tokens_per_response,
      }),
    });

    const json = (await res.json().catch(() => null)) as { text?: string; error?: string } | null;
    if (res.ok && json?.text) {
      return { text: json.text, source: "ai" };
    }
    throw new Error(json?.error || `status ${res.status}`);
  } catch (err) {
    console.error("Ordal: AI reply failed, showing offline fallback instead.", err);
    return {
      text: OFFLINE_FALLBACK[persona.id as PersonaId],
      source: "fallback-offline",
    };
  }
}
