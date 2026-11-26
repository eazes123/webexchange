"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Shield, ArrowRight, RefreshCw, CheckCircle, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, type Country } from "@/lib/countries";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const STEPS = [t("step_account"), t("step_verify")] as const;
  const router = useRouter();
  const { hydrate, setRegisteredEmail } = useStore();

  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [otp, setOtp]                 = useState("");
  const [spotsLeft, setSpotsLeft]     = useState(985);
  const [dialCountry, setDialCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneRaw, setPhoneRaw]       = useState("");
  const [resendRemaining, setResendRemaining] = useState(3);
  const [resendCooldown, setResendCooldown]   = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setSpotsLeft(d.spotsLeft ?? Math.max(10, 1000 - (d.stakedCount ?? 0))))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    fullName:        "",
    email:           "",
    country:         DEFAULT_COUNTRY.name,
    password:        "",
    confirmPassword: "",
    referral:        "",
    agreeTerms:      false,
  });

  const handleCountryChange = (countryName: string) => {
    const c = COUNTRIES.find(x => x.name === countryName) ?? DEFAULT_COUNTRY;
    setForm(f => ({ ...f, country: countryName }));
    setDialCountry(c);
  };

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeTerms) { toast.error(t("terms_required")); return; }
    if (form.password !== form.confirmPassword) { toast.error(t("passwords_mismatch")); return; }
    if (form.password.length < 8) { toast.error(t("password_too_short")); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: phoneRaw ? `${dialCountry.dial}${phoneRaw}` : "",
          country: form.country,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t("registration_failed"));
        return;
      }
      setRegisteredEmail(form.email);
      setStep(1);
    } catch {
      toast.error(t("network_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? t("invalid_2fa")); return; }
      await hydrate();
      toast.success(t("account_created"));
      router.push("/dashboard");
    } catch {
      toast.error(t("network_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendRemaining <= 0) return;
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, type: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setResendRemaining(data.remaining ?? 0);
      setResendCooldown(30);
      toast.success("New verification code sent!");
    } catch {
      toast.error(t("network_error"));
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
            <div className="w-14 h-14 bg-ex-green/10 rounded-2xl flex items-center justify-center mb-5">
              <CheckCircle className="w-7 h-7 text-ex-green" />
            </div>
            <h2 className="text-2xl font-black mb-1">{t("verify_email_title")}</h2>
            <p className="text-gray-400 text-sm mb-6">
              {t("verify_email_subtitle")} <strong className="text-white">{form.email}</strong>
            </p>
            <form onSubmit={handleOtp} className="space-y-4">
              <input
                className="ex-input text-center text-2xl font-num tracking-[0.4em] font-bold"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={otp} onChange={e => setOtp(e.target.value)} autoFocus required
              />
              <div className="text-xs text-gray-600 text-center">
                {t("2fa_check_email")}
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? t("creating_account") : t("verify_create_account")}
              </button>
              <div className="text-center">
                {resendRemaining > 0 ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-xs text-ex-yellow hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : `Resend Code (${resendRemaining} left)`}
                  </button>
                ) : (
                  <span className="text-xs text-gray-600">Maximum resend attempts reached</span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-ex-yellow/10 border border-ex-yellow/30 text-ex-yellow text-sm px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-4 h-4" /> {t("limited_spots", { count: spotsLeft })}
          </div>
          <h1 className="text-3xl font-black">{t("register_title")}</h1>
          <p className="text-gray-400 mt-1">{t("join_campaign")}</p>
        </div>

        <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
          {/* OAuth buttons */}
          <div className="flex gap-2 mb-4">
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-white/5 border border-ex-border rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t("signup_google")}
          </a>
          <a
            href="/api/auth/twitter"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-white/5 border border-ex-border rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {t("signup_x")}
          </a>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ex-border" />
            <span className="text-xs text-gray-600">{t("or_create_email")}</span>
            <div className="flex-1 h-px bg-ex-border" />
          </div>

          <form onSubmit={handleStep1} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("full_name_label")} *</label>
                <input className="ex-input" type="text" required placeholder="John Doe"
                  value={form.fullName} onChange={field("fullName")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("email_label")} *</label>
                <input className="ex-input" type="email" required placeholder="you@example.com"
                  value={form.email} onChange={field("email")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("phone_label")} *</label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      className="ex-input pl-2 pr-7 appearance-none cursor-pointer"
                      style={{ minWidth: "90px" }}
                      value={dialCountry.code}
                      onChange={e => {
                        const c = COUNTRIES.find(x => x.code === e.target.value) ?? DEFAULT_COUNTRY;
                        setDialCountry(c);
                      }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {flagEmoji(c.code)} {c.dial}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    className="ex-input flex-1"
                    type="tel"
                    required
                    placeholder="555 000 0000"
                    value={phoneRaw}
                    onChange={e => setPhoneRaw(e.target.value.replace(/[^\d\s\-().]/g, ""))}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("country_label")} *</label>
                <select
                  className="ex-input"
                  value={form.country}
                  onChange={e => handleCountryChange(e.target.value)}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>
                      {flagEmoji(c.code)} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("password_label")} *</label>
                <div className="relative">
                  <input className="ex-input pr-10" type={showPw ? "text" : "password"} required
                    placeholder={t("password_min")} minLength={8}
                    value={form.password} onChange={field("password")} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("confirm_password_label")} *</label>
                <input className="ex-input" type="password" required placeholder={t("confirm_password_placeholder")}
                  value={form.confirmPassword} onChange={field("confirmPassword")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">{t("referral_label")}</label>
                <input className="ex-input" type="text" placeholder={t("referral_placeholder")}
                  value={form.referral} onChange={field("referral")} />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-ex-yellow"
                checked={form.agreeTerms} onChange={field("agreeTerms")} />
              <span className="text-sm text-gray-400">
                {t("terms_agree")}{" "}
                <Link href="/terms" className="text-ex-yellow hover:underline" target="_blank">{t("terms_link")}</Link>{" "}
                {t("and")}{" "}
                <Link href="/privacy" className="text-ex-yellow hover:underline" target="_blank">{t("privacy_link")}</Link>
              </span>
            </label>

            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t("registering")}</> : <>{t("register_button")} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t("have_account")}{" "}
            <Link href="/login" className="text-ex-yellow hover:underline font-semibold">{t("login_button")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
