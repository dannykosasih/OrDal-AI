interface Props {
  onLogoClick?: () => void;
}

export function Header({ onLogoClick }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        paddingTop: 28,
        paddingBottom: 8,
      }}
    >
      <button
        type="button"
        onClick={onLogoClick}
        style={{
          background: "none",
          border: "none",
          cursor: onLogoClick ? "pointer" : "default",
          padding: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: 24,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        ordal<span style={{ color: "var(--clay)" }}>.ai.id</span>
      </button>
      <div className="pill" style={{ background: "var(--cream-deep)", color: "var(--ink-soft)" }}>
        Doa · Modal · Orang Dalam
      </div>
    </div>
  );
}
