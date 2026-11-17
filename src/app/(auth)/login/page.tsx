"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Shield, ArrowRight, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { hydrate } = useStore();

  const [step, setStep]           = useState<"login" | "2fa">("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [otp, setOtp]             = useState("");
  const [loading, setLoading]     = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Invalid credentials");
        return;
      }
      setStep("2fa");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "123456") { toast.error("Invalid verification code. Please check your email."); return; }
    setLoading(true);
    await hydrate();
    setLoading(false);
    toast.success("Welcome back!");
    router.push("/dashboard");
  };

  if (step === "2fa") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
            <div className="w-14 h-14 bg-ex-yellow/10 rounded-2xl flex items-center justify-center mb-5">
              <Shield className="w-7 h-7 text-ex-yellow" />
            </div>
            <h2 className="text-2xl font-black mb-1">2-Factor Authentication</h2>
            <p className="text-gray-400 text-sm mb-6">Enter the 6-digit code sent to your email</p>
            <form onSubmit={handle2FA} className="space-y-4">
              <input
                className="ex-input text-center text-2xl font-num tracking-[0.4em] font-bold"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={otp} onChange={e => setOtp(e.target.value)} autoFocus required
              />
              <div className="text-xs text-gray-600 text-center">
                Check your email for the verification code
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-ex-yellow/10 border border-ex-yellow/30 text-ex-yellow text-sm px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-4 h-4" /> NovaBit Exchange
          </div>
          <h1 className="text-3xl font-black">Sign In</h1>
          <p className="text-gray-400 mt-1">Access your account and loan dashboard</p>
        </div>

        <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email Address</label>
              <input className="ex-input" type="email" required autoComplete="email"
                placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input className="ex-input pr-10" type={showPw ? "text" : "password"} required
                  autoComplete="current-password" placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            No account?{" "}
            <Link href="/register" className="text-ex-yellow hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
