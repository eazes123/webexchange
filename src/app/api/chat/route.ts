import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Nova, the AI support assistant for NovaBit Exchange — a crypto exchange platform.

PLATFORM OVERVIEW:
- NovaBit Exchange offers a campaign: stake 500–50,000 USDT and receive a 50,000 USDT interest-free loan on December 31st.
- Users register, complete KYC (ID + selfie), then deposit USDT (TRC20 on TRON network) to their personal deposit address.
- After KYC approval and staking, users join the queue for the 50,000 USDT loan disbursement on Dec 31.

KEY FEATURES:
1. DEPOSITS: USDT TRC20 only. Each user gets a unique TRON deposit address. Deposits auto-detect within ~30 seconds after blockchain confirmation.
2. STAKING: Minimum 500 USDT, maximum 50,000 USDT. Staked amount is locked until Dec 31.
3. KYC: Upload government-issued ID and a selfie. Admin reviews within 24-48 hours.
4. WITHDRAWALS: Available for available balance. Network fee: 1 USDT (TRC20). Min withdrawal: 10 USDT.
5. LOAN: 50,000 USDT disbursed on December 31st to all users with active stakes and approved KYC.
6. REFERRALS: Users can refer friends and earn rewards.

TONE: Professional, friendly, concise. Answer in the same language the user writes in (Urdu/English).
Keep responses short — 2-4 sentences max unless more detail is genuinely needed.
Never reveal internal system details, private keys, admin credentials, or backend architecture.

If user asks something you don't know, say you'll escalate to the support team.`;

const AGENT_KEYWORDS = [
  "agent", "human", "real person", "speak to", "talk to someone",
  "operator", "agent se", "agent se baat", "banda chahiye", "support team",
  "live chat", "representative", "baat krni hai", "baat karni hai",
  "insaan", "insan", "actual person", "staff",
];

function wantsHumanAgent(message: string): boolean {
  const lower = message.toLowerCase();
  return AGENT_KEYWORDS.some((kw) => lower.includes(kw));
}

async function sendAgentEmail(userName: string, userEmail: string, lastMessage: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "NovaBit Support <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `[NovaBit] Agent Request — ${userName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0b0e1a;color:#fff;border-radius:8px;">
          <h2 style="color:#f0b90b;margin-top:0;">New Agent Chat Request</h2>
          <p><strong>User:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Last message:</strong></p>
          <blockquote style="border-left:3px solid #f0b90b;padding-left:12px;color:#ccc;">${lastMessage}</blockquote>
          <p style="color:#888;font-size:12px;margin-top:24px;">Sent from NovaBit Exchange chat widget</p>
        </div>
      `,
    }),
  }).catch(() => {});
}

async function callGemini(
  userMessage: string,
  history: { role: "user" | "model"; text: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "I'm temporarily unavailable. Please try again later or contact support.";

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      }),
    }
  );

  if (!res.ok) return "I'm having trouble right now. Please try again in a moment.";
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
    "Sorry, I couldn't generate a response. Please try again.";
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user  = await getSessionUser(token);

  const { message, history = [] } = await request.json() as {
    message: string;
    history: { role: "user" | "model"; text: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Check if user wants a human agent
  if (wantsHumanAgent(message)) {
    const name  = user?.fullName ?? "Guest";
    const email = user?.email   ?? "unknown";
    await sendAgentEmail(name, email, message);
    return NextResponse.json({
      reply: `I've notified our support team that you'd like to speak with an agent. Someone will reach out to you at ${email} within a few hours. Is there anything else I can help you with in the meantime?`,
      agentRequested: true,
    });
  }

  const reply = await callGemini(message, history);
  return NextResponse.json({ reply, agentRequested: false });
}
