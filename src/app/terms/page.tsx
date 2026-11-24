import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — GROXchange",
  description: "GROXchange Terms of Service: rules governing your use of our platform, loan campaign, staking, and exchange services.",
};

const LAST_UPDATED = "November 24, 2026";
const EFFECTIVE_DATE = "November 24, 2026";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#555" }}>
            <span>Effective: {EFFECTIVE_DATE}</span>
            <span>Last updated: {LAST_UPDATED}</span>
          </div>
        </div>

        <div style={{ color: "#999", lineHeight: 1.8, fontSize: "14px" }}>

          {/* Intro */}
          <p style={{ marginBottom: "32px", color: "#bbb" }}>
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using the GROXchange platform,
            website, mobile applications, or any associated services (collectively, the &quot;Service&quot;)
            operated by GROXchange (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree with
            any part of these Terms, you may not access the Service.
          </p>

          <Section title="1. Eligibility and Account Registration">
            <p>To use the Service, you must:</p>
            <ul>
              <li>Be at least 18 years of age or the age of legal majority in your jurisdiction, whichever is greater.</li>
              <li>Not be a resident of, or located in, any jurisdiction where participation in cryptocurrency activities is prohibited or restricted by law, including without limitation the United States of America, North Korea, Iran, Cuba, Syria, or any jurisdiction subject to OFAC sanctions.</li>
              <li>Have full legal capacity to enter into these Terms.</li>
              <li>Provide accurate, current, and complete information during account registration, and maintain the accuracy of such information.</li>
              <li>Not have been previously suspended or removed from the Service.</li>
            </ul>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You must immediately notify us of any unauthorized use
              of your account. We are not liable for any loss or damage arising from your failure to comply
              with this obligation.
            </p>
            <p>
              We reserve the right to refuse service, terminate accounts, or cancel orders in our sole discretion,
              including if we believe that user conduct violates applicable law or is harmful to our interests.
            </p>
          </Section>

          <Section title="2. Know Your Customer (KYC) and Identity Verification">
            <p>
              To access the full functionality of the Service, including the loan campaign and staking features,
              you must complete our KYC verification process. This requires you to submit:
            </p>
            <ul>
              <li>Government-issued photo identification (passport, national ID card, or driver&apos;s license).</li>
              <li>Proof of address (utility bill, bank statement, or equivalent document, issued within the last three months).</li>
              <li>A live selfie or selfie with ID as requested.</li>
            </ul>
            <p>
              By submitting KYC documents, you represent and warrant that all submitted documents are genuine,
              belong to you, and are not altered or fabricated in any way. Submitting false or forged documents
              may result in permanent account termination, forfeiture of any staked or deposited funds, and
              reporting to the relevant authorities.
            </p>
            <p>
              KYC review is conducted within 24–72 business hours. We reserve the right to request additional
              documentation at any time and to reject applications at our sole discretion without providing
              a reason.
            </p>
          </Section>

          <Section title="3. The Loan Campaign and Staking">
            <p>
              GROXchange operates a staking-based loan campaign (&quot;Campaign&quot;) under which eligible users
              who complete KYC verification may stake a specified amount of USDT and receive a loan disbursement
              in return. By participating in the Campaign, you acknowledge and agree to the following:
            </p>
            <ul>
              <li><strong style={{ color: "#ddd" }}>Staking Requirement:</strong> Participation requires a stake of 500 USDT (or such other amount as we may specify from time to time). The staked amount is locked for the duration of the Campaign period.</li>
              <li><strong style={{ color: "#ddd" }}>Loan Disbursement:</strong> Upon successful KYC approval and staking confirmation, you may become eligible to receive a loan disbursement of up to $50,000 USDT, subject to availability and campaign conditions.</li>
              <li><strong style={{ color: "#ddd" }}>Activation Fee:</strong> An activation fee may be required prior to loan disbursement. This fee covers administrative processing and is non-refundable if you withdraw your application after payment.</li>
              <li><strong style={{ color: "#ddd" }}>No Guarantee:</strong> Participation in the Campaign does not guarantee loan approval or disbursement. We reserve the right to modify, pause, or terminate the Campaign at any time without prior notice.</li>
              <li><strong style={{ color: "#ddd" }}>Repayment:</strong> Loans disbursed under the Campaign are subject to repayment terms communicated at disbursement. Failure to repay may result in forfeiture of your staked collateral and other remedies available to us.</li>
              <li><strong style={{ color: "#ddd" }}>Staking Risks:</strong> Cryptocurrency values are highly volatile. The value of staked assets may decrease significantly. You accept all market risk associated with your staked assets.</li>
            </ul>
          </Section>

          <Section title="4. Deposits, Withdrawals, and Wallet Usage">
            <p>
              All deposits and withdrawals on the platform are subject to the following conditions:
            </p>
            <ul>
              <li>Deposit addresses are unique to each user and generated from a hierarchical deterministic (HD) wallet. Only send supported assets to the correct network (TRC20 for USDT/TRON; BEP20 for BNB Chain assets). Sending unsupported assets or sending to the wrong network may result in permanent loss of funds, for which we bear no responsibility.</li>
              <li>Withdrawals are subject to minimum amounts and network fees as displayed at the time of withdrawal. We reserve the right to modify fees with reasonable notice.</li>
              <li>Withdrawal requests are processed within 24–48 hours under normal operating conditions. Delays may occur during periods of high demand or network congestion.</li>
              <li>We reserve the right to delay, freeze, or reject any withdrawal if we suspect fraudulent activity, money laundering, sanctions violations, or any other suspicious activity.</li>
              <li>You are solely responsible for providing accurate wallet addresses. We cannot reverse transactions once broadcast to the blockchain.</li>
            </ul>
          </Section>

          <Section title="5. Prohibited Activities">
            <p>You agree not to engage in any of the following activities:</p>
            <ul>
              <li>Using the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
              <li>Money laundering, terrorist financing, fraud, or any other financial crime.</li>
              <li>Using the Service with funds derived from illegal activities.</li>
              <li>Attempting to circumvent our KYC/AML procedures, including by submitting false information or identity documents.</li>
              <li>Using automated tools, bots, scrapers, or scripts to access, interact with, or extract data from the Service without our prior written consent.</li>
              <li>Creating multiple accounts to circumvent restrictions or gain unfair advantage.</li>
              <li>Interfering with or disrupting the integrity or performance of the Service.</li>
              <li>Attempting to gain unauthorized access to any part of the Service or its related systems.</li>
              <li>Reverse engineering, decompiling, or disassembling any part of the Service.</li>
              <li>Engaging in any conduct that damages, disables, or impairs our systems or other users&apos; ability to use the Service.</li>
            </ul>
            <p>
              Violation of these prohibitions may result in immediate account termination, forfeiture of funds,
              and civil or criminal liability.
            </p>
          </Section>

          <Section title="6. Fees and Charges">
            <p>
              We charge fees for certain services, including but not limited to withdrawal fees, trading fees,
              and campaign-related fees. All applicable fees are displayed on the relevant pages of the Service
              before you confirm any transaction. Fees are non-refundable unless we expressly state otherwise
              or as required by applicable law. We reserve the right to change our fee structure at any time
              with reasonable notice via email or platform notification.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive
              property of GROXchange and its licensors. Our name, logo, and trademarks may not be used in
              connection with any product or service without our prior written consent.
            </p>
            <p>
              You retain ownership of data and content you submit to the Service, but you grant us a worldwide,
              non-exclusive, royalty-free license to use, store, and process such data for the purpose of
              providing the Service.
            </p>
          </Section>

          <Section title="8. Privacy and Data Protection">
            <p>
              Your privacy matters to us. Our collection, use, and storage of your personal information is
              governed by our{" "}
              <Link href="/privacy" style={{ color: "#f0b90b", textDecoration: "none" }}>Privacy Policy</Link>,
              which is incorporated into these Terms by reference. By using the Service, you consent to the
              data practices described in our Privacy Policy.
            </p>
          </Section>

          <Section title="9. Third-Party Services and Links">
            <p>
              The Service may contain links to third-party websites or services. These links are provided for
              convenience only. We have no control over and assume no responsibility for the content, privacy
              policies, or practices of any third-party sites. We encourage you to review the terms and privacy
              policies of any third-party services you interact with.
            </p>
          </Section>

          <Section title="10. Disclaimers and Limitation of Liability">
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT ANY WARRANTIES
              OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </p>
            <p>
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE; THAT DEFECTS
              WILL BE CORRECTED; OR THAT THE SERVICE OR THE SERVERS THAT MAKE IT AVAILABLE ARE FREE OF VIRUSES
              OR OTHER HARMFUL COMPONENTS.
            </p>
            <p>
              CRYPTOCURRENCY MARKETS ARE HIGHLY VOLATILE. THE VALUE OF DIGITAL ASSETS CAN FLUCTUATE SIGNIFICANTLY
              IN A SHORT PERIOD. YOU ACKNOWLEDGE THAT YOU ARE PARTICIPATING AT YOUR OWN RISK AND THAT PAST
              PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS.
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL GROXCHANGE, ITS AFFILIATES,
              DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE,
              GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (I) YOUR ACCESS TO OR USE OF (OR INABILITY
              TO ACCESS OR USE) THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE;
              (III) ANY CONTENT OBTAINED FROM THE SERVICE; AND (IV) UNAUTHORIZED ACCESS, USE, OR ALTERATION
              OF YOUR TRANSMISSIONS OR CONTENT.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE
              OF THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT OF FEES YOU PAID TO US IN THE THREE MONTHS
              PRECEDING THE CLAIM.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to defend, indemnify, and hold harmless GROXchange and its affiliates, officers,
              directors, employees, and agents from and against any and all claims, damages, obligations,
              losses, liabilities, costs, or debt, and expenses (including but not limited to attorney&apos;s fees)
              arising from: (i) your use of and access to the Service; (ii) your violation of any provision
              of these Terms; (iii) your violation of any third-party rights, including any intellectual
              property or privacy rights; or (iv) any claim that your conduct caused damage to a third party.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior
              notice or liability, for any reason, including if you breach these Terms. Upon termination,
              your right to use the Service ceases immediately.
            </p>
            <p>
              If your account is terminated due to breach of these Terms, any staked or deposited funds may
              be subject to review, freeze, or forfeiture as permitted by applicable law. If your account is
              terminated for other reasons, we will process any pending withdrawals of your legitimate balances
              in accordance with our standard procedures.
            </p>
            <p>
              You may close your account at any time by contacting us. Closing your account does not relieve
              you of obligations incurred prior to closure.
            </p>
          </Section>

          <Section title="13. Dispute Resolution and Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with applicable law, without regard
              to conflict of law principles. Any disputes arising from or relating to these Terms or the Service
              shall first be attempted to be resolved through good-faith negotiation. If negotiation fails,
              disputes shall be submitted to binding arbitration on an individual basis. You waive any right
              to participate in class-action lawsuits or class-wide arbitration.
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We reserve the right to modify or replace these Terms at any time at our sole discretion.
              If a revision is material, we will provide at least 30 days&apos; notice prior to the new terms
              taking effect, via email or prominent notice on the Service. What constitutes a material change
              will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use the Service after any revisions become effective, you agree to
              be bound by the revised Terms. If you do not agree to the new Terms, you are no longer authorized
              to use the Service.
            </p>
          </Section>

          <Section title="15. Contact Us">
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul>
              <li>By visiting the support section of our platform.</li>
              <li>Through the live chat feature available on our website.</li>
            </ul>
          </Section>

        </div>

        {/* Footer nav */}
        <div style={{ marginTop: "56px", paddingTop: "32px", borderTop: "1px solid #1a1a1a", display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: "13px", color: "#f0b90b", textDecoration: "none" }}>
            Privacy Policy
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
