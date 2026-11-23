"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, User, FileText, Camera, Home, CheckCircle,
  Upload, ArrowRight, AlertCircle, Lock, Info, Loader2, X, Monitor,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Personal",   icon: User },
  { id: 2, label: "ID Doc",     icon: FileText },
  { id: 3, label: "Selfie",     icon: Camera },
  { id: 4, label: "Address",    icon: Home },
  { id: 5, label: "Review",     icon: CheckCircle },
];

const DOC_TYPES = ["Passport", "National ID Card", "Driver's License"];

function UploadBtn({
  id, label, value, onChange, capture,
}: {
  id: string; label: string; value: File | null;
  onChange: (f: File | null) => void; capture?: "user" | "environment";
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-300 mb-2">{label} *</p>
      <div
        onClick={() => document.getElementById(id)?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
          value
            ? "border-[#0ecb81]/50 bg-[#0ecb81]/5"
            : "border-[#2a2a2a] hover:border-[#f0b90b]/40"
        }`}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#0ecb81] shrink-0" />
            <span className="text-sm font-semibold text-[#0ecb81] flex-1 text-left truncate">{value.name}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(null); }}
              className="w-6 h-6 rounded-full bg-[#1e1e1e] flex items-center justify-center"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-white font-semibold">Tap to {capture ? "take photo" : "upload"}</p>
            <p className="text-xs text-gray-500 mt-1">JPG or PNG</p>
          </>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          capture={capture}
          className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

export default function KycMobilePage() {
  const [token, setToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [expired, setExpired] = useState(false);
  const [userName, setUserName] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    fullName: "", dob: "", nationality: "", address: "",
    docType: "Passport",
    docFront: null as File | null,
    docBack:  null as File | null,
    selfie:   null as File | null,
    addressDoc: null as File | null,
  });

  const toastRef = useRef<string>("");
  const [toast, setToastMsg] = useState("");
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    if (!t) { setExpired(true); setValidating(false); return; }
    setToken(t);
    fetch(`/api/kyc/mobile-link?token=${encodeURIComponent(t)}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) {
          setUserName(d.userName ?? "");
        } else {
          setExpired(true);
        }
      })
      .catch(() => setExpired(true))
      .finally(() => setValidating(false));
  }, []);

  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("kycToken", token!);
    const r = await fetch("/api/kyc/mobile-upload", { method: "POST", body: fd });
    if (!r.ok) return null;
    const d = await r.json();
    return d.url ?? null;
  };

  const handleNext = async () => {
    setErr("");
    if (step === 1) {
      if (!form.fullName.trim())    { showToast("Full name required"); return; }
      if (!form.dob)                { showToast("Date of birth required"); return; }
      if (!form.nationality.trim()) { showToast("Nationality required"); return; }
      if (!form.address.trim())     { showToast("Home address required"); return; }
      const dob = new Date(form.dob);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (isNaN(dob.getTime()) || age < 18) { showToast("Must be at least 18 years old"); return; }
    }
    if (step === 2 && !form.docFront)  { showToast("Please upload front of your ID"); return; }
    if (step === 3 && !form.selfie)    { showToast("Please take a selfie"); return; }
    if (step === 4 && !form.addressDoc){ showToast("Please upload proof of address"); return; }

    if (step < 5) { setStep(s => s + 1); return; }

    if (!form.docFront || !form.selfie || !form.addressDoc) {
      setErr("Some required items are missing. Go back and complete all steps.");
      return;
    }

    setLoading(true);
    try {
      const [selfieUrl, docFrontUrl, docBackUrl, addressDocUrl] = await Promise.all([
        form.selfie    ? uploadFile(form.selfie,    "selfie")  : Promise.resolve(null),
        form.docFront  ? uploadFile(form.docFront,  "front")   : Promise.resolve(null),
        form.docBack   ? uploadFile(form.docBack,   "back")    : Promise.resolve(null),
        form.addressDoc? uploadFile(form.addressDoc,"address") : Promise.resolve(null),
      ]);

      const res = await fetch("/api/kyc/mobile-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kycToken: token,
          fullName: form.fullName, dob: form.dob,
          nationality: form.nationality, address: form.address,
          idType: form.docType,
          selfieUrl, docFrontUrl, docBackUrl, addressDocUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Submission failed. Please try again."); return; }
      setDone(true);
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Validating ───────────────────────────────────────────────────────────────
  if (validating) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#f0b90b] animate-spin" />
    </div>
  );

  // ── Expired / invalid ────────────────────────────────────────────────────────
  if (expired) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h1 className="text-xl font-black text-white mb-2">Link Expired</h1>
      <p className="text-sm text-gray-400 max-w-xs">
        This QR code has expired or is invalid. Ask the person on the PC to generate a new QR code.
      </p>
    </div>
  );

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-6 text-center space-y-5">
      <div className="w-20 h-20 rounded-full bg-[#0ecb81]/15 border-2 border-[#0ecb81]/30 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-[#0ecb81]" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-white mb-2">KYC Submitted!</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          Your documents are under review. You can close this tab and go back to your computer — the page there will update automatically.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-3 text-xs text-gray-500">
        <Monitor className="w-4 h-4 text-[#58a6ff] shrink-0" />
        Continue on your PC or laptop
      </div>
    </div>
  );

  // ── KYC Form ─────────────────────────────────────────────────────────────────
  const pct = Math.round(((step - 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#f6465d] text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg text-center">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur border-b border-[#1e1e1e] px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-[#f0b90b] flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-sm font-black">KYC Verification</span>
          {userName && <span className="ml-auto text-xs text-gray-500 truncate max-w-[120px]">{userName}</span>}
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#f0b90b] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 shrink-0">Step {step}/{STEPS.length}</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex px-4 pt-4 gap-1">
        {STEPS.map(s => (
          <div key={s.id} className={`flex-1 h-1 rounded-full transition-colors ${
            step > s.id ? "bg-[#0ecb81]" : step === s.id ? "bg-[#f0b90b]" : "bg-[#1e1e1e]"
          }`} />
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pb-28 pt-4 space-y-4">
        <div className="flex items-center gap-2">
          {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="w-5 h-5 text-[#f0b90b]" />; })()}
          <h2 className="text-lg font-black">{STEPS[step - 1].label}</h2>
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-3">
            {[
              { label: "Full Name",     key: "fullName",    type: "text", ph: "John Doe" },
              { label: "Date of Birth", key: "dob",         type: "date", ph: "" },
              { label: "Nationality",   key: "nationality", type: "text", ph: "American" },
              { label: "Home Address",  key: "address",     type: "text", ph: "123 Main St, New York" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-gray-300 block mb-1.5">{f.label} *</label>
                <input
                  type={f.type}
                  placeholder={f.ph}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(d => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1e1e1e] text-white placeholder-gray-600 text-sm outline-none focus:border-[#f0b90b]/50"
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 2: ID Document */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-1.5">Document Type *</label>
              <select
                value={form.docType}
                onChange={e => setForm(d => ({ ...d, docType: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#1e1e1e] text-white text-sm outline-none"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <UploadBtn id="m-docFront" label="Front Side"
              value={form.docFront} onChange={f => setForm(d => ({ ...d, docFront: f }))} />
            <UploadBtn id="m-docBack" label="Back Side (optional)"
              value={form.docBack} onChange={f => setForm(d => ({ ...d, docBack: f }))} />
          </div>
        )}

        {/* Step 3: Selfie */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 space-y-2">
              {[
                "Look straight at the camera",
                "Make sure your face is fully visible",
                "Good lighting — avoid dark backgrounds",
              ].map(t => (
                <div key={t} className="flex items-start gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] mt-1.5 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
            <UploadBtn
              id="m-selfie"
              label="Selfie Photo"
              value={form.selfie}
              onChange={f => setForm(d => ({ ...d, selfie: f }))}
              capture="user"
            />
            <div className="flex items-center gap-2 text-xs text-[#0ecb81]">
              <Lock className="w-3 h-3" />
              Processed securely — never shared with third parties
            </div>
          </div>
        )}

        {/* Step 4: Proof of Address */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-white uppercase tracking-wide mb-2">Accepted documents</p>
              {["Utility bill (electricity, water, gas)", "Bank statement", "Government letter", "Dated within last 3 months"].map(t => (
                <div key={t} className="flex items-start gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] mt-1.5 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
            <UploadBtn id="m-addressDoc" label="Proof of Address"
              value={form.addressDoc} onChange={f => setForm(d => ({ ...d, addressDoc: f }))} />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Full Name",     value: form.fullName    || "—", ok: !!form.fullName },
                { label: "Date of Birth", value: form.dob         || "—", ok: !!form.dob },
                { label: "Nationality",   value: form.nationality || "—", ok: !!form.nationality },
                { label: "ID Type",       value: form.docType,              ok: true },
                { label: "Front ID",      value: form.docFront  ? "✓ Ready" : "✗ Missing", ok: !!form.docFront },
                { label: "Selfie",        value: form.selfie    ? "✓ Ready" : "✗ Missing", ok: !!form.selfie },
                { label: "Proof of Addr", value: form.addressDoc? "✓ Ready" : "✗ Missing", ok: !!form.addressDoc },
                { label: "Home Address",  value: form.address   || "—", ok: !!form.address },
              ].map(r => (
                <div key={r.label} className={`bg-[#111] border rounded-xl p-3 ${r.ok ? "border-[#1e1e1e]" : "border-[#f6465d]/40 bg-[#f6465d]/5"}`}>
                  <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide mb-1">{r.label}</div>
                  <div className={`text-sm font-semibold truncate ${r.ok ? "text-white" : "text-[#f6465d]"}`}>{r.value}</div>
                </div>
              ))}
            </div>
            {(!form.docFront || !form.selfie || !form.addressDoc) && (
              <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 rounded-xl p-3 text-sm text-[#f6465d] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Some required items are missing. Go back and complete all steps.
              </div>
            )}
            {err && (
              <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 rounded-xl p-3 text-sm text-[#f6465d]">{err}</div>
            )}
          </div>
        )}
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080808]/95 backdrop-blur border-t border-[#1e1e1e] p-4 flex gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3.5 rounded-2xl bg-[#111] border border-[#1e1e1e] text-sm font-semibold text-gray-300"
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={loading || (step === 5 && (!form.docFront || !form.selfie || !form.addressDoc))}
          className="flex-1 py-3.5 rounded-2xl bg-[#f0b90b] text-black font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : step < 5
              ? <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
              : "Submit KYC →"
          }
        </button>
      </div>
    </div>
  );
}
