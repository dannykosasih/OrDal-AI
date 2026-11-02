interface Props {
  listening: boolean;
  supported: boolean;
  onClick: () => void;
  accent: string;
}

export function MicButton({ listening, supported, onClick, accent }: Props) {
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? "Berhenti mendengarkan" : "Tanya pakai suara"}
      title={listening ? "Berhenti mendengarkan" : "Tanya pakai suara"}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "none",
        flexShrink: 0,
        background: listening ? accent : "var(--cream-deep)",
        color: listening ? "#fff" : "var(--ink)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s ease",
      }}
    >
      {listening ? (
        <span style={{ fontSize: 18 }} aria-hidden="true">
          ●
        </span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M19 11a7 7 0 0 1-14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
