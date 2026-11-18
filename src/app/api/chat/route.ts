import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Nova, the official AI support assistant for NovaBit Exchange.
Your job is to answer user questions accurately and helpfully based ONLY on the information below.
Never make up information not listed here. If unsure, say the support team will help.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM: NovaBit Exchange
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NovaBit Exchange is a crypto platform running a limited-time staking campaign. Users stake USDT, complete KYC verification, and receive a 50,000 USDT interest-free loan on December 31st, 2026.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. REGISTRATION & ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Sign up with full name, email, phone, country, and password.
- After registration, users get a queue position (e.g. #247 of 1000).
- Each user gets a unique personal TRON wallet address for deposits.
- Dashboard shows balance, transactions, staking status, and KYC status.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. KYC VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Required before staking and loan disbursement.
- Upload: government-issued ID (passport, national ID, or driver's license) + a selfie holding the ID.
- Review time: 24–48 hours by admin.
- Statuses: Not Submitted → Under Review → Approved / Rejected.
- If rejected: user can resubmit with clearer documents.
- KYC must be approved before the loan is disbursed on Dec 31.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DEPOSITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Supported asset: USDT TRC20 (TRON network) ONLY.
- Do NOT send BEP20, ERC20, or any other network — funds will be lost.
- Each user has a unique personal deposit address shown on the Wallet page.
- Deposits auto-detect: balance updates automatically within ~30–60 seconds after blockchain confirmation. No button click needed.
- Minimum deposit: any amount (but 500 USDT minimum needed to stake).
- Deposits are non-refundable once sent on-chain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. STAKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Minimum stake: 500 USDT. Maximum: 50,000 USDT.
- Staked amount is locked until December 31, 2026 — it cannot be withdrawn before that.
- Staking requires KYC approval first.
- Once staked, the user's status becomes "Active" and they are queued for the loan.
- Higher stake = same 50,000 USDT loan (the loan amount is fixed for all users).
- Campaign spots: limited to ~1,000 participants. First come, first served.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. THE 50,000 USDT LOAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every user who stakes (min 500 USDT) and passes KYC receives exactly 50,000 USDT.
- Disbursement date: December 31, 2026.
- The loan is interest-free. No repayment required during the campaign period.
- After disbursement, users can withdraw this 50,000 USDT to any external TRON wallet.
- Withdrawal of the loan amount goes through the same withdrawal process (see section 6).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. WITHDRAWALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Only the "available" balance can be withdrawn (staked amount is locked).
- Network: USDT TRC20 (TRON) only.
- Network fee: 1 USDT (deducted from withdrawal amount).
- Minimum withdrawal: 10 USDT.
- Enter a valid TRON wallet address (starts with T...).
- Withdrawal requests are reviewed and processed by admin — typically within 24 hours.
- Status flow: Pending → Processing → Approved (with on-chain txHash) or Rejected.
- Users can track their withdrawal status on the Wallet page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. TRANSACTION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- All deposits, withdrawals, stakes, and loan credits are visible on the Wallet page.
- Confirmed on-chain transactions show a TronScan link (txHash) for verification.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. SECURITY & TRUST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NovaBit never asks for your private key, seed phrase, or password via chat.
- All sensitive operations (KYC, withdrawals) go through the official website only.
- If anyone contacts you claiming to be NovaBit support asking for your password or seed phrase, it is a scam.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMON Q&A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: Can I stake more than once?
A: No, each account can stake once. The minimum is 500 USDT.

Q: What if I send USDT on the wrong network?
A: Funds sent on ERC20/BEP20 instead of TRC20 cannot be recovered. Always use TRC20.

Q: How long does KYC take?
A: 24–48 hours. You'll see your status update in the dashboard.

Q: Can I withdraw my staked amount before Dec 31?
A: No. Staked funds are locked until December 31, 2026.

Q: Is the 50,000 USDT loan real?
A: Yes. It is credited to your account on Dec 31 and can be withdrawn after disbursement.

Q: What is the queue position?
A: It shows your place among campaign participants. It does not affect loan eligibility — all stakers receive the loan.

Q: I deposited but my balance didn't update.
A: Deposits auto-detect after blockchain confirmation (~30–60 seconds). If it's been more than 10 minutes and not reflected, contact support with your txHash.

Q: My KYC was rejected. What do I do?
A: Check the rejection reason in your dashboard and resubmit with clearer photos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always reply in the SAME LANGUAGE the user writes in (Urdu or English).
- Keep responses short: 2–4 sentences unless detail is truly needed.
- Be friendly, professional, and confident.
- Never reveal platform backend details, admin credentials, private keys, or architecture.
- If a question is outside the scope above, say: "For this, please contact our support team directly."
- Never give financial advice or guarantee returns beyond what is stated above.`;

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
