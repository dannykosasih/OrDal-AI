import { forwardRef } from "react";
import type { Persona } from "../types";
import { PERSONA_STYLES, avatarImage } from "../data/personaStyles";

interface Props {
  persona: Persona;
  question: string;
  answer: string;
}

/**
 * 1080x1350 share card — same layout/spec as the approved Claude Design artifact
 * (Kartu Pilih Persona & Share Card). Rendered at full size and captured to PNG
 * with html-to-image in HasilShare.tsx; the page displays it scaled down via CSS.
 */
export const ShareCardView = forwardRef<HTMLDivElement, Props>(({ persona, question, answer }, ref) => {
  const style = PERSONA_STYLES[persona.id];
  const avatar = avatarImage(persona.id);

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(180deg, ${style.tint} 0%, #FBF3E1 42%)`,
        fontFamily: "var(--font-body)",
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 60,
          width: 122,
          height: 122,
          borderRadius: "50%",
          border: `3px dashed ${style.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-12deg)",
          textAlign: "center",
          padding: 10,
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: style.accent, lineHeight: 1.35 }}>
          Asli Nyeleneh, Bener Juga
        </span>
      </div>

      <div style={{ padding: "60px 64px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 28, letterSpacing: "-0.02em" }}>
          ordal<span style={{ color: "var(--clay)" }}>.ai.id</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
        <span
          style={{
            background: "var(--ink)",
            color: "var(--cream)",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "9px 20px",
            borderRadius: 999,
          }}
        >
          Hasil Konsultasi
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 34 }}>
        <img
          src={avatar.jpg}
          alt={`Ilustrasi karikatur ${persona.name}`}
          style={{
            width: 168,
            height: 168,
            borderRadius: "50%",
            objectFit: "cover",
            border: "6px solid #FBF3E1",
            boxShadow: "0 2px 0 rgba(42,30,20,.12)",
          }}
        />
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32 }}>{persona.name}</h2>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: style.accent,
            background: "rgba(255,255,255,.6)",
            padding: "6px 16px",
            borderRadius: 999,
          }}
        >
          {persona.role}
        </span>
      </div>

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 86px 0", gap: 22 }}>
        <span aria-hidden="true" style={{ fontFamily: "var(--font-display)", fontSize: 96, lineHeight: 0.5, color: style.accent, opacity: 0.45 }}>
          &ldquo;
        </span>
        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500, fontSize: 31, lineHeight: 1.4, textAlign: "center" }}>
          {answer}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "0 90px", marginTop: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          Pertanyaan Gue
        </span>
        <p
          style={{
            margin: 0,
            maxWidth: 760,
            textAlign: "center",
            fontSize: 17,
            lineHeight: 1.5,
            color: "var(--ink-soft)",
            background: "rgba(255,255,255,.55)",
            borderRadius: 16,
            padding: "14px 24px",
          }}
        >
          {question}
        </p>
      </div>

      <div
        style={{
          marginTop: 40,
          background: "var(--ink)",
          color: "var(--cream)",
          padding: "30px 64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>3 Resep Sukses: Doa · Modal · Orang Dalam</span>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: "#E8C468" }}>Coba juga di ordal.ai.id →</span>
      </div>
    </div>
  );
});

ShareCardView.displayName = "ShareCardView";
