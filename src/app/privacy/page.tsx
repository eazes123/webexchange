import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — GROXchange",
  description: "GROXchange Privacy Policy: how we collect, use, and protect your personal information.",
};

const LAST_UPDATED = "November 24, 2026";
const EFFECTIVE_DATE = "November 24, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <span style={{ fontWeight: 900, fontSize: "22px", color: "#fff", letterSpacing: "-0.03em" }}>
              GROX<span style={{ color: "#f0b90b" }}>change</span>
            </span>
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: "12px" }}>
            Privacy Policy
          </h1>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#555" }}>
            <span>Effective: {EFFECTIVE_DATE}</span>
            <span>Last updated: {LAST_UPDATED}</span>
          </div>
        </div>

        <div style={{ color: "#999", lineHeight: 1.8, fontSize: "14px" }}>

          <p style={{ marginBottom: "32px", color: "#bbb" }}>
            GROXchange (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our platform, website, and services (the &quot;Service&quot;).
            Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
          </p>

          <Section title="1. Information We Collect">
            <p><strong style={{ color: "#ddd" }}>1.1 Information You Provide Directly</strong></p>
            <p>When you register and use the Service, we collect:</p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Account Information:</strong> Full name, email address, phone number, and country of residence.</li>
              <li><strong style={{ color: "#ccc" }}>Identity Verification (KYC) Documents:</strong> Government-issued ID (passport, national ID card, driver&apos;s license), proof of address documents, selfie or selfie-with-ID images, date of birth, residential address, and nationality.</li>
              <li><strong style={{ color: "#ccc" }}>Financial Information:</strong> Cryptocurrency wallet addresses, transaction history on our platform, staking amounts, and withdrawal requests.</li>
              <li><strong style={{ color: "#ccc" }}>Communications:</strong> Any messages you send us via chat support, email, or other channels.</li>
            </ul>

            <p style={{ marginTop: "16px" }}><strong style={{ color: "#ddd" }}>1.2 Information Collected Automatically</strong></p>
            <p>When you use the Service, we automatically collect:</p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Usage Data:</strong> Pages visited, features used, time spent on pages, links clicked, and other actions taken within the Service.</li>
              <li><strong style={{ color: "#ccc" }}>Device and Technical Data:</strong> IP address, browser type and version, operating system, device identifiers, and time zone.</li>
              <li><strong style={{ color: "#ccc" }}>Cookies and Tracking:</strong> Session cookies (required for authentication), preference cookies, and analytics data. See Section 6 for more on cookies.</li>
            </ul>

            <p style={{ marginTop: "16px" }}><strong style={{ color: "#ddd" }}>1.3 Information from Third Parties</strong></p>
            <p>If you choose to register or sign in using a third-party identity provider (such as Google), we receive basic profile information (name, email address, and profile picture) from that provider, subject to your privacy settings with them.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account, and verify your identity.</li>
              <li>Process transactions, staking, and loan applications.</li>
              <li>Comply with legal obligations, including Anti-Money Laundering (AML) and Know Your Customer (KYC) requirements under applicable law.</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activity.</li>
              <li>Send you transaction confirmations, security alerts, service announcements, and account-related notifications.</li>
              <li>Respond to your support requests and communications.</li>
              <li>Analyze usage patterns to improve the Service, debug issues, and develop new features.</li>
              <li>Send you marketing communications, where permitted by law and with your consent where required.</li>
              <li>Enforce our Terms of Service and protect our legal rights.</li>
            </ul>
          </Section>

          <Section title="3. Legal Basis for Processing (EEA/UK Users)">
            <p>
              If you are located in the European Economic Area or United Kingdom, we process your personal data
              under the following legal bases:
            </p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Performance of a Contract:</strong> Processing necessary to fulfill our obligations to you, including account management and transaction processing.</li>
              <li><strong style={{ color: "#ccc" }}>Legal Obligation:</strong> Processing required to comply with KYC/AML laws, financial regulations, and other applicable legal requirements.</li>
              <li><strong style={{ color: "#ccc" }}>Legitimate Interests:</strong> Fraud prevention, security, service improvement, and protection of our business interests.</li>
              <li><strong style={{ color: "#ccc" }}>Consent:</strong> Marketing communications and certain analytics activities, where consent is required by law.</li>
            </ul>
          </Section>

          <Section title="4. How We Share Your Information">
            <p>We do not sell your personal information. We may share it only in the following circumstances:</p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Service Providers:</strong> With trusted third-party vendors who assist us in operating the Service, including cloud hosting providers (Supabase, Vercel), email service providers (Resend), and identity verification services. These providers access your data only as necessary to perform their services and are contractually bound to protect it.</li>
              <li><strong style={{ color: "#ccc" }}>Legal Requirements:</strong> When required by law, court order, government authority, or to comply with legal process. This includes disclosures required under AML/KYC regulations.</li>
              <li><strong style={{ color: "#ccc" }}>Safety and Fraud Prevention:</strong> To investigate or prevent suspected fraud, illegal activity, or threats to the safety of any person.</li>
              <li><strong style={{ color: "#ccc" }}>Business Transfers:</strong> In connection with a merger, acquisition, sale of assets, or other business transaction, subject to the acquiring party agreeing to honor this Privacy Policy.</li>
              <li><strong style={{ color: "#ccc" }}>With Your Consent:</strong> In any other case with your explicit consent.</li>
            </ul>
            <p>
              Blockchain transactions are publicly visible by nature. When you make on-chain deposits or withdrawals,
              your wallet address and transaction details are recorded on the public blockchain and are visible to
              anyone who queries it. We have no control over public blockchain data.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your personal information for as long as necessary to provide the Service and fulfill the
              purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted
              by law.
            </p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Account Data:</strong> Retained for the duration of your account plus 5 years after closure, to comply with financial regulations.</li>
              <li><strong style={{ color: "#ccc" }}>KYC Documents:</strong> Retained for a minimum of 5 years after the end of your business relationship with us, as required by AML regulations in many jurisdictions.</li>
              <li><strong style={{ color: "#ccc" }}>Transaction Records:</strong> Retained for 7 years as required by financial record-keeping obligations.</li>
              <li><strong style={{ color: "#ccc" }}>Communications:</strong> Support messages and communications are retained for 2 years.</li>
              <li><strong style={{ color: "#ccc" }}>Marketing Consent:</strong> Retained until you withdraw consent.</li>
            </ul>
            <p>
              When we no longer have a legitimate need to process your information, we will securely delete or
              anonymize it.
            </p>
          </Section>

          <Section title="6. Cookies and Tracking Technologies">
            <p>We use cookies and similar tracking technologies on our Service:</p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Strictly Necessary Cookies:</strong> Session authentication cookies (e.g., <code style={{ background: "#111", padding: "1px 5px", borderRadius: "3px", fontSize: "12px", color: "#aaa" }}>nb_session</code>) that are essential for the Service to function. You cannot opt out of these.</li>
              <li><strong style={{ color: "#ccc" }}>Preference Cookies:</strong> Cookies that remember your settings and preferences to improve your experience.</li>
              <li><strong style={{ color: "#ccc" }}>Analytics Cookies:</strong> Used to understand how you interact with our Service, helping us improve it. These are set only with your consent where required by law.</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling certain cookies may affect the
              functionality of the Service.
            </p>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit (TLS/HTTPS) and at rest.</li>
              <li>Hashed and salted password storage using bcrypt.</li>
              <li>Role-based access controls limiting which personnel can access sensitive data.</li>
              <li>Regular security audits and vulnerability assessments.</li>
              <li>httpOnly, Secure, and SameSite cookie attributes for session tokens.</li>
            </ul>
            <p>
              Despite these measures, no method of transmission over the Internet or electronic storage is
              100% secure. We cannot guarantee absolute security of your information. In the event of a data
              breach affecting your rights, we will notify you as required by applicable law.
            </p>
          </Section>

          <Section title="8. Your Rights and Choices">
            <p>
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong style={{ color: "#ccc" }}>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong style={{ color: "#ccc" }}>Deletion:</strong> Request deletion of your personal data, subject to our legal obligations to retain certain records.</li>
              <li><strong style={{ color: "#ccc" }}>Portability:</strong> Request your data in a structured, machine-readable format where technically feasible.</li>
              <li><strong style={{ color: "#ccc" }}>Objection:</strong> Object to processing of your personal data for direct marketing purposes.</li>
              <li><strong style={{ color: "#ccc" }}>Restriction:</strong> Request restriction of processing in certain circumstances.</li>
              <li><strong style={{ color: "#ccc" }}>Withdraw Consent:</strong> Where processing is based on your consent, withdraw it at any time without affecting the lawfulness of prior processing.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us through the support section of the platform.
              We will respond to verified requests within 30 days (or as otherwise required by applicable law).
              We may need to verify your identity before processing your request.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              The Service is not directed at individuals under the age of 18. We do not knowingly collect
              personal information from children under 18. If you become aware that a child has provided
              us with personal information without parental consent, please contact us and we will take
              steps to delete such information.
            </p>
          </Section>

          <Section title="10. International Data Transfers">
            <p>
              Your information may be transferred to and processed in countries other than your country of
              residence. These countries may have data protection laws different from those in your country.
              Where we transfer data internationally, we implement appropriate safeguards (such as standard
              contractual clauses approved by the relevant authorities) to ensure your data receives adequate
              protection.
            </p>
          </Section>

          <Section title="11. Third-Party Services">
            <p>
              Our Service integrates with third-party services, including:
            </p>
            <ul>
              <li><strong style={{ color: "#ccc" }}>Supabase:</strong> Database and authentication infrastructure. Subject to Supabase&apos;s privacy policy.</li>
              <li><strong style={{ color: "#ccc" }}>Vercel:</strong> Hosting and edge network. Subject to Vercel&apos;s privacy policy.</li>
              <li><strong style={{ color: "#ccc" }}>Resend:</strong> Transactional email delivery. Subject to Resend&apos;s privacy policy.</li>
              <li><strong style={{ color: "#ccc" }}>Google (OAuth):</strong> Optional sign-in. Subject to Google&apos;s privacy policy if you choose to use Google sign-in.</li>
              <li><strong style={{ color: "#ccc" }}>TRON / BSC Networks:</strong> Public blockchain networks for cryptocurrency transactions. Transaction data on public blockchains is immutable and publicly accessible.</li>
            </ul>
          </Section>

          <Section title="12. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
              legal requirements, or other factors. We will notify you of material changes by posting the new
              policy on the Service with a revised &quot;Last Updated&quot; date, and may also send you an email notice.
              Your continued use of the Service after the effective date constitutes your acceptance of the
              updated policy.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us:
            </p>
            <ul>
              <li>Through the live chat or support section on our platform.</li>
              <li>By emailing our data protection contact via the platform&apos;s help center.</li>
            </ul>
            <p>
              If you are located in the EEA or UK and believe we have not adequately addressed your privacy
              concerns, you have the right to lodge a complaint with your local data protection authority.
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div style={{ marginTop: "56px", paddingTop: "32px", borderTop: "1px solid #1a1a1a", display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/terms" style={{ fontSize: "13px", color: "#f0b90b", textDecoration: "none" }}>
            Terms of Service
          </Link>
          <Link href="/" style={{ fontSize: "13px", color: "#555", textDecoration: "none" }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ddd", marginBottom: "16px", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </div>
  );
}
