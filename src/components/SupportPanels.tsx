"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Send, User, RefreshCw, CheckCircle,
  ChevronDown, ChevronUp, Eye, EyeOff, Power,
} from "lucide-react";

interface SupportChat {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "active" | "closed";
  lastMessage: string | null;
  agentName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SupportMsg {
  id: string;
  chatId: string;
  sender: "user" | "admin";
  content: string;
  createdAt: string;
}

interface Panel {
  id: string;
  chat: SupportChat;
  messages: SupportMsg[];
  minimized: boolean;
  reply: string;
  lastSeenCount: number;
  loadingAction: string | null;
  readOnly: boolean; // true for closed chats opened from history
  userOnline: boolean;
  stealth: boolean; // admin appears offline to this user
}

function PanelBody({ panel, onSend, onReplyChange, onClose, onToggleStealth }:
  { panel: Panel; onSend: () => void; onReplyChange: (v: string) => void; onClose: () => void; onToggleStealth: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [panel.messages.length]);

  return (
    <>
      {/* Accept bar */}
      {panel.chat.status === "pending" && (
        <div className="px-3 py-2 border-b border-[#f0b90b]/20 bg-[#f0b90b]/5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-[#f0b90b]/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-pulse inline-block" />
            New request
          </span>
          <button
            disabled={panel.loadingAction === "accept"}
            onClick={onClose} // passed as accept handler in parent
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[#f0b90b] text-black rounded-lg hover:bg-[#f0b90b]/90 disabled:opacity-50 transition-colors"
          >
            {panel.loadingAction === "accept"
              ? <RefreshCw className="w-3 h-3 animate-spin" />
              : <CheckCircle className="w-3 h-3" />}
            Accept
          </button>
        </div>
      )}

      {/* User info row */}
      <div className="px-3 py-1.5 border-b border-white/[0.05] flex items-center gap-2 flex-shrink-0">
        <User className="w-3 h-3 text-gray-600 flex-shrink-0" />
        <span className="text-[11px] text-gray-500 truncate">{panel.chat.userEmail}</span>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <span className={`flex items-center gap-1 text-[10px] ${panel.userOnline ? "text-[#22c55e]" : "text-gray-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
              panel.userOnline ? "bg-[#22c55e] animate-pulse" : "bg-gray-600"
            }`} />
            {panel.userOnline ? "Online" : "Away"}
          </span>
          {panel.chat.agentName && (
            <span className="text-[10px] text-blue-400/70">Agent: {panel.chat.agentName}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 min-h-0">
        {panel.messages.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-600">
            {panel.chat.status === "pending" ? "Accept to start chatting" : "No messages yet"}
          </div>
        )}
        {panel.messages.map(msg => (
          <div key={msg.id} className={`flex gap-1.5 ${msg.sender === "admin" ? "flex-row-reverse" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 ${
              msg.sender === "admin"
                ? "bg-blue-500/20 text-blue-300"
                : "bg-[#f0b90b]/20 text-[#f0b90b]"
            }`}>
              {msg.sender === "admin" ? "A" : "U"}
            </div>
            <div className={`max-w-[78%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed break-words ${
              msg.sender === "admin"
                ? "bg-blue-600/15 border border-blue-500/15 text-blue-100 rounded-tr-sm"
                : "bg-[#111] border border-white/5 text-gray-200 rounded-tl-sm"
            }`}>
              {msg.content}
              <div className="text-[9px] opacity-40 mt-0.5">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      {panel.chat.status === "active" && !panel.readOnly && (
        <div className="border-t border-white/[0.07] p-2 flex gap-1.5 flex-shrink-0">
          <input
            type="text"
            value={panel.reply}
            onChange={e => onReplyChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey && panel.reply.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Reply to user..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-[#22c55e]/40 transition-colors"
          />
          <button
            disabled={!panel.reply.trim() || panel.loadingAction === "message"}
            onClick={onSend}
            className="w-7 h-7 rounded-lg bg-[#22c55e] text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#22c55e]/90 transition-colors flex-shrink-0"
          >
            {panel.loadingAction === "message"
              ? <RefreshCw className="w-3 h-3 animate-spin" />
              : <Send className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Closed read-only notice */}
      {(panel.chat.status === "closed" || panel.readOnly) && (
        <div className="border-t border-white/[0.05] px-3 py-2 text-center flex-shrink-0">
          <span className="text-[10px] text-gray-600">Chat ended · Read-only history</span>
        </div>
      )}

      {/* Footer actions bar */}
      {panel.chat.status === "active" && !panel.readOnly && (
        <div className="border-t border-white/[0.05] px-3 py-1.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-600">{panel.messages.length} msgs</span>
            <button
              onClick={onToggleStealth}
              title={panel.stealth ? "Appear online to user" : "Appear offline to user"}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-md border transition-colors ${
                panel.stealth
                  ? "text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20"
                  : "text-gray-500 border-white/[0.07] hover:text-gray-300 hover:border-white/20"
              }`}
            >
              {panel.stealth ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              <span>{panel.stealth ? "Hidden" : "Visible"}</span>
            </button>
          </div>
          <button
            disabled={panel.loadingAction === "close"}
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            <X className="w-2.5 h-2.5" /> End Chat
          </button>
        </div>
      )}
    </>
  );
}

export default function SupportPanels() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [supportAvailable, setSupportAvailable] = useState(true);
  const [togglingSupport, setTogglingSupport] = useState(false);
  const addedIds = useRef(new Set<string>());
  const aliveRef = useRef(true);

  const updatePanel = (id: string, fn: (p: Panel) => Panel) => {
    setPanels(prev => prev.map(p => p.id === id ? fn(p) : p));
  };

  const refresh = useCallback(async () => {
    if (!aliveRef.current) return;
    try {
      const r = await fetch("/api/admin/support", { cache: "no-store" });
      if (!r.ok || !aliveRef.current) return;
      const data = await r.json();
      const liveChats: SupportChat[] = [
        ...(data.pending ?? []),
        ...(data.active ?? []),
      ];

      // Add newly seen chats as panels
      const toAdd: Panel[] = [];
      for (const chat of liveChats) {
        if (!addedIds.current.has(chat.id)) {
          addedIds.current.add(chat.id);
          toAdd.push({
            id: chat.id,
            chat,
            messages: [],
            minimized: false,
            reply: "",
            lastSeenCount: 0,
            loadingAction: null,
            readOnly: false,
            userOnline: false,
            stealth: false,
          });
        }
      }

      setPanels(prev => {
        const updated = prev.map(p => {
          const fresh = liveChats.find(c => c.id === p.id);
          if (!fresh) return p;
          return { ...p, chat: fresh };
        });
        return [...updated, ...toAdd];
      });

      // Fetch messages for all visible (non-read-only) panels
      await Promise.all(liveChats.map(async chat => {
        if (!aliveRef.current) return;
        try {
          const mr = await fetch(`/api/admin/support?chatId=${chat.id}`, { cache: "no-store" });
          if (!mr.ok || !aliveRef.current) return;
          const md = await mr.json();
          const msgs: SupportMsg[] = md.messages ?? [];
          const online: boolean = md.userOnline ?? false;
          const agentOnline: boolean = md.agentOnline ?? true;
          setPanels(prev => prev.map(p => {
            if (p.id !== chat.id) return p;
            const prevUserMsgs = p.messages.filter(m => m.sender === "user").length;
            const newUserMsgs = msgs.filter(m => m.sender === "user").length;
            const unreadAdd = p.minimized ? Math.max(0, newUserMsgs - prevUserMsgs) : 0;
            const newLastSeen = p.minimized ? p.lastSeenCount : msgs.filter(m => m.sender === "user").length;
            return { ...p, messages: msgs, lastSeenCount: newLastSeen, userOnline: online, stealth: !agentOnline, loadingAction: unreadAdd > 0 ? p.loadingAction : p.loadingAction };
          }));
        } catch {}
      }));
    } catch {}
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    // Fetch initial global support status
    fetch("/api/support/status", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then((d: { available?: boolean } | null) => {
        if (d && typeof d.available === "boolean") setSupportAvailable(d.available);
      });
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => {
      aliveRef.current = false;
      clearInterval(timer);
    };
  }, [refresh]);

  const toggleSupport = async () => {
    setTogglingSupport(true);
    try {
      const r = await fetch("/api/support/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !supportAvailable }),
      });
      if (r.ok) {
        const d = await r.json();
        setSupportAvailable(d.available);
      }
    } catch {}
    setTogglingSupport(false);
  };

  const doStealth = async (chatId: string, hidden: boolean) => {
    updatePanel(chatId, p => ({ ...p, stealth: hidden }));
    try {
      await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, action: "stealth", hidden }),
      });
    } catch {}
  };

  const doAction = async (chatId: string, action: "accept" | "close" | "message", content?: string) => {
    updatePanel(chatId, p => ({ ...p, loadingAction: action }));
    try {
      const r = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, action, content }),
      });
      if (r.ok) {
        if (action === "message") {
          const optimMsg: SupportMsg = {
            id: `opt_${Date.now()}`,
            chatId,
            sender: "admin",
            content: content!,
            createdAt: new Date().toISOString(),
          };
          updatePanel(chatId, p => ({
            ...p,
            reply: "",
            messages: [...p.messages, optimMsg],
            lastSeenCount: p.messages.filter(m => m.sender === "user").length,
          }));
        }
        if (action === "close") {
          // Remove panel after closing
          setPanels(prev => prev.filter(p => p.id !== chatId));
        }
        await refresh();
      }
    } catch {}
    setPanels(prev => prev.map(p => p.id === chatId ? { ...p, loadingAction: null } : p));
  };

  const removePanel = (chatId: string) => {
    setPanels(prev => prev.filter(p => p.id !== chatId));
    // Don't delete from addedIds — prevents re-opening same chat automatically
    // But if user wants to reopen from history, they can
  };

  const toggleMinimize = (chatId: string) => {
    updatePanel(chatId, p => ({
      ...p,
      minimized: !p.minimized,
      lastSeenCount: !p.minimized ? p.lastSeenCount : p.messages.filter(m => m.sender === "user").length,
    }));
  };

  const unread = (p: Panel) => {
    const userMsgs = p.messages.filter(m => m.sender === "user").length;
    return Math.max(0, userMsgs - p.lastSeenCount);
  };

  // Expose method for admin page to open a closed chat as read-only panel
  if (typeof window !== "undefined") {
    (window as any).__openSupportPanel = (chat: SupportChat, messages: SupportMsg[]) => {
      const existing = panels.find(p => p.id === chat.id);
      if (existing) {
        setPanels(prev => prev.map(p => p.id === chat.id ? { ...p, minimized: false } : p));
        return;
      }
      setPanels(prev => [...prev, {
        id: chat.id, chat, messages, minimized: false,
        reply: "", lastSeenCount: 0, loadingAction: null, readOnly: true, userOnline: false, stealth: false,
      }]);
    };
  }

  const visible = panels.slice(-5); // Show rightmost 5 panels

  return (
    <>
      {/* Global support availability toggle — always visible for admin */}
      <div className="fixed bottom-4 left-4 z-[200]">
        <button
          onClick={toggleSupport}
          disabled={togglingSupport}
          title={supportAvailable ? "Support is Online — click to go Offline" : "Support is Offline — click to go Online"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border shadow-lg transition-all ${
            supportAvailable
              ? "bg-[#0a1a0e] border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10"
              : "bg-[#1a0a0a] border-red-500/30 text-red-400 hover:bg-red-500/10"
          } disabled:opacity-50`}
        >
          <Power className="w-3 h-3" />
          Support: {supportAvailable ? "Online" : "Offline"}
        </button>
      </div>

    {visible.length > 0 && (
    <div className="fixed bottom-0 right-4 z-[200] flex items-end gap-2">
      {panels.length > 5 && (
        <div className="self-end mb-1 px-2 py-1 text-[10px] text-gray-500 bg-[#111] border border-[#1e1e1e] rounded-lg">
          +{panels.length - 5} more
        </div>
      )}
      {visible.map(panel => {
        const u = unread(panel);
        return (
          <div
            key={panel.id}
            className={`flex flex-col rounded-t-xl overflow-hidden shadow-2xl border-t border-l border-r transition-all ${
              panel.chat.status === "pending"
                ? "border-[#f0b90b]/40"
                : panel.chat.status === "active"
                ? "border-[#22c55e]/30"
                : "border-[#333]"
            }`}
            style={{ width: 290, maxHeight: panel.minimized ? undefined : 400 }}
          >
            {/* Panel header */}
            <div
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer flex-shrink-0 ${
                panel.chat.status === "pending"
                  ? "bg-[#1a150a]"
                  : panel.chat.status === "active"
                  ? "bg-[#0a1a0e]"
                  : "bg-[#111]"
              }`}
              onClick={() => toggleMinimize(panel.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                  panel.chat.status === "pending"
                    ? "bg-[#f0b90b]/20 text-[#f0b90b]"
                    : panel.chat.status === "active"
                    ? "bg-[#22c55e]/20 text-[#22c55e]"
                    : "bg-gray-700 text-gray-300"
                }`}>
                  {panel.chat.userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate leading-tight">
                    {panel.chat.userName}
                  </div>
                  <div className={`text-[10px] leading-tight ${
                    panel.chat.status === "pending"
                      ? "text-[#f0b90b]"
                      : panel.chat.status === "active"
                      ? "text-[#22c55e]"
                      : "text-gray-500"
                  }`}>
                    {panel.chat.status === "pending" ? "Waiting to accept"
                      : panel.chat.status === "active" ? (panel.chat.agentName || "Active")
                      : "Closed"}
                  </div>
                </div>
                {u > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#f6465d] text-[9px] text-white font-bold flex items-center justify-center flex-shrink-0">
                    {u > 9 ? "9+" : u}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                {panel.minimized
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                <button
                  onClick={e => { e.stopPropagation(); removePanel(panel.id); }}
                  className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-white transition-colors rounded"
                  title="Hide panel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Panel body */}
            {!panel.minimized && (
              <div className={`flex flex-col flex-1 min-h-0 ${
                panel.chat.status === "pending"
                  ? "bg-[#0d0a04]"
                  : "bg-[#060f08]"
              }`}
              style={{ height: 350 }}>
                <PanelBody
                  panel={panel}
                  onReplyChange={v => updatePanel(panel.id, p => ({ ...p, reply: v }))}
                  onSend={() => {
                    if (panel.reply.trim()) doAction(panel.id, "message", panel.reply);
                  }}
                  onClose={() => {
                    if (panel.chat.status === "pending") {
                      doAction(panel.id, "accept");
                    } else if (panel.chat.status === "active") {
                      if (window.confirm(`End chat with ${panel.chat.userName}?`)) {
                        doAction(panel.id, "close");
                      }
                    }
                  }}
                  onToggleStealth={() => doStealth(panel.id, !panel.stealth)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
    )}
    </>
  );
}
