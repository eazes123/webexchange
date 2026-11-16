"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, User, FileText, Camera, Home, CheckCircle,
  Upload, ArrowRight, Clock, RefreshCw, X
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Personal Info",    icon: User,       title: "Personal Information" },
  { id: 2, label: "ID Document",      icon: FileText,   title: "Upload ID Document" },
  { id: 3, label: "Selfie / Liveness",icon: Camera,     title: "Selfie Verification" },
  { id: 4, label: "Proof of Address", icon: Home,       title: "Proof of Address" },
  { id: 5, label: "Review",           icon: CheckCircle,title: "Review & Submit" },
];

const DOC_TYPES = ["Passport", "National ID Card", "Driver's License"];

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

  // Camera state for selfie step
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<"idle" | "active" | "captured">("idle");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Stop camera when leaving step 3
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraMode("active");
    } catch {
      toast.error("Camera access denied — please allow camera or upload a photo instead.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setFormData(d => ({ ...d, selfie: file }));
      setSelfiePreview(url);
      stopCamera();
      setCameraMode("captured");
    }, "image/jpeg", 0.9);
  };

  const retakePhoto = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview(null);
    setFormData(d => ({ ...d, selfie: null }));
    setCameraMode("idle");
  };

  const handleNext = async () => {
    // Per-step validation
    if (step === 1) {
      if (!formData.fullName.trim())   { toast.error("Full name is required");       return; }
      if (!formData.dob)               { toast.error("Date of birth is required");    return; }
      if (!formData.nationality.trim()){ toast.error("Nationality is required");      return; }
      if (!formData.address.trim())    { toast.error("Home address is required");     return; }
      const dob = new Date(formData.dob);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (isNaN(dob.getTime()) || age < 18) { toast.error("You must be at least 18 years old"); return; }
    }
    if (step === 2) {
      if (!formData.docFront) { toast.error("Please upload the front of your ID document"); return; }
    }
    if (step === 3) {
      if (!formData.selfie) { toast.error("Please take a selfie or upload a photo"); return; }
    }
    if (step === 4) {
      if (!formData.addressDoc) { toast.error("Please upload a proof of address document"); return; }
    }

    if (step < 5) { setStep(s => s + 1); return; }

    // Final guard before submit
    if (!formData.fullName.trim() || !formData.dob || !formData.nationality.trim() || !formData.address.trim()) {
      toast.error("Personal information is incomplete — please go back to Step 1"); return;
    }
    if (!formData.docFront) { toast.error("ID document is missing — please go back to Step 2"); return; }
    if (!formData.selfie)   { toast.error("Selfie is missing — please go back to Step 3"); return; }
    if (!formData.addressDoc){ toast.error("Proof of address is missing — please go back to Step 4"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 5,
          fullName: formData.fullName,
          dob: formData.dob,
          address: formData.address,
          idType: formData.docType,
          nationality: formData.nationality,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setKycStatus("under_review");
      setSubmitted(true);
      toast.success("KYC submitted! Under review — usually 24-48 hours.");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to submit KYC — please try again");
    } finally {
      setLoading(false);
    }
  };

  if (demoUser.kycStatus === "approved") return (
    <div className="p-6 max-w-2xl">
      <div className="bg-ex-green/10 border border-ex-green/30 rounded-2xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-ex-green mx-auto mb-4" />
        <h1 className="text-2xl font-black text-ex-green mb-2">KYC Verified ✅</h1>
        <p className="text-gray-400">Your identity has been fully verified. You qualify for the staking campaign.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          {[
            { label: "Full Name",   value: demoUser.name },
            { label: "Status",      value: "Approved ✓" },
            { label: "Verified On", value: new Date().toLocaleDateString() },
            { label: "ID Type",     value: "Government ID" },
            { label: "Queue #",     value: `#${demoUser.queuePosition}` },
            { label: "Campaign",    value: "New Year Staking — Active" },
          ].map(r => (
            <div key={r.label} className="bg-ex-card border border-ex-border rounded-xl p-3">
              <div className="text-xs text-gray-500">{r.label}</div>
              <div className="font-semibold mt-0.5">{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">KYC Verification</h1>
        <p className="text-gray-400">Complete identity verification to qualify for the staking campaign</p>
      </div>

      {/* Security notice */}
      <div className="bg-ex-card2 border border-ex-border rounded-xl p-3 mb-6 flex gap-2 text-sm text-gray-400">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-ex-green" />
        <span>Your documents are encrypted and stored securely. We never share your personal data with third parties.</span>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              step === s.id
                ? "step-active"
                : step > s.id || submitted
                  ? "step-done"
                  : "step-pending"
            }`}>
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-0.5 bg-ex-border shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">{STEPS[step - 1].title}</h2>

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            {[
              { label: "Full Name *",    key: "fullName",    type: "text", ph: "John Doe" },
              { label: "Date of Birth *",key: "dob",         type: "date", ph: "" },
              { label: "Nationality *",  key: "nationality", type: "text", ph: "Pakistani" },
              { label: "Home Address *", key: "address",     type: "text", ph: "123 Street, City, Country" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm text-gray-400 block mb-1.5">{f.label}</label>
                <input className="ex-input" type={f.type} placeholder={f.ph}
                  value={(formData as any)[f.key]}
                  onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — ID Document */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Document Type *</label>
              <select className="ex-input" value={formData.docType}
                onChange={e => setFormData(d => ({ ...d, docType: e.target.value }))}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Front Side *</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                formData.docFront ? "border-ex-green/50 bg-ex-green/5" : "border-ex-border hover:border-ex-yellow/50"
              }`} onClick={() => document.getElementById("docFront")?.click()}>
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {formData.docFront ? `✅ ${formData.docFront.name}` : "Click to upload front side"}
                </p>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG, PDF up to 5MB</p>
                <input id="docFront" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => setFormData(d => ({ ...d, docFront: e.target.files?.[0] || null }))} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Back Side (optional for Passport)</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                formData.docBack ? "border-ex-green/50 bg-ex-green/5" : "border-ex-border hover:border-ex-yellow/50"
              }`} onClick={() => document.getElementById("docBack")?.click()}>
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {formData.docBack ? `✅ ${formData.docBack.name}` : "Click to upload back side"}
                </p>
                <input id="docBack" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => setFormData(d => ({ ...d, docBack: e.target.files?.[0] || null }))} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Selfie / Camera */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 text-sm text-gray-400">
              <p className="mb-2 font-semibold text-white">Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Face the camera directly with good lighting</li>
                <li>Remove glasses if possible</li>
                <li>Ensure your whole face is clearly visible</li>
                <li>No filters or virtual backgrounds</li>
              </ul>
            </div>

            {/* Camera preview */}
            {cameraMode === "active" && (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted
                  className="w-full max-h-72 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-4 border-dashed border-ex-yellow/40 rounded-xl pointer-events-none" />
                <div className="flex gap-3 p-3 justify-center">
                  <button onClick={capturePhoto}
                    className="bg-ex-yellow text-black font-bold px-6 py-2.5 rounded-xl flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                  <button onClick={() => { stopCamera(); setCameraMode("idle"); }}
                    className="btn-outline px-4 py-2.5 flex items-center gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Captured preview */}
            {cameraMode === "captured" && selfiePreview && (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <img src={selfiePreview} alt="Selfie" className="w-full max-h-72 object-cover" />
                <div className="absolute top-2 right-2 bg-ex-green text-black text-xs font-bold px-3 py-1 rounded-full">
                  ✓ Captured
                </div>
              </div>
            )}

            {/* Upload / camera buttons */}
            {cameraMode !== "active" && (
              <div className="space-y-3">
                {cameraMode === "idle" && (
                  <>
                    <button onClick={startCamera}
                      className="w-full border-2 border-ex-yellow/50 rounded-xl p-6 text-center hover:bg-ex-yellow/5 transition-colors">
                      <Camera className="w-10 h-10 text-ex-yellow mx-auto mb-2" />
                      <p className="font-semibold text-white">Open Camera (Recommended)</p>
                      <p className="text-xs text-gray-500 mt-1">Take a live selfie using your webcam</p>
                    </button>
                    <div className="text-center text-xs text-gray-500">— or —</div>
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      formData.selfie ? "border-ex-green/50 bg-ex-green/5" : "border-ex-border hover:border-ex-yellow/50"
                    }`} onClick={() => document.getElementById("selfie")?.click()}>
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        {formData.selfie && cameraMode !== "captured"
                          ? `✅ ${formData.selfie.name}`
                          : "Upload a photo from your device"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB</p>
                      <input id="selfie" type="file" className="hidden" accept=".jpg,.jpeg,.png"
                        onChange={e => {
                          const f = e.target.files?.[0] || null;
                          setFormData(d => ({ ...d, selfie: f }));
                          if (f) setCameraMode("idle");
                        }} />
                    </div>
                  </>
                )}

                {cameraMode === "captured" && (
                  <button onClick={retakePhoto}
                    className="w-full btn-outline py-2.5 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retake Photo
                  </button>
                )}
              </div>
            )}

            <div className="text-center">
              <span className="text-xs text-ex-green bg-ex-green/10 px-3 py-1 rounded-full">
                🔒 Your photo is encrypted and never shared
              </span>
            </div>
          </div>
        )}

        {/* Step 4 — Proof of Address */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 text-sm text-gray-400">
              <p className="mb-2 font-semibold text-white">Accepted Documents:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Utility bill (electricity, water, gas)</li>
                <li>Bank statement</li>
                <li>Government letter</li>
                <li>Must be dated within 3 months</li>
              </ul>
            </div>
            <div className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              formData.addressDoc ? "border-ex-green/50 bg-ex-green/5" : "border-ex-border hover:border-ex-yellow/50"
            }`} onClick={() => document.getElementById("addressDoc")?.click()}>
              <Home className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-300">
                {formData.addressDoc ? `✅ ${formData.addressDoc.name}` : "Upload Proof of Address *"}
              </p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG, PDF up to 5MB</p>
              <input id="addressDoc" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => setFormData(d => ({ ...d, addressDoc: e.target.files?.[0] || null }))} />
            </div>
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name",        value: formData.fullName    || "—", ok: !!formData.fullName },
                { label: "Date of Birth",    value: formData.dob         || "—", ok: !!formData.dob },
                { label: "Nationality",      value: formData.nationality || "—", ok: !!formData.nationality },
                { label: "ID Type",          value: formData.docType,              ok: true },
                { label: "Front ID",         value: formData.docFront    ? "✅ Uploaded" : "❌ Missing", ok: !!formData.docFront },
                { label: "Selfie",           value: formData.selfie      ? "✅ Uploaded" : "❌ Missing", ok: !!formData.selfie },
                { label: "Proof of Address", value: formData.addressDoc  ? "✅ Uploaded" : "❌ Missing", ok: !!formData.addressDoc },
                { label: "Home Address",     value: formData.address     || "—", ok: !!formData.address },
              ].map(r => (
                <div key={r.label} className={`bg-ex-card2 border rounded-xl p-3 ${r.ok ? "border-ex-border" : "border-ex-red/40"}`}>
                  <div className="text-xs text-gray-500">{r.label}</div>
                  <div className="text-sm font-semibold mt-0.5 truncate">{r.value}</div>
                </div>
              ))}
            </div>
            {(!formData.docFront || !formData.selfie || !formData.addressDoc) && (
              <div className="bg-ex-red/10 border border-ex-red/30 rounded-xl p-3 text-sm text-ex-red flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                Some required items are missing — go back and complete all steps before submitting.
              </div>
            )}
            <div className="bg-ex-yellow/10 border border-ex-yellow/30 rounded-xl p-3 text-xs text-ex-yellow flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              KYC review takes 24-48 hours. You&apos;ll be notified by email once complete.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="btn-outline flex-1 py-2.5">
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading || (step === 5 && (!formData.docFront || !formData.selfie || !formData.addressDoc))}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Submitting..." : step < 5 ? <>Next Step <ArrowRight className="w-4 h-4" /></> : "Submit KYC →"}
          </button>
        </div>
      </div>
    </div>
  );
}
