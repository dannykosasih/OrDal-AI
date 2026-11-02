import type { ChatMessage, OrdalData, Persona, PersonaId } from "../types";
import { matchScenario, responseFor } from "./matching";

export interface ReplyOutcome {
  text: string;
  source: "scripted" | "ai" | "fallback-offline";
  followUps: string[];
}

const OFFLINE_FALLBACK: Record<PersonaId, string> = {
  pak_bohir: "Hmm, pertanyaan lo di luar jangkauan gue saat ini. Coba cerita masalah lo dengan kata lain, atau pilih salah satu quick-reply di bawah.",
  mas_kenalan: "Waduh, gue lagi gak nyambung sama pertanyaan itu. Coba kata lain deh, atau klik salah satu topik di bawah.",
  bu_acc: "Secara sistem, pertanyaan itu belum bisa saya proses sekarang. Coba ulangi dengan kalimat lain, atau pilih topik yang tersedia.",
  bos_modal: "Gak kebaca. Coba lebih spesifik, atau pilih salah satu topik di bawah.",
  bu_evaluator: "Jujur, saya belum nangkep maksud pertanyaan lo. Coba tulis ulang, atau klik salah satu topik.",
  orang_bijak: "Maaf, Nak, pertanyaan itu belum bisa Bapak jawab saat ini. Coba ceritakan lagi dengan kata lain, atau pilih salah satu topik di bawah.",
};

/**
 * Orchestrates one turn: scripted scenario match first (instant, free), then AI
 * fallback via /api/chat.mjs (only fires when nothing in the scenario bank clears
 * the match threshold — see src/lib/matching.ts).
 */
export async function getReply(
  userText: string,
  persona: Persona,
  data: OrdalData,
  history: ChatMessage[],
): Promise<ReplyOutcome> {
  const match = matchScenario(userText, data.scenarios);
  if (match) {
    return {
      text: responseFor(match, persona.id as PersonaId),
      source: "scripted",
      followUps: match.scenario.follow_up_quick_replies,
    };
  }

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
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = (await res.json()) as { text?: string; error?: string };
    if (json.text) {
      return { text: json.text, source: "ai", followUps: [] };
    }
    throw new Error(json.error || "empty AI response");
  } catch {
    return {
      text: OFFLINE_FALLBACK[persona.id as PersonaId],
      source: "fallback-offline",
      followUps: [],
    };
  }
}
