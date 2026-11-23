import { NextRequest, NextResponse } from "next/server";
import {
  getAllSupportChats, getSupportChatById, getSupportMessages,
  updateSupportChatStatus, addSupportMessage,
} from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { isUserOnline } from "@/lib/presence";
import { setAgentStealth, getAgentStealth } from "@/lib/support-status";

const AGENT_NAMES = [
  "Alex", "Sarah", "Michael", "Emma", "James", "Olivia",
  "Daniel", "Sophia", "Ryan", "Charlotte", "Noah", "Amelia",
  "Liam", "Isabella", "Ethan", "Mia", "Logan", "Harper",
  "William", "Luna", "Benjamin", "Aria", "Mason", "Grace",
  "Lucas", "Chloe", "Henry", "Zoe", "Jackson", "Natalie",
];

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const statusFilter = request.nextUrl.searchParams.get("status") as "pending" | "active" | "closed" | null;
  const chatId = request.nextUrl.searchParams.get("chatId");

  // Fetch messages for a specific chat
  if (chatId) {
    const chat = await getSupportChatById(chatId);
    if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const messages = await getSupportMessages(chatId);
    return NextResponse.json({
      chat,
      messages,
      userOnline: isUserOnline(chatId),
      agentOnline: !getAgentStealth(chatId),
    });
  }

  // Fetch all chats grouped by status
  const [pending, active, closed] = await Promise.all([
    getAllSupportChats("pending"),
    getAllSupportChats("active"),
    getAllSupportChats("closed"),
  ]);

  return NextResponse.json({ pending, active, closed });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const { chatId, action, content, hidden } = await request.json();
  if (!chatId || !action) {
    return NextResponse.json({ error: "chatId and action required" }, { status: 400 });
  }

  const chat = await getSupportChatById(chatId);
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  if (action === "accept") {
    if (chat.status !== "pending") {
      return NextResponse.json({ error: "Chat is not pending" }, { status: 400 });
    }
    const agentName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
    await updateSupportChatStatus(chatId, "active", agentName);
    return NextResponse.json({ success: true, agentName });
  }

  if (action === "message") {
    if (chat.status !== "active") {
      return NextResponse.json({ error: "Chat is not active" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }
    const msg = await addSupportMessage(chatId, "admin", content.trim());
    return NextResponse.json({ success: true, message: msg });
  }

  if (action === "close") {
    if (chat.status === "closed") {
      return NextResponse.json({ error: "Chat already closed" }, { status: 400 });
    }
    await updateSupportChatStatus(chatId, "closed");
    return NextResponse.json({ success: true });
  }

  if (action === "stealth") {
    setAgentStealth(chatId, !!hidden);
    return NextResponse.json({ success: true, agentOnline: !getAgentStealth(chatId) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
