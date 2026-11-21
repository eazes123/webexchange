"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";

interface Message {
  id:   string;
  role: "user" | "assistant";
  text: string;
  agentRequested?: boolean;
}

const QUICK_QUESTIONS = [
  "How do I deposit USDT?",
  "How does staking work?",
  "When is the loan released?",
  "How to complete KYC?",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      text: "Hi! I'm Nova, NovaBit's AI assistant. How can I help you today?",
    },
  ]);

  useEffect(() => { setMounted(true); }, []);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const historyForApi = messages
    .filter((m) => m.id !== "init")
    .slice(-10)
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      text: m.text,
    }));

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: uid(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: historyForApi }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: data.reply ?? "Sorry, something went wrong. Please try again.",
          agentRequested: data.agentRequested,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", text: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = 0;

  if (!mounted) return null;

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[#1e1e1e] bg-[#0d0d0d]"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#080808] border-b border-[#1e1e1e]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 border border-[#f0b90b]/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#f0b90b]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Nova</p>
                <p className="text-[11px] text-[#22c55e] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === "user"
                    ? "bg-[#f0b90b]/20 border border-[#f0b90b]/30"
                    : "bg-[#111] border border-[#1e1e1e]"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3 h-3 text-[#f0b90b]" />
                    : <Bot  className="w-3 h-3 text-gray-400" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#f0b90b] text-black font-medium rounded-tr-sm"
                    : "bg-[#111] text-gray-200 rounded-tl-sm"
                }`}>
                  {msg.text}
                  {msg.agentRequested && (
                    <div className="mt-2 pt-2 border-t border-[#f0b90b]/20 text-[11px] text-[#f0b90b]/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b]/60 inline-block" />
                      Support team notified
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Bot className="w-3 h-3 text-gray-400" />
                </div>
                <div className="bg-[#111] rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (shown when only greeting exists) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[#111] border border-[#1e1e1e] text-gray-300 hover:border-[#f0b90b]/40 hover:text-[#f0b90b] transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-[#1e1e1e]">
            <div className="flex gap-2 items-center bg-[#080808] rounded-xl border border-[#1e1e1e] px-3 py-2 focus-within:border-[#f0b90b]/40 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                placeholder="Ask anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-[#f0b90b] text-black flex items-center justify-center disabled:opacity-30 hover:bg-[#f0b90b]/90 transition-all disabled:cursor-not-allowed flex-shrink-0">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-1.5">
              AI assistant &middot; Type &quot;agent&quot; for human support
            </p>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed bottom-4 right-4 z-50 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{ width: 52, height: 52, background: open ? "#111" : "#f0b90b", border: "2px solid", borderColor: open ? "#1e1e1e" : "transparent" }}
        aria-label="Chat with Nova"
      >
        {open
          ? <ChevronDown className="w-5 h-5 text-gray-400" />
          : <MessageCircle className="w-5 h-5 text-black" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f6465d] text-[10px] text-white font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
