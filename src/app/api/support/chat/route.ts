import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getSupportChatById, getSupportMessages } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chatId = request.nextUrl.searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  const chat = await getSupportChatById(chatId);
  if (!chat || chat.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await getSupportMessages(chatId);
  return NextResponse.json({ status: chat.status, messages, agentName: chat.agentName ?? null });
}
