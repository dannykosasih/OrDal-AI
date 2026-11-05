import { Header } from "../components/Header";
import { PERSONA_ORDER, avatarImage } from "../data/personaStyles";
import type { OrdalData } from "../types";

interface Props {
  data: OrdalData;
  onStart: () => void;
}

export function Landing({ data, onStart }: Props) {
  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: 56, paddingBottom: 72 }}>
      <Header />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20, paddingTop: 24 }}>
        <span className="pill eyebrow">Konsultasi gratis. Serius.</span>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(32px, 6vw, 56px)",
            lineHeight: 1.1,
            maxWidth: 820,
          }}
        >
          3 Resep Sukses Berbisnis di Indonesia:
          <br />
          <em style={{ fontStyle: "italic", color: "var(--clay)" }}>Doa, Modal, dan Orang Dalam</em>
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6, color: "var(--ink-soft)", maxWidth: 580 }}>
          {data.meta.description.replace("Data persona dan skenario untuk chatbot satir Ordal.ai.id.", "").trim() ||
            "Cerita masalah kerjaan atau bisnis lo ke salah satu dari 6 persona di bawah. Dijamin dapet pencerahan yang nyeleneh — tapi anjir, bener juga ya."}
        </p>
        <button type="button" className="btn btn-clay" style={{ fontSize: 16, padding: "15px 30px" }} onClick={onStart}>
          Mulai Konsultasi <span aria-hidden="true">→</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        {PERSONA_ORDER.map((id) => {
          const persona = data.personas[id];
          const img = avatarImage(id);
          return (
            <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 86 }}>
              <picture>
                <source srcSet={img.webp} type="image/webp" />
                <img
                  src={img.jpg}
                  alt={persona.name}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #fff" }}
                />
              </picture>
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{persona.name}</span>
            </div>
          );
        })}
      </div>

      <footer style={{ textAlign: "center" }}>
        <p style={{ margin: "0 auto", maxWidth: 580, fontSize: 15, lineHeight: 1.6, color: "var(--ink-faint)" }}>
          Ordal.ai.id adalah hiburan satir soal budaya kerja &amp; bisnis di Indonesia. Semua jawaban adalah komedi
          sosial, bukan panduan nyata buat suap-menyuap atau jalur ilegal lain. Butuh bantuan karier yang sungguhan?
          Cari sumber yang kredibel ya.
        </p>
      </footer>
    </div>
  );
}
