export type PersonaId =
  | "pak_bohir"
  | "mas_kenalan"
  | "bu_acc"
  | "bos_modal"
  | "bu_evaluator"
  | "orang_bijak";

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  tagline: string;
  opener: string;
  system_prompt: string;
}

export interface Scenario {
  scenario_id: string;
  quick_reply_label: string;
  triggers: string[];
  responses: Record<PersonaId, string>;
  follow_up_quick_replies: string[];
}

export interface OrdalData {
  meta: {
    site: string;
    tagline: string;
    description: string;
    matching_rules: {
      method: string;
      threshold: string;
      tie_breaker: string;
      max_turns_per_session: number;
      on_turn_limit: string;
    };
  };
  personas: Record<PersonaId, Persona>;
  scenarios: Scenario[];
  ai_fallback_config: {
    trigger_condition: string;
    model_suggestion: string;
    max_tokens_per_response: number;
    note: string;
  };
  safety_notes: Record<string, string>;
}

/** Visual + voice identity per persona — not in the data JSON, lives alongside the UI. */
export interface PersonaStyle {
  tint: string;
  accent: string;
  /** Web Speech API tuning so each persona is audibly distinct even on one system voice. */
  voice: {
    pitch: number;
    rate: number;
    /** Index offset used to pick a different installed id-ID voice when several exist. */
    voiceIndexHint: number;
  };
  /** Google Cloud TTS voice name used server-side when GOOGLE_TTS_API_KEY is configured. */
  googleVoiceName: string;
}

export interface ChatMessage {
  role: "persona" | "user" | "system";
  text: string;
}

export interface ConsultationResult {
  personaId: PersonaId;
  question: string;
  answer: string;
}
