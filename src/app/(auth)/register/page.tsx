"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Shield, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";
import { useStore } from "@/lib/store";

const COUNTRIES = ["United States","United Kingdom","Canada","Germany","Australia","UAE","India","Singapore","Turkey","France","Netherlands","Saudi Arabia","Malaysia","Bangladesh","Pakistan"];
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

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setSpotsLeft(d.spotsLeft ?? Math.max(10, 1000 - (d.stakedCount ?? 0))))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    fullName:        "",
    email:           "",
    phone:           "",
    country:         "United States",
    password:        "",
    confirmPassword: "",
    referral:        "",
    agreeTerms:      false,
  });

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
          phone: form.phone,
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
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Phone *</label>
                <input className="ex-input" type="tel" required placeholder="+1 (555) 000-0000"
                  value={form.phone} onChange={field("phone")} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Country *</label>
                <select className="ex-input" value={form.country} onChange={field("country")}>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
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
                <span className="text-ex-yellow cursor-pointer hover:underline">Terms of Service</span>{" "}
                and{" "}
                <span className="text-ex-yellow cursor-pointer hover:underline">Privacy Policy</span>
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
