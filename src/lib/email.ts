/**
 * Centralised Resend email utility.
 * FROM address: set RESEND_FROM in .env.local for a verified domain,
 * e.g. "NovaBit <noreply@novabit.exchange>". Falls back to Resend sandbox.
 */

const FROM =
  process.env.RESEND_FROM ?? "NovaBit <onboarding@resend.dev>";

// ── Base branded template ───────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f0b90b;border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                  <span style="font-size:22px;line-height:44px;display:block;">⬡</span>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">NovaBit</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:#111111;border:1px solid #1e1e1e;border-radius:16px;padding:40px 36px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:28px;">
            <p style="margin:0;font-size:12px;color:#555555;line-height:1.6;">
              You received this email because you have an account on NovaBit Exchange.<br>
              © 2026 NovaBit Exchange · All rights reserved
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Shared style helpers ────────────────────────────────────────────────────
const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#ffffff;">${text}</h1>`;
const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;line-height:1.6;">${text}</p>`;
const badge = (text: string, color = "#f0b90b") =>
  `<div style="display:inline-block;background:${color}22;border:1px solid ${color}44;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:700;color:${color};margin-bottom:20px;">${text}</div>`;
const divider = () =>
  `<div style="border-top:1px solid #1e1e1e;margin:24px 0;"></div>`;
const btn = (text: string, href: string) =>
  `<a href="${href}" style="display:inline-block;background:#f0b90b;color:#000000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-top:8px;">${text}</a>`;
const infoRow = (label: string, value: string) =>
  `<tr>
    <td style="padding:10px 0;font-size:13px;color:#666666;width:40%;">${label}</td>
    <td style="padding:10px 0;font-size:13px;color:#ffffff;font-weight:600;">${value}</td>
  </tr>`;

// ── Core send function ──────────────────────────────────────────────────────
export async function sendEmail({
  to, subject, html,
}: {
  to: string; subject: string; html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // Email not configured — fail silently
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  }).catch(() => {}); // Best-effort — never throw
}

