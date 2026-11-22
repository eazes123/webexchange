"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, User, FileText, Camera, Home, CheckCircle,
  Upload, ArrowRight, Clock, RefreshCw, X, BadgeCheck,
  AlertCircle, Lock, Sparkles, Info, Loader2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const LivenessCheck = dynamic(() => import("@/components/kyc/LivenessCheck"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading liveness check…</span>
    </div>
  ),
});

const STEPS = [
  { id: 1, label: "Personal Info",    icon: User,        title: "Personal Information" },
  { id: 2, label: "ID Document",      icon: FileText,    title: "Upload ID Document" },
  { id: 3, label: "Liveness Check",   icon: Camera,      title: "Liveness Check" },
  { id: 4, label: "Proof of Address", icon: Home,        title: "Proof of Address" },
  { id: 5, label: "Review",           icon: CheckCircle, title: "Review & Submit" },
];

const DOC_TYPES = ["Passport", "National ID Card", "Driver's License"];

function UploadZone({
  id, label, required = true, accepted = ".jpg,.jpeg,.png,.pdf",
  value, onChange, hint,
}: {
  id: string; label: string; required?: boolean; accepted?: string;
  value: File | null; onChange: (f: File | null) => void; hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-300 block mb-2">{label}{required ? " *" : ""}</label>
      <div
        onClick={() => document.getElementById(id)?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          value
            ? "border-[#0ecb81]/50 bg-[#0ecb81]/5"
            : "border-[#1e1e1e] hover:border-[#f0b90b]/40 hover:bg-[#f0b90b]/3"
        }`}
      >
        {value ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0ecb81]/15 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#0ecb81]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#0ecb81]">Uploaded</p>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">{value.name}</p>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(null); }}
              className="ml-auto w-7 h-7 rounded-full bg-[#1e1e1e] flex items-center justify-center hover:bg-[#f6465d]/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#131313] border border-[#1e1e1e] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Click to upload</p>
            <p className="text-xs text-gray-500">{hint ?? "JPG, PNG, PDF up to 5MB"}</p>
          </>
        )}
        <input id={id} type="file" className="hidden" accept={accepted}
          onChange={e => onChange(e.target.files?.[0] || null)} />
      </div>
    </div>
  );
}

export default function KycPage() {
  const router = useRouter();
  const { demoUser, setKycStatus } = useStore();
  const [step, setStep] = useState(demoUser.kycStatus === "approved" ? 5 : 1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(demoUser.kycStatus !== "none");

  const [formData, setFormData] = useState({
    fullName: demoUser.name || "", dob: "", nationality: "",
    address: "",
    docType: "Passport", docFront: null as File | null, docBack: null as File | null,
    selfie: null as File | null, addressDoc: null as File | null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<"idle" | "active" | "captured">("idle");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [livenessMode, setLivenessMode] = useState<"idle" | "active" | "done">("idle");

  useEffect(() => {
    if (step !== 3) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (cameraMode === "active") setCameraMode("idle");
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraMode("active");
    } catch {
      toast.error("Camera access denied. Please allow camera or upload a photo instead.");
    }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };

  const capturePhoto = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setFormData(d => ({ ...d, selfie: file }));
      setSelfiePreview(url); stopCamera(); setCameraMode("captured");
    }, "image/jpeg", 0.9);
  };

  const retakePhoto = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null); setFormData(d => ({ ...d, selfie: null })); setCameraMode("idle");
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName.trim())    { toast.error("Full name is required");      return; }
      if (!formData.dob)                { toast.error("Date of birth is required");   return; }
      if (!formData.nationality.trim()) { toast.error("Nationality is required");     return; }
      if (!formData.address.trim())     { toast.error("Home address is required");    return; }
      const dob = new Date(formData.dob);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (isNaN(dob.getTime()) || age < 18) { toast.error("You must be at least 18 years old"); return; }
    }
    if (step === 2 && !formData.docFront)  { toast.error("Please upload the front of your ID document"); return; }
    if (step === 3 && !formData.selfie)    { toast.error("Please take a selfie or upload a photo");     return; }
    if (step === 4 && !formData.addressDoc){ toast.error("Please upload a proof of address document");   return; }

    if (step < 5) { setStep(s => s + 1); return; }

    if (!formData.fullName.trim() || !formData.dob || !formData.nationality.trim() || !formData.address.trim()) {
      toast.error("Personal information is incomplete. Go back to Step 1."); return;
    }
    if (!formData.docFront)  { toast.error("ID document is missing. Go back to Step 2."); return; }
    if (!formData.selfie)    { toast.error("Selfie is missing. Go back to Step 3."); return; }
    if (!formData.addressDoc){ toast.error("Proof of address is missing. Go back to Step 4."); return; }

    setLoading(true);
    try {
      // Helper to upload a file to /api/kyc/upload
      const uploadDoc = async (file: File, type: string): Promise<string | null> => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("type", type);
          const r = await fetch("/api/kyc/upload", { method: "POST", body: fd });
          if (r.ok) { const d = await r.json(); return d.url ?? null; }
        } catch {}
        return null;
      };

      // Upload selfie
      let selfieUrl: string | null = null;
      if (formData.selfie) {
        try {
          const fd = new FormData();
          fd.append("file", formData.selfie);
          const r = await fetch("/api/kyc/selfie", { method: "POST", body: fd });
          if (r.ok) { const d = await r.json(); selfieUrl = d.url ?? null; }
        } catch {}
      }

      // Upload ID docs and address proof in parallel
      const [docFrontUrl, docBackUrl, addressDocUrl] = await Promise.all([
        formData.docFront   ? uploadDoc(formData.docFront,   "front")   : Promise.resolve(null),
        formData.docBack    ? uploadDoc(formData.docBack,    "back")    : Promise.resolve(null),
        formData.addressDoc ? uploadDoc(formData.addressDoc, "address") : Promise.resolve(null),
      ]);

      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 5, fullName: formData.fullName, dob: formData.dob,
          address: formData.address, idType: formData.docType,
          nationality: formData.nationality,
          selfieUrl, docFrontUrl, docBackUrl, addressDocUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setKycStatus("under_review"); setSubmitted(true);
      toast.success("KYC submitted! Under review. Usually 24-48 hours.");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to submit KYC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Approved state ──────────────────────────────────────────────────────────
  if (demoUser.kycStatus === "approved") return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#080808] via-[#0d0d0d] to-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_#0ecb8122_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-full px-4 py-1.5 text-xs font-bold text-[#0ecb81] mb-5">
            <Sparkles className="w-3 h-3" /> Identity Verified
          </div>
          <div className="w-20 h-20 rounded-full bg-[#0ecb81]/15 border-2 border-[#0ecb81]/30 flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="w-10 h-10 text-[#0ecb81]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">KYC Approved</h1>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">Your identity has been fully verified. You are eligible for the $50,000 USDT interest-free loan campaign.</p>
        </div>
      </div>

      {/* Detail tiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Full Name",   value: demoUser.name,                        icon: User },
          { label: "Status",      value: "Verified ✓",                         icon: BadgeCheck },
          { label: "Verified On", value: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), icon: Clock },
          { label: "ID Type",     value: "Government ID",                       icon: FileText },
        ].map(r => (
          <div key={r.label} className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
              <r.icon className="w-3.5 h-3.5" /> {r.label}
            </div>
            <div className="font-bold text-white">{r.value}</div>
          </div>
        ))}
      </div>

      {/* Campaign eligibility */}
      <div className="bg-[#f0b90b]/8 border border-[#f0b90b]/25 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#f0b90b]/15 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-[#f0b90b]" />
        </div>
        <div>
          <div className="font-bold text-[#f0b90b] text-sm">Campaign Eligible</div>
          <div className="text-xs text-gray-400 mt-0.5">New Year 2026 · $50,000 USDT Interest-Free Loan</div>
        </div>
      </div>
    </div>
  );

  // ── Under review / pending state ────────────────────────────────────────────
  if (demoUser.kycStatus === "under_review" || demoUser.kycStatus === "pending") return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#080808] via-[#0d0d0d] to-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,_#f0b90b15_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded-full px-4 py-1.5 text-xs font-bold text-[#f0b90b] mb-5">
            <Clock className="w-3 h-3" /> Under Review
          </div>
          <div className="w-20 h-20 rounded-full bg-[#f0b90b]/10 border-2 border-[#f0b90b]/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-[#f0b90b]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">KYC Under Review</h1>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">Your documents have been submitted and are being reviewed by our team. This usually takes 24–48 hours.</p>
        </div>
      </div>
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
        <Info className="w-5 h-5 text-gray-500 shrink-0" />
        <p className="text-sm text-gray-400">You will be notified by email once your KYC is approved. No further action is needed.</p>
      </div>
    </div>
  );

  // ── KYC Form ────────────────────────────────────────────────────────────────
  const completedCount = step - 1;
  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#080808] via-[#0d0d0d] to-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_#f0b90b18_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded-full px-3 py-1 text-xs font-bold text-[#f0b90b] mb-4">
            <Shield className="w-3 h-3" /> Identity Verification Required
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1.5">KYC Verification</h1>
          <p className="text-gray-400 text-sm">Complete 5 steps to unlock your $50,000 USDT interest-free loan</p>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Step {step} of {STEPS.length}</span>
              <span>{pct}% complete</span>
            </div>
            <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f0b90b] to-[#f0b90b]/70 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done   = step > s.id || submitted;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  done   ? "bg-[#0ecb81] text-black"
                  : active ? "bg-[#f0b90b] text-black ring-4 ring-[#f0b90b]/20"
                  : "bg-[#111] border border-[#1e1e1e] text-gray-500"
                }`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[9px] font-semibold text-center leading-tight hidden sm:block ${
                  active ? "text-[#f0b90b]" : done ? "text-[#0ecb81]" : "text-gray-600"
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 transition-colors ${step > s.id + 1 || (step > s.id) ? "bg-[#0ecb81]/40" : "bg-[#1e1e1e]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-xs text-gray-500">
        <Lock className="w-3.5 h-3.5 text-[#0ecb81] shrink-0" />
        Documents are end-to-end encrypted. We never share your personal data with third parties.
      </div>

      {/* Step content card */}
      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-3xl p-5 sm:p-6">
        {/* Card header */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#1e1e1e]">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            step === 5 ? "bg-[#f0b90b]/15" : "bg-[#131313] border border-[#1e1e1e]"
          }`}>
            {(() => { const Icon = STEPS[step - 1].icon; return <Icon className={`w-5 h-5 ${step === 5 ? "text-[#f0b90b]" : "text-gray-400"}`} />; })()}
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Step {step}</div>
            <h2 className="text-lg font-black">{STEPS[step - 1].title}</h2>
          </div>
        </div>

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <div className="space-y-4">
            {[
              { label: "Full Name",     key: "fullName",    type: "text", ph: "John Doe" },
              { label: "Date of Birth", key: "dob",         type: "date", ph: "" },
              { label: "Nationality",   key: "nationality", type: "text", ph: "American" },
              { label: "Home Address",  key: "address",     type: "text", ph: "123 Main St, New York, NY 10001" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-gray-300 block mb-2">{f.label} *</label>
                <input
                  className="ex-input"
                  type={f.type}
                  placeholder={f.ph}
                  value={(formData as any)[f.key]}
                  onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Step 2: ID Document ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">Document Type *</label>
              <select className="ex-input" value={formData.docType}
                onChange={e => setFormData(d => ({ ...d, docType: e.target.value }))}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <UploadZone id="docFront" label="Front Side" value={formData.docFront}
              onChange={f => setFormData(d => ({ ...d, docFront: f }))} hint="JPG, PNG, PDF up to 5MB" />
            <UploadZone id="docBack" label="Back Side" required={false} value={formData.docBack}
              onChange={f => setFormData(d => ({ ...d, docBack: f }))} hint="Optional for Passport · JPG, PNG, PDF" />
          </div>
        )}

        {/* ── Step 3: Selfie + Liveness ── */}
        {step === 3 && (
          <div className="space-y-4">

            {/* Liveness check active */}
            {livenessMode === "active" && (
              <LivenessCheck
                onComplete={blob => {
                  const url = URL.createObjectURL(blob);
                  const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
                  setFormData(d => ({ ...d, selfie: file }));
                  setSelfiePreview(url);
                  setLivenessMode("done");
                  toast.success("Liveness check passed! Selfie captured.");
                }}
                onCancel={() => setLivenessMode("idle")}
              />
            )}

            {/* Idle / done states */}
            {livenessMode !== "active" && (
              <>
                {/* Captured preview */}
                {livenessMode === "done" && selfiePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#0ecb81]/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selfiePreview} alt="Selfie" className="w-full max-h-60 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#0ecb81] text-black text-xs font-bold px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Liveness Verified
                    </div>
                  </div>
                )}

                {/* Liveness launch card */}
                {livenessMode === "idle" && (
                  <div className="bg-[#131313] border border-[#1e1e1e] rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f0b90b]/10 border border-[#f0b90b]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-5 h-5 text-[#f0b90b]" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">AI Liveness Check</p>
                        <p className="text-xs text-gray-500 mt-0.5">Follow 3 on-screen instructions to verify you&apos;re a real person</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        { icon: "←→", label: "Head movements" },
                        { icon: "👁",  label: "Blink detection" },
                        { icon: "📸",  label: "Auto selfie" },
                      ].map(f => (
                        <div key={f.label} className="bg-[#0d0d0d] rounded-xl p-2.5 text-center border border-[#222]">
                          <div className="text-lg mb-1">{f.icon}</div>
                          <div className="text-[10px] text-gray-500 leading-tight">{f.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setLivenessMode("active")}
                    className="w-full border-2 border-[#f0b90b]/40 rounded-2xl p-5 text-center hover:bg-[#f0b90b]/5 hover:border-[#f0b90b]/60 transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f0b90b]/10 flex items-center justify-center mx-auto mb-2.5">
                      <Camera className="w-6 h-6 text-[#f0b90b]" />
                    </div>
                    <p className="font-bold text-white text-sm">
                      {livenessMode === "done" ? "Redo Liveness Check" : "Start Liveness Check"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {livenessMode === "done"
                        ? "Retake if you want a better photo"
                        : "Recommended — AI-verified, most secure"}
                    </p>
                  </button>

                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-[#0ecb81]">
                  <Lock className="w-3 h-3" />
                  All biometric data is processed locally — never uploaded to any server
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 4: Proof of Address ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-[#131313] border border-[#1e1e1e] rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-white uppercase tracking-wide mb-2">Accepted Documents</p>
              {["Utility bill (electricity, water, gas)", "Bank statement", "Government letter", "Must be dated within the last 3 months"].map(t => (
                <div key={t} className="flex items-start gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] mt-1.5 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
            <UploadZone id="addressDoc" label="Proof of Address Document" value={formData.addressDoc}
              onChange={f => setFormData(d => ({ ...d, addressDoc: f }))} hint="JPG, PNG, PDF up to 5MB" />
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name",        value: formData.fullName    || "-", ok: !!formData.fullName },
                { label: "Date of Birth",    value: formData.dob         || "-", ok: !!formData.dob },
                { label: "Nationality",      value: formData.nationality || "-", ok: !!formData.nationality },
                { label: "ID Type",          value: formData.docType,              ok: true },
                { label: "Front ID",         value: formData.docFront    ? "✓ Uploaded" : "✗ Missing", ok: !!formData.docFront },
                { label: "Selfie",           value: formData.selfie      ? "✓ Uploaded" : "✗ Missing", ok: !!formData.selfie },
                { label: "Proof of Address", value: formData.addressDoc  ? "✓ Uploaded" : "✗ Missing", ok: !!formData.addressDoc },
                { label: "Home Address",     value: formData.address     || "-", ok: !!formData.address },
              ].map(r => (
                <div key={r.label} className={`bg-[#131313] border rounded-xl p-3 ${r.ok ? "border-[#1e1e1e]" : "border-[#f6465d]/40 bg-[#f6465d]/5"}`}>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">{r.label}</div>
                  <div className={`text-sm font-semibold truncate ${r.ok ? "text-white" : "text-[#f6465d]"}`}>{r.value}</div>
                </div>
              ))}
            </div>

            {(!formData.docFront || !formData.selfie || !formData.addressDoc) && (
              <div className="bg-[#f6465d]/10 border border-[#f6465d]/30 rounded-xl p-3 text-sm text-[#f6465d] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Some required items are missing. Go back and complete all steps.
              </div>
            )}
            <div className="bg-[#f0b90b]/8 border border-[#f0b90b]/25 rounded-xl p-3 text-xs text-[#f0b90b] flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              KYC review takes 24–48 hours. You&apos;ll be notified by email once complete.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-2xl bg-[#131313] border border-[#1e1e1e] text-sm font-semibold text-gray-300 hover:bg-[#1a1a1a] transition-colors">
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading || (step === 5 && (!formData.docFront || !formData.selfie || !formData.addressDoc))}
            className="flex-1 py-3 rounded-2xl bg-[#f0b90b] text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-[#f0b90b]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? "Submitting…" : step < 5
              ? <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
              : "Submit KYC →"}
          </button>
        </div>
      </div>
    </div>
  );
}
