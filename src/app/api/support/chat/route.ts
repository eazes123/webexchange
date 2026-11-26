import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getSupportChatById, getSupportMessages, getActiveSupportChatByUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { touchPresence } from "@/lib/presence";
import { getAgentStealth, getSupportStatus } from "@/lib/support-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");

  // chatId provided — no auth needed; the UUID itself is the access token
  if (chatId) {
    const chat = await getSupportChatById(chatId);
    if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Touch presence so admin can see the user is online
    touchPresence(chatId);

    const messages = await getSupportMessages(chatId);
    return NextResponse.json({
      status: chat.status,
      messages,
      agentName: chat.agentName ?? null,
      agentOnline: getSupportStatus() && !getAgentStealth(chatId),
    });
  }

  // No chatId — requires auth; returns user's active/pending chat for session restore
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ chat: null });

  const chat = await getActiveSupportChatByUser(user.id);
  if (!chat) return NextResponse.json({ chat: null });
  const messages = await getSupportMessages(chat.id);
  return NextResponse.json({ chatId: chat.id, status: chat.status, messages, agentName: chat.agentName ?? null });
}
