import { Header } from "../components/Header";
import { PersonaCarousel } from "../components/PersonaCarousel";
import { PERSONA_ORDER } from "../data/personaStyles";
import type { OrdalData, PersonaId } from "../types";

interface Props {
  data: OrdalData;
  onPick: (id: PersonaId) => void;
  onHome: () => void;
}

export function PilihPersona({ data, onPick, onHome }: Props) {
  function pickRandom() {
    const id = PERSONA_ORDER[Math.floor(Math.random() * PERSONA_ORDER.length)];
    onPick(id);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 44, paddingBottom: 72 }}>
      <div className="container">
        <Header onLogoClick={onHome} />
      </div>

      <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
        <span className="pill eyebrow">Konsultasi gratis. Serius.</span>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(28px, 5vw, 50px)", lineHeight: 1.1, maxWidth: 740 }}>
          Mau &ldquo;Konsul&rdquo; Sama Siapa <em style={{ fontStyle: "italic", color: "var(--clay)" }}>Hari Ini</em>?
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 560 }}>
          Cerita masalah lo di bawah, pilih yang paling &ldquo;kebaca&rdquo; bisa bantu — dijamin dapet pencerahan nyeleneh
          yang, anjir, bener juga ya.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-faint)" }}>Klik salah satu persona untuk langsung mulai ngobrol.</p>
      </div>

      <PersonaCarousel data={data} onPick={onPick} />

      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" className="btn btn-ghost" onClick={pickRandom}>
          <span aria-hidden="true">🎲</span> Gue gak tau pilih siapa, pilihin aja
        </button>
      </div>

      <div className="container">
        <footer style={{ textAlign: "center" }}>
          <p style={{ margin: "0 auto", maxWidth: 580, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-faint)" }}>
            Ordal.ai.id adalah hiburan satir soal budaya kerja &amp; bisnis di Indonesia. Semua jawaban adalah komedi
            sosial, bukan panduan nyata buat suap-menyuap atau jalur ilegal lain. Butuh bantuan karier yang sungguhan?
            Cari sumber yang kredibel ya.
          </p>
        </footer>
      </div>
    </div>
  );
}
