import type { PersonaId, PersonaStyle } from "../types";

/**
 * Visual tint/accent (matches the approved Kartu Pilih Persona / Share Card design)
 * plus the voice identity for each persona — this is the "beda-beda suaranya" part.
 *
 * Voice strategy (see src/lib/voice.ts):
 *  1. Free, zero-setup default: the browser's own Web Speech API, tuned per persona
 *     with distinct pitch/rate (and a different installed id-ID voice when the device
 *     has more than one) so all 6 personas are audibly different out of the box.
 *  2. Optional upgrade: when GOOGLE_TTS_API_KEY is set on the server, /api/tts.mjs
 *     synthesizes with a real, distinct Google Cloud voice per persona (googleVoiceName
 *     below) — same pattern as deka-agent-web's /api/danny/tts.mjs.
 */
export const PERSONA_STYLES: Record<PersonaId, PersonaStyle> = {
  pak_bohir: {
    tint: "#F6E8C7",
    accent: "#8A6A1F",
    voice: { pitch: 0.75, rate: 0.92, voiceIndexHint: 0 },
    googleVoiceName: "id-ID-Wavenet-B", // male, deep, unhurried
  },
  mas_kenalan: {
    tint: "#CDEDE4",
    accent: "#1F6E5C",
    voice: { pitch: 1.18, rate: 1.14, voiceIndexHint: 1 },
    googleVoiceName: "id-ID-Wavenet-C", // male, younger/chattier
  },
  bu_acc: {
    tint: "#F5E1DE",
    accent: "#9C4A3C",
    voice: { pitch: 1.05, rate: 1.0, voiceIndexHint: 2 },
    googleVoiceName: "id-ID-Wavenet-A", // female, crisp/formal
  },
  bos_modal: {
    tint: "#DCE7D2",
    accent: "#466B3B",
    voice: { pitch: 0.85, rate: 1.08, voiceIndexHint: 3 },
    googleVoiceName: "id-ID-Standard-B", // male, brisk
  },
  bu_evaluator: {
    tint: "#E3E0EC",
    accent: "#5B4E8C",
    voice: { pitch: 0.95, rate: 0.88, voiceIndexHint: 4 },
    googleVoiceName: "id-ID-Wavenet-D", // female, tired/flat
  },
  orang_bijak: {
    tint: "#F3E9D2",
    accent: "#8A5A22",
    voice: { pitch: 0.8, rate: 0.82, voiceIndexHint: 5 },
    googleVoiceName: "id-ID-Standard-C", // male, warm/slow
  },
};

export const PERSONA_ORDER: PersonaId[] = [
  "pak_bohir",
  "mas_kenalan",
  "bu_acc",
  "bos_modal",
  "bu_evaluator",
  "orang_bijak",
];

export function cardImage(id: PersonaId) {
  const slug = id.replace(/_/g, "-");
  return { jpg: `/assets/card/${slug}.jpg`, webp: `/assets/card/${slug}.webp` };
}

export function avatarImage(id: PersonaId) {
  const slug = id.replace(/_/g, "-");
  return { jpg: `/assets/avatar/${slug}.jpg`, webp: `/assets/avatar/${slug}.webp` };
}
