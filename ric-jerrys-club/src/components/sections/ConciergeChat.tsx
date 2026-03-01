"use client";

import { useState, useRef, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CHAT_RESPONSES: Record<string, string> = {
  next: "Your next available slot is tomorrow at 6:30 AM — Boat #2 (Nautique G23). Conditions forecast: flatness 9.4, wind <0.5mph. Want me to lock it in?",
  condition:
    "Right now: Water 72.4°F, flatness 9.8/10, wind 0.3mph from the SW. This is as close to perfect glass as you'll get. Dawn patrol tomorrow (5:45AM) looks even better.",
  book: "Wednesday 6AM is blocked — wind picks up after 8AM. I'd suggest 5:30AM Wednesday or 6AM Saturday for prime glass. Shall I book Saturday? Boat #1 is wide open.",
  rope: "Based on your last 8 sessions — your 28-off average is 4.2/6 buoys. I'd suggest staying at 28-off to consolidate the gate before pushing to 32-off. Your off-side is holding you back.",
  default:
    "Great question. Let me check our current availability and conditions... Based on live data, I'd recommend booking a dawn patrol slot this week — Thursday morning looks ideal with a flatness rating of 9.6 predicted. Want me to block it?",
};

function getResponse(msg: string): string {
  const m = msg.toLowerCase();
  if (
    m.includes("slot") ||
    m.includes("avail") ||
    m.includes("next")
  )
    return CHAT_RESPONSES.next;
  if (
    m.includes("condition") ||
    m.includes("water") ||
    m.includes("glass") ||
    m.includes("wind")
  )
    return CHAT_RESPONSES.condition;
  if (
    m.includes("book") ||
    m.includes("dawn") ||
    m.includes("reserve") ||
    m.includes("wednesday")
  )
    return CHAT_RESPONSES.book;
  if (
    m.includes("rope") ||
    m.includes("equipment") ||
    m.includes("length") ||
    m.includes("gear")
  )
    return CHAT_RESPONSES.rope;
  return CHAT_RESPONSES.default;
}

type Message = { role: "user" | "bot"; text: string };

export function ConciergeChat() {
  const leftRef = useScrollReveal<HTMLDivElement>();
  const rightRef = useScrollReveal<HTMLDivElement>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Good morning. Water temp is 72.4°F, flatness is 9.8/10. Conditions are prime. You have no active bookings — want me to lock in the 6:30AM slot before it's gone?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const send = (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setTyping(true);

    const delay = 1200 + Math.random() * 600;
    const reply = getResponse(text);

    const t = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    }, delay);
    return () => clearTimeout(t);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <section
      id="concierge-section"
      className="bg-[var(--ink)] px-12 py-[120px] max-md:px-6 max-md:py-20"
    >
      <div className="concierge-inner mx-auto grid max-w-[1300px] grid-cols-1 items-center gap-20 md:grid-cols-[1fr_1.4fr]">
        <div ref={leftRef} className="concierge-text reveal-left">
          <div className="section-label mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-[var(--teal-glow)]">
            § 06 — AI Concierge
          </div>
          <h2 className="font-display mb-6 leading-[0.88] text-[var(--teal-glow)] max-md:text-3xl md:text-[clamp(3rem,7vw,7rem)]">
            <span className="block">CLUB</span>
            <span className="block">CON</span>
            <span className="block text-[var(--gold)]">CIERGE</span>
          </h2>
          <p className="max-w-[400px] text-[0.95rem] font-light leading-[1.8] text-cloud/55">
            Not a chatbot. An agent. It knows your ski preferences, checks boat
            availability in real-time, books your slot, pulls your last 10 sets
            to suggest the right rope length, and has your coffee order
            remembered from day one.
          </p>
        </div>

        <div ref={rightRef} className="reveal-right">
          <div className="chat-widget overflow-hidden border border-teal-glow/20 bg-[rgba(13,26,24,0.9)] backdrop-blur-[20px]">
            <div className="chat-header flex items-center gap-3 border-b border-teal-glow/15 bg-teal-deep/50 px-6 py-5">
              <div className="chat-avatar flex h-9 w-9 items-center justify-center rounded-full text-base bg-gradient-to-br from-[var(--teal-glow)] to-[var(--teal-mid)]">
                🤿
              </div>
              <div className="chat-info">
                <div className="name text-[0.85rem] font-medium text-[var(--cloud)]">
                  Club Concierge · Ai
                </div>
                <div className="status text-[0.65rem] tracking-[0.1em] text-[var(--teal-glow)]">
                  ● Online · Watching conditions
                </div>
              </div>
            </div>
            <div className="quick-prompts flex flex-wrap gap-2 px-6 pt-3">
              <button
                type="button"
                data-cursor-hover
                onClick={() => send("Check my next available slot")}
                className="quick-btn border border-teal-glow/25 bg-transparent px-3 py-1.5 text-[0.7rem] tracking-[0.08em] text-cloud/60 transition-colors hover:border-[var(--teal-glow)] hover:text-[var(--teal-glow)]"
              >
                Next slot
              </button>
              <button
                type="button"
                data-cursor-hover
                onClick={() => send("What are today's conditions?")}
                className="quick-btn border border-teal-glow/25 bg-transparent px-3 py-1.5 text-[0.7rem] tracking-[0.08em] text-cloud/60 transition-colors hover:border-[var(--teal-glow)] hover:text-[var(--teal-glow)]"
              >
                Conditions today
              </button>
              <button
                type="button"
                data-cursor-hover
                onClick={() => send("Book me a dawn patrol for Wednesday")}
                className="quick-btn border border-teal-glow/25 bg-transparent px-3 py-1.5 text-[0.7rem] tracking-[0.08em] text-cloud/60 transition-colors hover:border-[var(--teal-glow)] hover:text-[var(--teal-glow)]"
              >
                Dawn patrol
              </button>
              <button
                type="button"
                data-cursor-hover
                onClick={() => send("What rope length should I run?")}
                className="quick-btn border border-teal-glow/25 bg-transparent px-3 py-1.5 text-[0.7rem] tracking-[0.08em] text-cloud/60 transition-colors hover:border-[var(--teal-glow)] hover:text-[var(--teal-glow)]"
              >
                Equipment advice
              </button>
            </div>
            <div
              className="chat-messages flex h-[340px] flex-col gap-4 overflow-y-auto p-6"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(78,201,192,0.3) transparent",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg max-w-[80%] rounded px-4 py-3 text-[0.88rem] leading-[1.6] ${
                    msg.role === "bot"
                      ? "msg bot border-l-2 border-[var(--teal-glow)] bg-[rgba(30,74,70,0.5)] text-[var(--cloud)] self-start"
                      : "msg user border-r-2 border-[var(--gold)] bg-gold/15 text-[var(--cloud)] self-end text-right"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {typing && (
                <div className="msg-typing flex gap-1.5 self-start border-l-2 border-[var(--teal-glow)] bg-[rgba(30,74,70,0.5)] px-4 py-3.5">
                  <span
                    className="dot-typing h-1.5 w-1.5 rounded-full bg-[var(--teal-glow)] animate-typingBounce"
                    style={{ animationDelay: "0s" }}
                  />
                  <span
                    className="dot-typing h-1.5 w-1.5 rounded-full bg-[var(--teal-glow)] animate-typingBounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="dot-typing h-1.5 w-1.5 rounded-full bg-[var(--teal-glow)] animate-typingBounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area flex items-center gap-3 border-t border-teal-glow/10 px-6 py-4">
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about conditions, bookings, equipment..."
                className="chat-input flex-1 border border-teal-glow/20 bg-white/5 px-4 py-3 text-[0.85rem] text-[var(--cloud)] outline-none transition-colors placeholder:text-cloud/30 focus:border-[var(--teal-glow)]"
              />
              <button
                type="button"
                data-cursor-hover
                onClick={() => send()}
                className="chat-send bg-[var(--teal-glow)] px-5 py-3 text-[0.8rem] font-medium tracking-[0.1em] text-[var(--ink)] transition-colors hover:bg-[var(--gold)]"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
