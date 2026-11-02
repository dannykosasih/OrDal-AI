import { useEffect, useState } from "react";
import type { OrdalData, PersonaId } from "../types";

interface State {
  data: OrdalData | null;
  loading: boolean;
  error: string | null;
}

let cached: OrdalData | null = null;

/**
 * ordal-personas-scenarios.json keys each persona by id (e.g. "pak_bohir") but
 * doesn't repeat that id inside the object itself. The UI reads `persona.id` in
 * several places (image lookups, voice styling), so stamp it in once on load
 * rather than threading the dictionary key through every component.
 */
function withPersonaIds(raw: OrdalData): OrdalData {
  const personas = Object.fromEntries(
    Object.entries(raw.personas).map(([id, persona]) => [id, { ...persona, id: id as PersonaId }]),
  ) as OrdalData["personas"];
  return { ...raw, personas };
}

/** Loads public/data/ordal-personas-scenarios.json once and caches it in memory. */
export function useOrdalData(): State {
  const [state, setState] = useState<State>({
    data: cached,
    loading: !cached,
    error: null,
  });

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetch("/data/ordal-personas-scenarios.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat data (${res.status})`);
        return res.json();
      })
      .then((rawJson: OrdalData) => {
        if (cancelled) return;
        const json = withPersonaIds(rawJson);
        cached = json;
        setState({ data: json, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
