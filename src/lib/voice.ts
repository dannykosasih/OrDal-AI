import type { PersonaId } from "../types";
import { PERSONA_STYLES } from "../data/personaStyles";

/**
 * The "Jarvis" layer: each persona talks back with its own voice.
 *
 * Two tiers, tried in order, same pattern as deka-agent-web's /api/danny/tts.mjs:
 *   1. Server premium voice — POST /api/tts (Google Cloud TTS, one distinct voice name
 *      per persona in personaStyles.ts). Only works when GOOGLE_TTS_API_KEY is set.
 *   2. Browser voice — the Web Speech API's speechSynthesis, tuned per persona with a
 *      distinct pitch/rate (and a different installed id-ID system voice, when more than
 *      one exists) so all 6 personas sound different with zero setup, zero API key, zero cost.
 *
 * A module-level "speech token" lets a new reply (or the user hitting stop/mic) cut off
 * whatever is currently playing — the same barge-in idea deka-agent-web uses.
 */

let speechToken = 0;
let currentAudio: HTMLAudioElement | null = null;

function bumpToken() {
  speechToken += 1;
  return speechToken;
}

export function stopSpeaking() {
  bumpToken();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

let cachedVoices: SpeechSynthesisVoice[] = [];
function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

function scoreVoiceForIndonesian(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  if (lang.startsWith("id") || name.includes("indonesia") || name.includes("bahasa")) {
    if (name.includes("google")) return 100;
    if (name.includes("microsoft")) return 80;
    return 60;
  }
  if (lang.startsWith("en")) return 10;
  return 1;
}

function pickBrowserVoice(personaId: PersonaId): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  const ranked = [...voices].sort((a, b) => scoreVoiceForIndonesian(b) - scoreVoiceForIndonesian(a));
  const idVoices = ranked.filter((v) => scoreVoiceForIndonesian(v) >= 60);
  const pool = idVoices.length ? idVoices : ranked;
  const offset = PERSONA_STYLES[personaId].voice.voiceIndexHint;
  return pool[offset % pool.length] ?? pool[0] ?? null;
}

function speakWithBrowser(text: string, personaId: PersonaId, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    const style = PERSONA_STYLES[personaId].voice;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.pitch = style.pitch;
    utterance.rate = style.rate;
    const voice = pickBrowserVoice(personaId);
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    if (token !== speechToken) {
      resolve();
      return;
    }
    window.speechSynthesis.speak(utterance);
  });
}

async function speakWithServer(text: string, personaId: PersonaId, token: number): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, personaId }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (token !== speechToken) return true; // superseded — don't play, but don't fall back either
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Speaks `text` in `personaId`'s voice. Cancels anything already playing first. */
export async function speak(text: string, personaId: PersonaId): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  const token = bumpToken();
  const playedByServer = await speakWithServer(clean, personaId, token);
  if (playedByServer) return;
  if (token !== speechToken) return;
  await speakWithBrowser(clean, personaId, token);
}

// ---------------- Voice input (speech-to-text) ----------------

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceInputSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface VoiceInputHandle {
  stop: () => void;
}

/** One-shot mic capture in Indonesian. Calls onResult with the final transcript. */
export function listenOnce(
  onResult: (transcript: string) => void,
  onError?: (message: string) => void,
): VoiceInputHandle | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    onError?.("Browser ini belum mendukung input suara. Coba pakai Chrome di desktop/Android.");
    return null;
  }
  const recognition = new Ctor();
  recognition.lang = "id-ID";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    if (transcript) onResult(transcript);
  };
  recognition.onerror = (event: any) => {
    onError?.(event?.error ? `Gagal mendengar (${event.error}).` : "Gagal mendengar.");
  };
  recognition.start();
  return { stop: () => recognition.stop() };
}
