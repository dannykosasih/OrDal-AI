import { useState } from "react";
import { Header } from "../components/Header";
import { PersonaCard } from "../components/PersonaCard";
import { PERSONA_ORDER } from "../data/personaStyles";
import type { OrdalData, PersonaId } from "../types";

interface Props {
  data: OrdalData;
  onPick: (id: PersonaId) => void;
  onHome: () => void;
}

export function PilihPersona({ data, onPick, onHome }: Props) {
  const [selected, setSelected] = useState<PersonaId | null>(null);

  function pickRandom() {
    const id = PERSONA_ORDER[Math.floor(Math.random() * PERSONA_ORDER.length)];
    setSelected(id);
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: 52, paddingBottom: 72 }}>
      <Header onLogoClick={onHome} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
        <span className="pill eyebrow">Konsultasi gratis. Serius.</span>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(28px, 5vw, 50px)", lineHeight: 1.1, maxWidth: 740 }}>
          Mau &ldquo;Konsul&rdquo; Sama Siapa <em style={{ fontStyle: "italic", color: "var(--clay)" }}>Hari Ini</em>?
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 560 }}>
          Cerita masalah lo di bawah, pilih yang paling &ldquo;kebaca&rdquo; bisa bantu — dijamin dapet pencerahan nyeleneh
          yang, anjir, bener juga ya.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
        {PERSONA_ORDER.map((id) => (
          <PersonaCard key={id} persona={data.personas[id]} selected={selected === id} onPick={setSelected} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: -20 }}>
        <button type="button" className="btn btn-ghost" onClick={pickRandom}>
          <span aria-hidden="true">🎲</span> Gue gak tau pilih siapa, pilihin aja
        </button>
      </div>

      {selected && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            background: "var(--ink)",
            color: "var(--cream)",
            borderRadius: 20,
            padding: "22px 28px",
          }}
        >
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 500 }}>
            Lo pilih <strong>{data.personas[selected].name}</strong> — siap buka sesi &ldquo;curhat&rdquo; lo?
          </p>
          <button type="button" className="btn btn-clay" onClick={() => onPick(selected)}>
            Mulai Ngobrol <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      <footer style={{ textAlign: "center" }}>
        <p style={{ margin: "0 auto", maxWidth: 580, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-faint)" }}>
          Ordal.ai.id adalah hiburan satir soal budaya kerja &amp; bisnis di Indonesia. Semua jawaban adalah komedi
          sosial, bukan panduan nyata buat suap-menyuap atau jalur ilegal lain. Butuh bantuan karier yang sungguhan?
          Cari sumber yang kredibel ya.
        </p>
      </footer>
    </div>
  );
}
