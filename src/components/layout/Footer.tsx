import Link from "next/link";
import { TrendingUp, AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ex-card border-t border-ex-border mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-ex-yellow flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg">
                Nova<span className="text-ex-yellow">Bit</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              A demo exchange platform built for academic and educational purposes only.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Exchange</h4>
            <ul className="space-y-2">
              {["Markets", "Trade", "Spot Trading", "Futures (Demo)"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Account</h4>
            <ul className="space-y-2">
              {["Register", "Login", "Dashboard", "KYC Verification", "Withdraw"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Campaign</h4>
            <ul className="space-y-2">
              {["Loan Campaign", "How It Works", "Terms & Conditions", "FAQ", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Demo disclaimer */}
        <div className="mt-10 p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-300 leading-relaxed">
            <strong className="text-red-200">IMPORTANT DISCLAIMER:</strong> NovaBit Exchange is a demo project
            created for a class assignment. It is NOT a real cryptocurrency exchange. All features, loan campaigns,
            KYC flows, and transaction flows are simulated for educational purposes only. Do NOT send any real
            money, cryptocurrency, or personal documents to this platform. The &quot;gas fee&quot; withdrawal
            flow shown is an intentional demonstration of advance-fee fraud patterns used in scam operations.
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-ex-border">
          <p className="text-xs text-gray-600">
            © 2024 NovaBit Exchange | Demo Project (Class Assignment). All rights reserved.
          </p>
          <div className="flex gap-4">
            {["Privacy Policy", "Terms of Service", "Risk Disclosure"].map((item) => (
              <Link key={item} href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
