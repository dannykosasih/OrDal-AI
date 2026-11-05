import { useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";
import { ChatBubble } from "../components/ChatBubble";
import { QuickReplyChip } from "../components/QuickReplyChip";
import { MicButton } from "../components/MicButton";
import { avatarImage, PERSONA_STYLES } from "../data/personaStyles";
import { getReply } from "../lib/chat";
import { isVoiceInputSupported, listenOnce, speak, stopSpeaking } from "../lib/voice";
import type { ChatMessage, ConsultationResult, OrdalData, PersonaId } from "../types";

interface Props {
  data: OrdalData;
  personaId: PersonaId;
  onFinish: (result: ConsultationResult) => void;
  onBack: () => void;
}

const MAX_TURNS = 5;

export function ChatRoom({ data, personaId, onFinish, onBack }: Props) {
  const persona = data.personas[personaId];
  const style = PERSONA_STYLES[personaId];
  const avatar = avatarImage(personaId);

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "persona", text: persona.opener }]);
  const [input, setInput] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [quickReplies, setQuickReplies] = useState<string[]>(data.scenarios.map((s) => s.quick_reply_label));
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lastQA, setLastQA] = useState<{ question: string; answer: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openerSpoken = useRef(false);

  useEffect(() => {
    if (!muted && !openerSpoken.current) {
      openerSpoken.current = true;
      void speak(persona.opener, personaId);
    }
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const turnsLeft = MAX_TURNS - turnCount;
  const limitReached = turnsLeft <= 0;

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading || limitReached) return;
    setInput("");
    setQuickReplies([]);
    setMessages((prev) => [...prev, { role: "user", text: clean }]);
    setLoading(true);
    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);

    const historySnapshot = messages;
    const outcome = await getReply(clean, persona, data, historySnapshot);

    setMessages((prev) => [...prev, { role: "persona", text: outcome.text }]);
    setLastQA({ question: clean, answer: outcome.text });
    setLoading(false);
    if (!muted) void speak(outcome.text, personaId);

    if (nextTurn >= MAX_TURNS) {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `Sesi konsultasi udah ${MAX_TURNS} giliran — waktunya lihat hasilnya.` },
      ]);
      setQuickReplies([]);
    } else {
      // Every reply now comes straight from the AI, so these aren't "follow-ups" tied to
      // a matched scenario any more — just standing topic ideas in case the user wants one.
      setQuickReplies(data.scenarios.map((s) => s.quick_reply_label));
    }
  }

  function handleMic() {
    if (listening) {
      setListening(false);
      return;
    }
    setListening(true);
    listenOnce(
      (transcript) => {
        setListening(false);
        void send(transcript);
      },
      () => setListening(false),
    );
  }

  function finish() {
    stopSpeaking();
    const fallback = { question: "Gimana caranya sukses berbisnis di Indonesia?", answer: persona.tagline };
    onFinish({ personaId, ...(lastQA ?? fallback) });
  }

  function toggleMute() {
    if (!muted) stopSpeaking();
    setMuted((m) => !m);
  }

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 32, height: "100vh", maxHeight: "100vh" }}>
      <Header onLogoClick={onBack} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, background: style.tint, borderRadius: 20, padding: "14px 18px" }}>
        <button type="button" onClick={onBack} aria-label="Ganti persona" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--ink)" }}>
          ←
        </button>
        <img src={avatar.jpg} alt={persona.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} />
        <div style={{ flexGrow: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{persona.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{persona.role}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600, whiteSpace: "nowrap" }}>
          {Math.max(turnsLeft, 0)} giliran lagi
        </div>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
          title={muted ? "Nyalakan suara" : "Matikan suara"}
          style={{ background: "rgba(255,255,255,.6)", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 15 }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div ref={scrollRef} style={{ flexGrow: 1, overflowY: "auto", padding: "4px 4px 8px" }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} message={m} accent={style.accent} />
        ))}
        {loading && (
          <div style={{ fontSize: 13, color: "var(--ink-faint)", padding: "4px 2px" }}>{persona.name} lagi mikir…</div>
        )}
      </div>

      {quickReplies.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {quickReplies.map((label) => (
            <QuickReplyChip key={label} label={label} onClick={() => send(label)} disabled={loading} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <MicButton listening={listening} supported={isVoiceInputSupported()} onClick={handleMic} accent={style.accent} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={limitReached ? "Sesi selesai — lihat hasil di bawah" : "Ketik curhatan lo di sini…"}
          disabled={limitReached || loading}
          style={{
            flexGrow: 1,
            border: "1.5px solid rgba(42,30,20,.18)",
            borderRadius: 999,
            padding: "13px 18px",
            fontSize: 15,
            fontFamily: "var(--font-body)",
            outline: "none",
            background: "#fff",
          }}
        />
        <button type="button" className="btn btn-primary" onClick={() => send(input)} disabled={limitReached || loading || !input.trim()}>
          Kirim
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button type="button" className="btn btn-clay" onClick={finish} disabled={!lastQA && !limitReached}>
          Selesai &amp; Lihat Hasil <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
