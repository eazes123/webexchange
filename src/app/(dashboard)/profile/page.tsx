"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Globe, Lock, CheckCircle, AlertCircle, ChevronDown, FileText, Clock, XCircle, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { toast } from "sonner";

export default function ProfilePage() {
  const { demoUser, hydrate } = useStore();
  const router = useRouter();

  const [fullName, setFullName]       = useState("");
  const [phone, setPhone]             = useState("");
  const [dialCode, setDialCode]       = useState("+1");
  const [country, setCountry]         = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [dialOpen, setDialOpen]       = useState(false);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (demoUser.name) {
      setFullName(demoUser.name);
      setCountry(demoUser.country ?? "");
      // Parse stored phone into dial+number
      if (demoUser.phone) {
        const match = COUNTRIES.find(c => demoUser.phone.startsWith(c.dial));
        if (match) {
          setDialCode(match.dial);
          setPhone(demoUser.phone.slice(match.dial.length).trim());
        } else {
          setPhone(demoUser.phone);
        }
      }
    }
  }, [demoUser.name]);

  const isGoogleAccount = demoUser.email && !demoUser.phone && !demoUser.country && demoUser.name;
  const profileIncomplete = !demoUser.phone || !demoUser.country;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() ? `${dialCode}${phone.trim()}` : "",
          country: country.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save");
        return;
      }
      await hydrate();
      toast.success("Profile updated!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const selectedCountry = COUNTRIES.find(c => c.name === country);
  const selectedDial    = COUNTRIES.find(c => c.dial === dialCode);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information</p>
      </div>

      {/* Incomplete profile alert */}
      {profileIncomplete && (
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Profile incomplete</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add your phone number and country to fully verify your account.
              {" "}This is required before KYC submission.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* Account info (read-only) */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Account</h2>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email address</label>
            <div className="ex-input flex items-center gap-2 opacity-60 cursor-not-allowed select-none">
              <Mail className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-300">{demoUser.email}</span>
            </div>
          </div>

          {/* Sign-in method */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Sign-in method</label>
            <div className="ex-input flex items-center gap-2 opacity-60 cursor-not-allowed select-none">
              {demoUser.phone === "" && demoUser.country === "" ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 48 48" className="shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="text-sm text-gray-300">Google Sign-In</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-300">Email &amp; Password</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-ex-card border border-ex-border rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Personal Info</h2>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="ex-input pl-9 w-full"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full legal name"
                required
                minLength={2}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Phone number
              {!demoUser.phone && <span className="ml-2 text-amber-400 text-xs">Required</span>}
            </label>
            <div className="flex gap-2">
              {/* Dial code picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setDialOpen(o => !o); setCountryOpen(false); }}
                  className="ex-input flex items-center gap-1.5 min-w-[80px] px-3 h-full"
                >
                  <span className="text-sm">{selectedDial ? flagEmoji(selectedDial.code) : "🌐"}</span>
                  <span className="text-xs text-gray-300">{dialCode}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500 ml-auto" />
                </button>
                {dialOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-ex-card2 border border-ex-border rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                    {COUNTRIES.map(c => (
                      <button key={c.code} type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 text-left"
                        onClick={() => { setDialCode(c.dial); setDialOpen(false); }}
                      >
                        <span>{flagEmoji(c.code)}</span>
                        <span className="text-gray-300 truncate flex-1">{c.name}</span>
                        <span className="text-gray-500">{c.dial}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  className="ex-input pl-9 w-full"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Country
              {!demoUser.country && <span className="ml-2 text-amber-400 text-xs">Required</span>}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setCountryOpen(o => !o); setDialOpen(false); }}
                className="ex-input w-full flex items-center gap-2 text-left"
              >
                <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                {selectedCountry ? (
                  <span className="flex items-center gap-2 flex-1 text-sm text-white">
                    <span>{flagEmoji(selectedCountry.code)}</span>
                    {selectedCountry.name}
                  </span>
                ) : (
                  <span className="flex-1 text-sm text-gray-500">Select country</span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
              </button>
              {countryOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-ex-card2 border border-ex-border rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
                  {COUNTRIES.map(c => (
                    <button key={c.code} type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 text-left"
                      onClick={() => { setCountry(c.name); setCountryOpen(false); }}
                    >
                      <span>{flagEmoji(c.code)}</span>
                      <span className="text-gray-300">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save */}
        <button type="submit" disabled={saving} className="btn-primary w-full py-3 font-bold text-sm">
          {saving ? "Saving…" : "Save changes"}
        </button>

      </form>

      {/* KYC status card */}
      <div className="mt-5 bg-ex-card border border-ex-border rounded-2xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">KYC Verification</h2>
        {demoUser.kycStatus === "none" && (
          <Link href="/kyc" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-gray-800 border border-ex-border flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Not submitted</p>
              <p className="text-xs text-gray-500">Complete KYC to unlock staking and loan access</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        )}
        {(demoUser.kycStatus === "under_review" || demoUser.kycStatus === "pending") && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">Under Review</p>
              <p className="text-xs text-gray-500">Your documents are being reviewed. Usually takes 24-48 hours.</p>
            </div>
          </div>
        )}
        {demoUser.kycStatus === "approved" && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400">Verified</p>
              <p className="text-xs text-gray-500">Your identity has been successfully verified.</p>
            </div>
          </div>
        )}
        {demoUser.kycStatus === "rejected" && (
          <Link href="/kyc" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Rejected — Resubmit required</p>
              <p className="text-xs text-gray-500">Your KYC was rejected. Click here to resubmit with correct documents.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        )}
      </div>

    </div>
  );
}
