import { useState } from "react";
import { useOrdalData } from "./data/useOrdalData";
import { Landing } from "./pages/Landing";
import { PilihPersona } from "./pages/PilihPersona";
import { ChatRoom } from "./pages/ChatRoom";
import { HasilShare } from "./pages/HasilShare";
import type { ConsultationResult, PersonaId } from "./types";

type View = "landing" | "pilih" | "chat" | "hasil";

export default function App() {
  const { data, loading, error } = useOrdalData();
  const [view, setView] = useState<View>("landing");
  const [personaId, setPersonaId] = useState<PersonaId | null>(null);
  const [result, setResult] = useState<ConsultationResult | null>(null);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
        Memuat Ordal.ai.id…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--clay-dark)", textAlign: "center", padding: 24 }}>
        Gagal memuat data persona: {error ?? "data kosong"}.
      </div>
    );
  }

  if (view === "landing") {
    return <Landing data={data} onStart={() => setView("pilih")} />;
  }

  if (view === "pilih") {
    return (
      <PilihPersona
        data={data}
        onHome={() => setView("landing")}
        onPick={(id) => {
          setPersonaId(id);
          setView("chat");
        }}
      />
    );
  }

  if (view === "chat" && personaId) {
    return (
      <ChatRoom
        data={data}
        personaId={personaId}
        onBack={() => setView("pilih")}
        onFinish={(r) => {
          setResult(r);
          setView("hasil");
        }}
      />
    );
  }

  if (view === "hasil" && result) {
    return (
      <HasilShare
        data={data}
        result={result}
        onHome={() => setView("landing")}
        onRestart={() => setView("pilih")}
      />
    );
  }

  // Fallback — shouldn't normally hit this (view is always paired with the state it needs).
  return <Landing data={data} onStart={() => setView("pilih")} />;
}
