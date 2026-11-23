"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, Headset } from "lucide-react";

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  agentRequested?: boolean;
}

interface SupportMsg {
  id: string;
  sender: "user" | "admin";
  content: string;
  createdAt: string;
}

type SupportStatus = "none" | "pending" | "active" | "closed";

const QUICK_QUESTIONS = [
  "How do I deposit USDT?",
  "How does staking work?",
  "When is the loan released?",
  "How to complete KYC?",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

const LS_KEY = "nb_support_v1";

function saveToLS(chatId: string | null, status: SupportStatus, agentName: string | null) {
  try {
    if (chatId && status !== "closed") {
      localStorage.setItem(LS_KEY, JSON.stringify({ chatId, status, agentName }));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch {}
}

function loadFromLS(): { chatId: string; status: SupportStatus; agentName: string | null } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.chatId && parsed.status && parsed.status !== "closed") return parsed;
    return null;
  } catch { return null; }
}

export default function ChatWidget() {
  const [mounted, setMounted]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([
    { id: "init", role: "assistant", text: "Hi! I'm Nova, NovaBit's AI assistant. How can I help you today?" },
  ]);

  // Support chat
  const [supportChatId, setSupportChatId]     = useState<string | null>(null);
  const [supportStatus, setSupportStatus]     = useState<SupportStatus>("none");
  const [supportMsgs, setSupportMsgs]         = useState<SupportMsg[]>([]);
  const [supportAgentName, setSupportAgentName] = useState<string | null>(null);
  const [supportSending, setSupportSending]   = useState(false);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [agentOnline, setAgentOnline]         = useState(true);
  const [supportAvailable, setSupportAvailable] = useState(true);
  const lastAdminMsgCountRef                  = useRef(0);
  const pollingRef                            = useRef<ReturnType<typeof setInterval> | null>(null);
  const doPollRef                             = useRef<(() => Promise<void>) | null>(null);
  const openRef                               = useRef(open);
  openRef.current = open;

  // On mount: restore from localStorage, or fall back to server lookup; also fetch global support status
  useEffect(() => {
    setMounted(true);

    // Fetch global support availability
    fetch("/api/support/status", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then((d: { available?: boolean } | null) => {
        if (d && typeof d.available === "boolean") setSupportAvailable(d.available);
      });

    const saved = loadFromLS();
    if (saved) {
      setSupportChatId(saved.chatId);
      setSupportStatus(saved.status);
      if (saved.agentName) setSupportAgentName(saved.agentName);
      return;
    }
    // LS empty — ask server if this user has an active/pending chat
    fetch("/api/support/chat", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data: { chatId?: string; status?: string; messages?: SupportMsg[]; agentName?: string | null } | null) => {
        if (data?.chatId && data.status && data.status !== "closed") {
          const st = data.status as SupportStatus;
          setSupportChatId(data.chatId);
          setSupportStatus(st);
          if (data.agentName) setSupportAgentName(data.agentName);
          if (data.messages?.length) setSupportMsgs(data.messages);
          saveToLS(data.chatId, st, data.agentName ?? null);
        }
      });
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
      lastAdminMsgCountRef.current = supportMsgs.filter(m => m.sender === "admin").length;
    }
  }, [open, messages, supportMsgs]);

  // ── Polling — only restarts when chatId changes, NOT on every status update ──
  useEffect(() => {
    if (!supportChatId) return;

    let active = true;

    const doPoll = async () => {
      if (!active) return;
      try {
        const r = await fetch(`/api/support/chat?chatId=${supportChatId}`, { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (!active) return;

        const newStatus = data.status as SupportStatus;
        const newMsgs: SupportMsg[] = data.messages ?? [];
        const newAgent: string | null = data.agentName ?? null;

        setSupportStatus(newStatus);
        setSupportMsgs(newMsgs);
        if (newAgent) setSupportAgentName(newAgent);
        if (typeof data.agentOnline === "boolean") setAgentOnline(data.agentOnline);
        saveToLS(supportChatId, newStatus, newAgent);

        // Unread badge when widget is closed
        if (!openRef.current) {
          const adminMsgs = newMsgs.filter(m => m.sender === "admin").length;
          const diff = adminMsgs - lastAdminMsgCountRef.current;
          if (diff > 0) setUnreadCount(prev => prev + diff);
          lastAdminMsgCountRef.current = adminMsgs;
        }

        if (newStatus === "closed") {
          active = false;
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        }
      } catch {}
    };

    // Poll immediately on mount/chatId change, then every 2.5 seconds
    doPoll();
    doPollRef.current = doPoll; // expose for manual trigger after send
    pollingRef.current = setInterval(doPoll, 2500);

    return () => {
      active = false;
      doPollRef.current = null;
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [supportChatId]); // ← ONLY depends on chatId, not status

  const historyForApi = messages
    .filter(m => m.id !== "init")
    .slice(-10)
    .map(m => ({ role: m.role === "user" ? ("user" as const) : ("model" as const), text: m.text }));

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || supportSending) return;

    // Active support mode: send to human agent
    if (supportStatus === "active" && supportChatId) {
      setSupportSending(true);
      setInput("");
      // Optimistic add immediately (before server confirms)
      const optimisticMsg: SupportMsg = { id: `opt_${uid()}`, sender: "user", content: trimmed, createdAt: new Date().toISOString() };
      setSupportMsgs(prev => [...prev, optimisticMsg]);
      try {
        const r = await fetch("/api/support/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: supportChatId, content: trimmed }),
        });
        if (r.ok) {
          // Immediately re-poll to replace optimistic msg with real server data
          if (doPollRef.current) await doPollRef.current();
        } else {
          // Remove the optimistic message if send failed
          setSupportMsgs(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
      } catch {
        setSupportMsgs(prev => prev.filter(m => m.id !== optimisticMsg.id));
      }
      setSupportSending(false);
      return;
    }

    // AI mode
    const userMsg: AiMessage = { id: uid(), role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: historyForApi }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: data.reply ?? "Sorry, something went wrong. Please try again.",
          agentRequested: data.agentRequested,
        },
      ]);

      // AI flagged agent request → open support chat (or show offline message)
      if (data.agentRequested && supportStatus === "none") {
        if (!supportAvailable) {
          setMessages(prev => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              text: "Live support is currently unavailable. Please try again later or leave us a message and we'll get back to you.",
            },
          ]);
        } else {
          try {
            const r2 = await fetch("/api/support/request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lastMessage: trimmed }),
            });
            if (r2.ok) {
              const d2 = await r2.json();
              if (d2.offline) {
                setSupportAvailable(false);
                setMessages(prev => [
                  ...prev,
                  {
                    id: uid(),
                    role: "assistant",
                    text: "Live support is currently unavailable. Please try again later or leave us a message and we'll get back to you.",
                  },
                ]);
              } else if (d2.chatId) {
                setSupportChatId(d2.chatId);
                setSupportStatus(d2.status ?? "pending");
                saveToLS(d2.chatId, d2.status ?? "pending", null);
              }
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { id: uid(), role: "assistant", text: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const inSupport        = supportStatus !== "none";
  const inputDisabled    = loading || supportSending || supportStatus === "pending" || supportStatus === "closed";
  const inputPlaceholder =
    supportStatus === "pending" ? "Waiting for agent..." :
    supportStatus === "closed"  ? "Chat has ended" :
    supportStatus === "active"  ? `Reply to ${supportAgentName ?? "agent"}...` :
    "Ask anything...";

  const agentDisplay = supportAgentName ?? "Support";

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[#1e1e1e] bg-[#0d0d0d]"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#080808] border-b border-[#1e1e1e]">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                supportStatus === "active"
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-[#f0b90b]/10 border-[#f0b90b]/30"
              }`}>
                {supportStatus === "active"
                  ? <Headset className="w-4 h-4 text-blue-400" />
                  : <Bot className="w-4 h-4 text-[#f0b90b]" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {supportStatus === "active" ? agentDisplay : "Nova"}
                </p>
                <p className={`text-[11px] flex items-center gap-1 ${
                  supportStatus === "pending" ? "text-[#f0b90b]" :
                  supportStatus === "active"  ? (agentOnline ? "text-[#22c55e]" : "text-gray-400") :
                  supportStatus === "closed"  ? "text-gray-500" :
                  "text-[#22c55e]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                    supportStatus === "pending" ? "bg-[#f0b90b] animate-pulse" :
                    supportStatus === "active"  ? (agentOnline ? "bg-[#22c55e]" : "bg-gray-500") :
                    supportStatus === "closed"  ? "bg-gray-500" :
                    "bg-[#22c55e]"
                  }`} />
                  {supportStatus === "pending" ? "Connecting..." :
                   supportStatus === "active"  ? (agentOnline ? "NovaBit Support" : "Away") :
                   supportStatus === "closed"  ? "Chat ended" :
                   "Online"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {/* AI messages */}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === "user"
                    ? "bg-[#f0b90b]/20 border border-[#f0b90b]/30"
                    : "bg-[#111] border border-[#1e1e1e]"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3 h-3 text-[#f0b90b]" />
                    : <Bot className="w-3 h-3 text-gray-400" />}
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
                      {supportStatus === "none" ? "Support team notified" : "Connecting you now..."}
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

            {/* Support section */}
            {inSupport && (
              <>
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-[#1e1e1e]" />
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 px-1">
                    <Headset className="w-3 h-3" />
                    {supportStatus === "pending" ? "Connecting to live support" :
                     supportStatus === "active"  ? `Live — ${agentDisplay}` :
                     "Support session ended"}
                  </span>
                  <div className="flex-1 h-px bg-[#1e1e1e]" />
                </div>

                {supportStatus === "pending" && (
                  <div className="flex justify-center py-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#f0b90b] bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl px-3 py-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Waiting for a support agent...
                    </div>
                  </div>
                )}

                {supportStatus === "active" && supportMsgs.length === 0 && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Headset className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="bg-[#0d1b2e] border border-blue-500/10 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-blue-100">
                      Hi! I&apos;m {agentDisplay} from NovaBit Support. How can I help you today?
                    </div>
                  </div>
                )}

                {supportMsgs.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      msg.sender === "user"
                        ? "bg-[#f0b90b]/20 border border-[#f0b90b]/30"
                        : "bg-blue-500/10 border border-blue-500/20"
                    }`}>
                      {msg.sender === "user"
                        ? <User className="w-3 h-3 text-[#f0b90b]" />
                        : <Headset className="w-3 h-3 text-blue-400" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#f0b90b] text-black font-medium rounded-tr-sm"
                        : "bg-[#0d1b2e] border border-blue-500/10 text-blue-100 rounded-tl-sm"
                    }`}>
                      {msg.sender === "admin" && (
                        <div className="text-[10px] text-blue-400/70 mb-0.5 font-semibold">{agentDisplay}</div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {supportStatus === "closed" && (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <span className="text-[10px] text-gray-500 bg-[#111] border border-[#1e1e1e] rounded-full px-3 py-1">
                        Chat ended{supportAgentName ? ` with ${supportAgentName}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-center pb-1">
                      <button
                        onClick={() => {
                          setSupportChatId(null);
                          setSupportStatus("none");
                          setSupportMsgs([]);
                          setSupportAgentName(null);
                          saveToLS(null, "none", null);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30 rounded-xl hover:bg-[#f0b90b]/20 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Start New Chat
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 1 && supportStatus === "none" && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[#111] border border-[#1e1e1e] text-gray-300 hover:border-[#f0b90b]/40 hover:text-[#f0b90b] transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-[#1e1e1e]">
            <div className={`flex gap-2 items-center bg-[#080808] rounded-xl border px-3 py-2 transition-colors ${
              inputDisabled ? "border-[#1e1e1e]" : "border-[#1e1e1e] focus-within:border-[#f0b90b]/40"
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && !inputDisabled && send(input)}
                placeholder={inputPlaceholder}
                disabled={inputDisabled}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
              />
              {supportSending
                ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                : (
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || inputDisabled}
                    className="w-7 h-7 rounded-lg bg-[#f0b90b] text-black flex items-center justify-center disabled:opacity-30 hover:bg-[#f0b90b]/90 transition-all disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-1.5">
              {supportStatus === "active"
                ? `Live support · ${agentDisplay} · NovaBit`
                : supportStatus === "closed"
                ? "Chat ended · Start a new chat above"
                : "AI assistant · Type \"agent\" for human support"}
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
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
