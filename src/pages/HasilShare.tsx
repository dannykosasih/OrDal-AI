import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Header } from "../components/Header";
import { ShareCardView } from "../components/ShareCardView";
import type { ConsultationResult, OrdalData } from "../types";

interface Props {
  data: OrdalData;
  result: ConsultationResult;
  onRestart: () => void;
  onHome: () => void;
}

export function HasilShare({ data, result, onRestart, onHome }: Props) {
  const persona = data.personas[result.personaId];
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 1, cacheBust: true });
      const link = document.createElement("a");
      link.download = `ordal-hasil-konsultasi-${persona.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  async function share() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 1, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "ordal-hasil-konsultasi.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Ordal.ai.id — Hasil Konsultasi",
          text: "Gue baru konsultasi di Ordal.ai.id, nih hasilnya 👀",
        });
        return;
      }
    } catch {
      // user cancelled or share unsupported — fall through to download
    }
    void download();
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 72 }}>
      <Header onLogoClick={onHome} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
        <span className="pill eyebrow">Hasil Konsultasi</span>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(26px, 4.5vw, 40px)" }}>
          Nih, kata {persona.name}.
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "var(--ink-soft)", maxWidth: 480 }}>
          Download atau share kartunya, atau coba persona lain buat sudut pandang yang beda.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "min(100%, 420px)",
            aspectRatio: "1080 / 1350",
            overflow: "hidden",
            borderRadius: 20,
            boxShadow: "0 8px 30px rgba(42,30,20,.18)",
          }}
        >
          <div style={{ width: 1080, height: 1350, transform: "scale(0.3889)", transformOrigin: "top left" }}>
            <ShareCardView ref={cardRef} persona={persona} question={result.question} answer={result.answer} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-clay" onClick={share} disabled={downloading}>
          {downloading ? "Menyiapkan…" : "Share Hasil"} <span aria-hidden="true">↗</span>
        </button>
        <button type="button" className="btn btn-primary" onClick={download} disabled={downloading}>
          Download PNG
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRestart}>
          Coba Persona Lain
        </button>
      </div>

      <footer style={{ textAlign: "center" }}>
        <p style={{ margin: "0 auto", maxWidth: 580, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-faint)" }}>
          Ordal.ai.id adalah hiburan satir. Semua jawaban adalah komedi sosial, bukan panduan nyata.
        </p>
      </footer>
    </div>
  );
}
