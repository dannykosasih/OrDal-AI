import { useState } from "react";
import type { OrdalData, PersonaId } from "../types";
import { PERSONA_ORDER, PERSONA_STYLES, cardImage } from "../data/personaStyles";

interface Props {
  data: OrdalData;
  onPick: (id: PersonaId) => void;
}

// Duplicated once so the track can loop seamlessly (-50% = exactly one full set).
const LOOP: PersonaId[] = [...PERSONA_ORDER, ...PERSONA_ORDER];

/**
 * Full-bleed, continuously-scrolling row of persona cards. Clicking a card
 * freezes the track right there (visual confirmation) and then takes the
 * user straight into that persona's chat — no separate "pilih lalu konfirmasi"
 * step, each card acts as its own direct link.
 */
export function PersonaCarousel({ data, onPick }: Props) {
  const [activeId, setActiveId] = useState<PersonaId | null>(null);

  function handlePick(id: PersonaId) {
    if (activeId) return; // already navigating, ignore further clicks
    setActiveId(id);
    window.setTimeout(() => onPick(id), 220);
  }

  return (
    <div className="carousel-bleed">
      <div className={`carousel-track${activeId ? " is-paused" : ""}`}>
        {LOOP.map((id, i) => {
          const persona = data.personas[id];
          const style = PERSONA_STYLES[id];
          const img = cardImage(id);
          const isActive = activeId === id;
          return (
            <button
              key={`${id}-${i}`}
              type="button"
              className="carousel-card"
              onClick={() => handlePick(id)}
              style={{
                background: style.tint,
                outlineColor: isActive ? "var(--clay)" : "transparent",
                transform: isActive ? "scale(1.04)" : undefined,
              }}
            >
              <span className="carousel-card-img">
                <picture>
                  <source srcSet={img.webp} type="image/webp" />
                  <img src={img.jpg} alt={`Ilustrasi karikatur ${persona.name}`} loading="lazy" />
                </picture>
              </span>
              <span className="carousel-card-body">
                <span className="carousel-card-row">
                  <span className="carousel-card-name">{persona.name}</span>
                  <span className="carousel-card-role" style={{ color: style.accent }}>
                    {persona.role}
                  </span>
                </span>
                <span className="carousel-card-quote">&ldquo;{persona.tagline}&rdquo;</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