// ── 1. Welcome email ────────────────────────────────────────────────────────
export function sendWelcomeEmail(to: string, fullName: string): Promise<void> {
  const firstName = fullName.split(" ")[0];
  return sendEmail({
    to,
    subject: `Welcome to NovaBit, ${firstName}!`,
    html: baseTemplate(`
      ${badge("Welcome to NovaBit")}
      ${h1(`Hello, ${firstName}! 👋`)}
      ${p("Your account has been created. You're now on your way to unlocking the <strong style='color:#ffffff;'>$50,000 USDT interest-free loan</strong>.")}
      ${divider()}
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">Next Steps</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${[
          ["1", "Complete KYC", "Verify your identity to become eligible"],
          ["2", "Deposit & Stake", "Stake 500 USDT to activate your loan slot"],
          ["3", "Receive Loan",   "Get $50,000 USDT credited on Dec 31, 2026"],
        ].map(([n, t, d]) => `
        <tr>
          <td style="padding:8px 0;" valign="top">
            <span style="display:inline-block;width:24px;height:24px;background:#f0b90b;border-radius:50%;text-align:center;line-height:24px;font-size:11px;font-weight:900;color:#000;margin-right:12px;">${n}</span>
          </td>
          <td style="padding:8px 0;" valign="top">
            <strong style="color:#ffffff;font-size:14px;">${t}</strong><br>
            <span style="color:#777;font-size:13px;">${d}</span>
          </td>
        </tr>`).join("")}
      </table>
      ${divider()}
      ${btn("Go to My Dashboard", `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novabit.exchange"}/dashboard`)}
    `),
  });
}

// ── 2. KYC submitted ────────────────────────────────────────────────────────
export function sendKycSubmittedEmail(to: string, fullName: string): Promise<void> {
  const firstName = fullName.split(" ")[0];
  return sendEmail({
    to,
    subject: "KYC Submitted — Under Review",
    html: baseTemplate(`
      ${badge("⏳ Under Review", "#f0b90b")}
      ${h1("KYC Submitted Successfully")}
      ${p(`Hi ${firstName}, we've received your KYC documents and they're now being reviewed by our compliance team.`)}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:4px 16px;margin:16px 0;">
        ${infoRow("Status", "Under Review")}
        ${infoRow("Review Time", "24–48 hours")}
        ${infoRow("What's Next", "You'll be notified once complete")}
      </table>
      ${divider()}
      ${p("No further action is needed. We'll email you as soon as a decision is made.")}
      ${btn("View KYC Status", `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novabit.exchange"}/kyc`)}
    `),
  });
}

// ── 3. KYC approved ─────────────────────────────────────────────────────────
export function sendKycApprovedEmail(to: string, fullName: string): Promise<void> {
  const firstName = fullName.split(" ")[0];
  return sendEmail({
    to,
    subject: "🎉 KYC Approved — Loan Unlocked",
    html: baseTemplate(`
      ${badge("✓ Identity Verified", "#0ecb81")}
      ${h1("KYC Approved!")}
      ${p(`Congratulations, ${firstName}! Your identity has been successfully verified.`)}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#0ecb8108;border:1px solid #0ecb8130;border-radius:12px;padding:4px 16px;margin:16px 0;">
        ${infoRow("KYC Status", "✓ Approved")}
        ${infoRow("Loan Eligibility", "Unlocked")}
        ${infoRow("Loan Amount", "$50,000 USDT")}
        ${infoRow("Disbursement", "December 31, 2026")}
      </table>
      ${divider()}
      ${p("You are now eligible for the <strong style='color:#ffffff;'>$50,000 USDT interest-free loan</strong>. Deposit and stake 500 USDT to secure your slot.")}
      ${btn("Stake Now", `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novabit.exchange"}/campaign`)}
    `),
  });
}

// ── 4. KYC rejected ─────────────────────────────────────────────────────────
export function sendKycRejectedEmail(to: string, fullName: string): Promise<void> {
  const firstName = fullName.split(" ")[0];
  return sendEmail({
    to,
    subject: "KYC Verification — Action Required",
    html: baseTemplate(`
      ${badge("⚠ Action Required", "#f6465d")}
      ${h1("KYC Needs Attention")}
      ${p(`Hi ${firstName}, unfortunately we were unable to verify your identity with the documents provided.`)}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f6465d08;border:1px solid #f6465d30;border-radius:12px;padding:4px 16px;margin:16px 0;">
        ${infoRow("Status", "Rejected")}
        ${infoRow("What to do", "Resubmit with clearer documents")}
      </table>
      ${divider()}
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ffffff;">Common Reasons for Rejection</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${[
          "Document image was blurry or cut off",
          "Name or date of birth did not match the ID",
          "Selfie did not clearly show your face",
          "Proof of address was older than 3 months",
        ].map(r => `<tr><td style="padding:4px 0;font-size:13px;color:#aaaaaa;">• ${r}</td></tr>`).join("")}
      </table>
      ${divider()}
      ${btn("Resubmit KYC", `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novabit.exchange"}/kyc`)}
    `),
  });
}

// ── 5. Deposit confirmed ────────────────────────────────────────────────────
export function sendDepositConfirmedEmail(
  to: string,
  fullName: string,
  amount: number,
  txHash: string,
): Promise<void> {
  const firstName = fullName.split(" ")[0];
  const shortHash = txHash.length > 20
    ? `${txHash.slice(0, 10)}…${txHash.slice(-8)}`
    : txHash;
  return sendEmail({
    to,
    subject: `Deposit Confirmed — ${amount.toLocaleString()} USDT`,
    html: baseTemplate(`
      ${badge("✓ Deposit Confirmed", "#0ecb81")}
      ${h1(`${amount.toLocaleString()} USDT Received`)}
      ${p(`Hi ${firstName}, your USDT deposit has been confirmed on-chain and credited to your NovaBit wallet.`)}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#0ecb8108;border:1px solid #0ecb8130;border-radius:12px;padding:4px 16px;margin:16px 0;">
        ${infoRow("Amount", `${amount.toLocaleString()} USDT`)}
        ${infoRow("Network", "TRON (TRC20)")}
        ${infoRow("Status", "Confirmed")}
        ${infoRow("Tx Hash", shortHash)}
      </table>
      ${divider()}
      ${p("Your balance has been updated. You can now proceed to stake for the campaign.")}
      ${btn("View Wallet", `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novabit.exchange"}/wallet`)}
    `),
  });
}

// ── Admin: agent chat request (kept here, removed from chat route) ──────────
export function sendAgentRequestEmail(
  adminEmail: string,
  userName: string,
  userEmail: string,
  lastMessage: string,
): Promise<void> {
  return sendEmail({
    to: adminEmail,
    subject: `[NovaBit] Agent Request — ${userName}`,
    html: baseTemplate(`
      ${badge("Support Request")}
      ${h1("New Human Agent Request")}
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:4px 16px;margin:16px 0;">
        ${infoRow("User", userName)}
        ${infoRow("Email", userEmail)}
      </table>
      ${divider()}
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ffffff;">Last Message</p>
      <blockquote style="margin:0;padding:12px 16px;background:#0d0d0d;border-left:3px solid #f0b90b;border-radius:0 8px 8px 0;font-size:14px;color:#cccccc;">${lastMessage}</blockquote>
    `),
  });
}
