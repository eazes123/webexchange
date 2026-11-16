"use client";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="demo-banner sticky top-0 z-50 bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 justify-center text-sm font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          ⚠️ DEMO PROJECT — Class Assignment Only. NOT a real exchange. Do NOT send real money or complete real KYC.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
