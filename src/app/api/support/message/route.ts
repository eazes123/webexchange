import { NextRequest, NextResponse } from "next/server";
import { getSupportChatById, addSupportMessage } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { chatId, content } = await request.json();
  if (!chatId || !content?.trim()) {
    return NextResponse.json({ error: "chatId and content required" }, { status: 400 });
  }

  // chatId UUID is the access token — no session needed
  const chat = await getSupportChatById(chatId);
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (chat.status !== "active") {
    return NextResponse.json({ error: "Chat is not active" }, { status: 400 });
  }

  const msg = await addSupportMessage(chatId, "user", content.trim());
  return NextResponse.json({ message: msg });
}
