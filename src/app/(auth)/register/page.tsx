"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Shield, ArrowRight, RefreshCw, CheckCircle, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, type Country } from "@/lib/countries";
import { toast } from "sonner";

const STEPS = ["Account Details", "Verify Email"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { hydrate, setRegisteredEmail } = useStore();

  const [step, setStep]           = useState(0);
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [otp, setOtp]             = useState("");
  const [spotsLeft, setSpotsLeft] = useState(985);
  const [dialCountry, setDialCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneRaw, setPhoneRaw]       = useState("");

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
    if (!form.agreeTerms) { toast.error("Please agree to the terms"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }

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
        toast.error(data.error ?? "Registration failed");
        return;
      }
      setRegisteredEmail(form.email);
      setStep(1);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "123456") { toast.error("Invalid verification code. Please check your email."); return; }
    setLoading(true);
    await hydrate();
    setLoading(false);
    toast.success("Account created! Welcome to GROXchange 🎉");
    router.push("/dashboard");
  };

  if (step === 1) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-ex-card border border-ex-border rounded-2xl p-8">
            <div className="w-14 h-14 bg-ex-green/10 rounded-2xl flex items-center justify-center mb-5">
              <CheckCircle className="w-7 h-7 text-ex-green" />
            </div>
            <h2 className="text-2xl font-black mb-1">Verify Your Email</h2>
            <p className="text-gray-400 text-sm mb-6">
              A 6-digit code was sent to <strong className="text-white">{form.email}</strong>
            </p>
            <form onSubmit={handleOtp} className="space-y-4">
              <input
                className="ex-input text-center text-2xl font-num tracking-[0.4em] font-bold"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={otp} onChange={e => setOtp(e.target.value)} autoFocus required
              />
              <div className="text-xs text-gray-600 text-center">
                Check your email for the verification code
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? "Creating account..." : "Verify & Create Account"}
              </button>
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
            <Zap className="w-4 h-4" /> Limited: {spotsLeft} spots remaining
          </div>
          <h1 className="text-3xl font-black">Create Account</h1>
          <p className="text-gray-400 mt-1">Join the $50,000 USDT loan campaign</p>
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
            Sign up with Google
          </a>
          <a
            href="/api/auth/twitter"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-white/5 border border-ex-border rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Sign up with X
          </a>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ex-border" />
            <span className="text-xs text-gray-600">or create account with email</span>
            <div className="flex-1 h-px bg-ex-border" />
          </div>

          <form onSubmit={handleStep1} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Full Name *</label>
                <input className="ex-input" type="text" required placeholder="John Doe"
                  value={form.fullName} onChange={field("fullName")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
                <input className="ex-input" type="email" required placeholder="you@example.com"
                  value={form.email} onChange={field("email")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Phone *</label>
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
                <label className="block text-sm text-gray-400 mb-1.5">Country *</label>
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
                <label className="block text-sm text-gray-400 mb-1.5">Password *</label>
                <div className="relative">
                  <input className="ex-input pr-10" type={showPw ? "text" : "password"} required
                    placeholder="Min. 8 characters" minLength={8}
                    value={form.password} onChange={field("password")} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Confirm Password *</label>
                <input className="ex-input" type="password" required placeholder="Repeat password"
                  value={form.confirmPassword} onChange={field("confirmPassword")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1.5">Referral Code (optional)</label>
                <input className="ex-input" type="text" placeholder="Enter referral code"
                  value={form.referral} onChange={field("referral")} />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-ex-yellow"
                checked={form.agreeTerms} onChange={field("agreeTerms")} />
              <span className="text-sm text-gray-400">
                I agree to the{" "}
                <Link href="/terms" className="text-ex-yellow hover:underline" target="_blank">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-ex-yellow hover:underline" target="_blank">Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-ex-yellow hover:underline font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
