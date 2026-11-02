import type { Persona } from "../types";
import { PERSONA_STYLES, cardImage } from "../data/personaStyles";

interface Props {
  persona: Persona;
  selected: boolean;
  onPick: (id: Persona["id"]) => void;
}

export function PersonaCard({ persona, selected, onPick }: Props) {
  const style = PERSONA_STYLES[persona.id];
  const img = cardImage(persona.id);

  return (
    <article
      style={{
        background: style.tint,
        borderRadius: 28,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        outline: selected ? "3px solid #BE5B3B" : "3px solid transparent",
        outlineOffset: -3,
        transition: "outline-color 0.15s ease",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "4 / 5", overflow: "hidden" }}>
        <picture>
          <source srcSet={img.webp} type="image/webp" />
          <img
            src={img.jpg}
            alt={`Ilustrasi karikatur ${persona.name}`}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </picture>
      </div>
      <div style={{ padding: "22px 22px 26px", display: "flex", flexDirection: "column", gap: 10, flexGrow: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            {persona.name}
          </h3>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: style.accent,
              background: "rgba(255,255,255,.55)",
              padding: "4px 9px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {persona.role}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-soft)", fontStyle: "italic" }}>
          &ldquo;{persona.tagline}&rdquo;
        </p>
        <button
          type="button"
          onClick={() => onPick(persona.id)}
          style={{
            marginTop: 6,
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--ink)",
            color: "var(--cream)",
            border: "none",
            borderRadius: 999,
            padding: "11px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Mulai Konsultasi <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
