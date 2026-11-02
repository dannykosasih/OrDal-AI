import type { PersonaId, Scenario } from "../types";

/**
 * Scripted-response matcher — mirrors the rule in the BRD / ordal-personas-scenarios.json:
 *   - threshold: at least 2 keyword/trigger matches, OR a token-overlap similarity > 0.6
 *   - tie-breaker: highest combined score wins
 * Runs entirely client-side (the scenario bank is static data), so matched answers are
 * instant and free — the AI fallback (src/lib/chat.ts) only fires when nothing clears
 * this bar.
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

/** Jaccard similarity between the user message and one trigger phrase's tokens. */
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface MatchResult {
  scenario: Scenario;
  keywordMatches: number;
  bestSimilarity: number;
  score: number;
}

export function matchScenario(userText: string, scenarios: Scenario[]): MatchResult | null {
  const normalizedUser = normalize(userText);
  const userTokens = tokens(userText);
  if (!normalizedUser) return null;

  let best: MatchResult | null = null;

  for (const scenario of scenarios) {
    let keywordMatches = 0;
    let bestSimilarity = 0;
    for (const trigger of scenario.triggers) {
      const normTrigger = normalize(trigger);
      if (normTrigger && normalizedUser.includes(normTrigger)) keywordMatches += 1;
      const sim = similarity(userTokens, tokens(trigger));
      if (sim > bestSimilarity) bestSimilarity = sim;
    }
    const qualifies = keywordMatches >= 2 || bestSimilarity > 0.6;
    if (!qualifies) continue;
    const score = keywordMatches + bestSimilarity;
    if (!best || score > best.score) {
      best = { scenario, keywordMatches, bestSimilarity, score };
    }
  }

  return best;
}

export function responseFor(match: MatchResult, personaId: PersonaId): string {
  return match.scenario.responses[personaId];
}
