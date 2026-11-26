"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Shield, ArrowRight, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t        = useTranslations("auth");
  const router   = useRouter();
  const { hydrate } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "oauth_no_email") toast.error("Your X/Twitter account has no public email. Enable email sharing in Twitter settings or use another login method.");
    if (err === "oauth_failed")   toast.error("Social login failed. Please try again.");
  }, []);

  const [step, setStep]               = useState<"login" | "totp" | "email_otp">("login");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [otp, setOtp]                 = useState("");
  const [loading, setLoading]         = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendRemaining, setResendRemaining] = useState(3);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

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
      if (data.needs_email_verify) {
        setOtp("");
        setResendRemaining(3);
        setResendCooldown(30);
        setStep("email_otp");
        return;
      }
      if (data.needs2fa) {
        setPendingToken(data.pendingToken);
        setStep("totp");
        return;
      }
      await hydrate();
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Invalid code"); return; }
      await hydrate();
      toast.success("Email verified! Welcome back.");
      router.push("/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpResend = async () => {
    if (resendCooldown > 0 || resendRemaining <= 0) return;
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setResendRemaining(data.remaining ?? 0);
      setResendCooldown(30);
      toast.success("New verification code sent!");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Invalid code"); return; }
      await hydrate();
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "email_otp") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
            <div className="w-14 h-14 bg-ex-green/10 rounded-2xl flex items-center justify-center mb-5">
              <Shield className="w-7 h-7 text-ex-green" />
            </div>
            <h2 className="text-2xl font-black mb-1">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mb-6">
              A verification code was sent to <strong className="text-white">{email}</strong>. Enter it below to complete login.
            </p>
            <form onSubmit={handleEmailOtp} className="space-y-4">
              <input
                className="ex-input text-center text-2xl font-num tracking-[0.4em] font-bold"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} autoFocus required
              />
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? t("verifying") : "Verify & Login"}
              </button>
              <div className="text-center">
                {resendRemaining > 0 ? (
                  <button
                    type="button"
                    onClick={handleEmailOtpResend}
                    disabled={resendCooldown > 0}
                    className="text-xs text-ex-yellow hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : `Resend Code (${resendRemaining} left)`}
                  </button>
                ) : (
                  <span className="text-xs text-gray-600">Maximum resend attempts reached</span>
                )}
              </div>
              <button type="button" onClick={() => setStep("login")}
                className="text-xs text-gray-500 hover:text-gray-300 w-full text-center transition-colors">
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === "totp") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
            <div className="w-14 h-14 bg-ex-yellow/10 rounded-2xl flex items-center justify-center mb-5">
              <Shield className="w-7 h-7 text-ex-yellow" />
            </div>
            <h2 className="text-2xl font-black mb-1">{t("2fa_title")}</h2>
            <p className="text-gray-400 text-sm mb-6">Enter the 6-digit code from your Google Authenticator app.</p>
            <form onSubmit={handleTotp} className="space-y-4">
              <input
                className="ex-input text-center text-2xl font-num tracking-[0.4em] font-bold"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} autoFocus required
              />
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? t("verifying") : t("2fa_verify")}
              </button>
              <button type="button" onClick={() => setStep("login")}
                className="text-xs text-gray-500 hover:text-gray-300 w-full text-center transition-colors">
                ← Back to login
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
            <Zap className="w-4 h-4" /> GROXchange
          </div>
          <h1 className="text-3xl font-black">{t("login_title")}</h1>
          <p className="text-gray-400 mt-1">{t("login_subtitle")}</p>
        </div>

        <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
          {/* OAuth buttons */}
          <div className="flex gap-2 mb-4">
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-white/5 border border-ex-border rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t("continue_google")}
          </a>
          <a
            href="/api/auth/twitter"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-white/5 border border-ex-border rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {t("continue_x")}
          </a>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ex-border" />
            <span className="text-xs text-gray-600">{t("or_signin_email")}</span>
            <div className="flex-1 h-px bg-ex-border" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t("email_label")}</label>
              <input className="ex-input" type="email" required autoComplete="email"
                placeholder={t("email_placeholder")} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t("password_label")}</label>
              <div className="relative">
                <input className="ex-input pr-10" type={showPw ? "text" : "password"} required
                  autoComplete="current-password" placeholder={t("password_placeholder")}
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t("signing_in")}</> : <>{t("login_button")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t("no_account")}{" "}
            <Link href="/register" className="text-ex-yellow hover:underline font-semibold">
              {t("sign_up")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
