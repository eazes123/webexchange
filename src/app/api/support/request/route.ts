import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createSupportChat, getActiveSupportChatByUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";
import { sendAgentRequestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return existing pending/active chat if one exists
  const existing = await getActiveSupportChatByUser(user.id);
  if (existing) {
    return NextResponse.json({ chatId: existing.id, status: existing.status });
  }

  const chat = await createSupportChat(user.id, user.fullName, user.email);

  const { lastMessage } = await request.json().catch(() => ({ lastMessage: "" }));
  sendAgentRequestEmail(
    process.env.ADMIN_EMAIL ?? "",
    user.fullName,
    user.email,
    lastMessage ?? "User requested a live support agent.",
  ).catch(() => {});

  return NextResponse.json({ chatId: chat.id, status: chat.status });
}
