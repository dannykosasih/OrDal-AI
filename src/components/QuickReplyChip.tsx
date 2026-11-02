interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function QuickReplyChip({ label, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "1.5px solid rgba(42,30,20,.18)",
        background: "#fff",
        color: "var(--ink)",
        borderRadius: 999,
        padding: "9px 16px",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
