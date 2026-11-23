import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getSupportChatById, addSupportMessage } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId, content } = await request.json();
  if (!chatId || !content?.trim()) {
    return NextResponse.json({ error: "chatId and content required" }, { status: 400 });
  }

  const chat = await getSupportChatById(chatId);
  if (!chat || chat.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (chat.status !== "active") {
    return NextResponse.json({ error: "Chat is not active" }, { status: 400 });
  }

  const msg = await addSupportMessage(chatId, "user", content.trim());
  return NextResponse.json({ message: msg });
}
