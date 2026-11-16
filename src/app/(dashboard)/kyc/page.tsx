"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, User, FileText, Camera, Home, CheckCircle,
  Upload, ArrowRight, AlertTriangle, Clock
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Personal Info",    icon: User,      title: "Personal Information" },
  { id: 2, label: "ID Document",      icon: FileText,  title: "Upload ID Document" },
  { id: 3, label: "Selfie / Liveness",icon: Camera,    title: "Selfie Verification" },
  { id: 4, label: "Proof of Address", icon: Home,      title: "Proof of Address" },
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
    fullName: demoUser.name || "", dob: "", nationality: demoUser.email ? "" : "",
    address: "",
    docType: "Passport", docFront: null as File | null, docBack: null as File | null,
    selfie: null as File | null, addressDoc: null as File | null,
  });

  const handleNext = async () => {
    if (step < 5) { setStep(s => s + 1); return; }
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

  const alreadyApproved = demoUser.kycStatus === "approved";

  if (alreadyApproved) return (
    <div className="p-6 max-w-2xl">
      <div className="bg-ex-green/10 border border-ex-green/30 rounded-2xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-ex-green mx-auto mb-4" />
        <h1 className="text-2xl font-black text-ex-green mb-2">KYC Verified ✅</h1>
        <p className="text-gray-400">Your identity has been fully verified. You qualify for the loan campaign.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          {[
            { label: "Full Name",    value: demoUser.name },
            { label: "Status",       value: "Approved ✓" },
            { label: "Verified On",  value: new Date().toLocaleDateString() },
            { label: "ID Type",      value: "Government ID" },
            { label: "Queue #",      value: `#${demoUser.queuePosition}` },
            { label: "Loan Status",  value: demoUser.loanStatus === "approved" ? "Approved — $50,000 USDT" : "Processing" },
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
        <p className="text-gray-400">Complete identity verification to qualify for the loan campaign</p>
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

        {step === 1 && (
          <div className="space-y-4">
            {[
              { label: "Full Name *",    key: "fullName",    type: "text",  ph: "John Doe" },
              { label: "Date of Birth *",key: "dob",         type: "date",  ph: "" },
              { label: "Nationality *",  key: "nationality", type: "text",  ph: "Pakistani" },
              { label: "Home Address *", key: "address",     type: "text",  ph: "123 Street, City, Country" },
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
              <div className="border-2 border-dashed border-ex-border rounded-xl p-8 text-center hover:border-ex-yellow/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("docFront")?.click()}>
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {formData.docFront ? formData.docFront.name : "Click to upload front side"}
                </p>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG, PDF up to 5MB</p>
                <input id="docFront" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => setFormData(d => ({ ...d, docFront: e.target.files?.[0] || null }))} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Back Side (if applicable)</label>
              <div className="border-2 border-dashed border-ex-border rounded-xl p-8 text-center hover:border-ex-yellow/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("docBack")?.click()}>
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {formData.docBack ? formData.docBack.name : "Click to upload back side"}
                </p>
                <input id="docBack" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => setFormData(d => ({ ...d, docBack: e.target.files?.[0] || null }))} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-ex-card2 border border-ex-border rounded-xl p-4 text-sm text-gray-400">
              <p className="mb-2 font-semibold text-white">Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Face the camera directly with good lighting</li>
                <li>Remove glasses if possible</li>
                <li>Ensure your face is fully visible</li>
                <li>No filters or virtual backgrounds</li>
              </ul>
            </div>
            <div className="border-2 border-dashed border-ex-border rounded-xl p-10 text-center hover:border-ex-yellow/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("selfie")?.click()}>
              <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-300">
                {formData.selfie ? formData.selfie.name : "Take Selfie / Upload Photo"}
              </p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB</p>
              <input id="selfie" type="file" className="hidden" accept=".jpg,.jpeg,.png"
                onChange={e => setFormData(d => ({ ...d, selfie: e.target.files?.[0] || null }))} />
            </div>
            <div className="text-center">
              <span className="text-xs text-ex-green bg-ex-green/10 px-3 py-1 rounded-full">
                🔒 Your photo is encrypted and never shared
              </span>
            </div>
          </div>
        )}

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
            <div className="border-2 border-dashed border-ex-border rounded-xl p-10 text-center hover:border-ex-yellow/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("addressDoc")?.click()}>
              <Home className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-300">
                {formData.addressDoc ? formData.addressDoc.name : "Upload Proof of Address"}
              </p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG, PDF up to 5MB</p>
              <input id="addressDoc" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                onChange={e => setFormData(d => ({ ...d, addressDoc: e.target.files?.[0] || null }))} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name",      value: formData.fullName },
                { label: "Date of Birth",  value: formData.dob },
                { label: "Nationality",    value: formData.nationality },
                { label: "ID Type",        value: formData.docType },
                { label: "Front ID",       value: formData.docFront ? "✅ Uploaded" : "❌ Missing" },
                { label: "Selfie",         value: formData.selfie   ? "✅ Uploaded" : "❌ Missing" },
                { label: "Proof of Address", value: formData.addressDoc ? "✅ Uploaded" : "❌ Missing" },
                { label: "Address",        value: formData.address },
              ].map(r => (
                <div key={r.label} className="bg-ex-card2 border border-ex-border rounded-xl p-3">
                  <div className="text-xs text-gray-500">{r.label}</div>
                  <div className="text-sm font-semibold mt-0.5 truncate">{r.value}</div>
                </div>
              ))}
            </div>
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
          <button onClick={handleNext} disabled={loading}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
            {loading ? "Submitting..." : step < 5 ? <>Next Step <ArrowRight className="w-4 h-4" /></> : "Submit KYC →"}
          </button>
        </div>
      </div>
    </div>
  );
}
