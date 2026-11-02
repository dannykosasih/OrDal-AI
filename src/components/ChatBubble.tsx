import type { ChatMessage } from "../types";

interface Props {
  message: ChatMessage;
  accent: string;
}

export function ChatBubble({ message, accent }: Props) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-faint)", margin: "8px 0" }}>
        {message.text}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", margin: "6px 0" }}>
      <div
        style={{
          maxWidth: "80%",
          padding: "12px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "var(--ink)" : "#fff",
          color: isUser ? "var(--cream)" : "var(--ink)",
          fontSize: 15,
          lineHeight: 1.5,
          boxShadow: isUser ? "none" : "0 1px 0 rgba(42,30,20,.08)",
          borderLeft: isUser ? "none" : `3px solid ${accent}`,
        }}
      >
        {message.text}
      </div>
    </div>
  );
}
