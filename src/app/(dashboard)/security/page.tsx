"use client";
import { useState, useEffect } from "react";
import { Shield, Smartphone, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";

export default function SecurityPage() {
  const t = useTranslations("security");

  const [totpEnabled, setTotpEnabled]   = useState(false);
  const [totpUri, setTotpUri]           = useState("");
  const [totpSecret, setTotpSecret]     = useState("");
  const [setupStep, setSetupStep]       = useState<"idle" | "scan">("idle");
  const [totpCode, setTotpCode]         = useState("");
  const [disableCode, setDisableCode]   = useState("");
  const [showDisable, setShowDisable]   = useState(false);

  const [currentPw, setCurrentPw]       = useState("");
  const [newPw, setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showCur, setShowCur]           = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [pwLoading, setPwLoading]       = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setTotpEnabled(d.user.totpEnabled ?? false); })
      .catch(() => {});
  }, []);

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security/totp/setup");
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setTotpSecret(data.secret);
      setTotpUri(data.uri);
      setSetupStep("scan");
    } catch {
      toast.error(t("setup_error"));
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async () => {
    if (totpCode.length !== 6) { toast.error(t("enable_error")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/security/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode, secret: totpSecret }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setTotpEnabled(true);
      setSetupStep("idle");
      setTotpCode("");
      toast.success(t("totp_enabled_toast"));
    } catch {
      toast.error(t("setup_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) { toast.error(t("enable_error")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/security/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setTotpEnabled(false);
      setShowDisable(false);
      setDisableCode("");
      toast.success(t("totp_disabled_toast"));
    } catch {
      toast.error(t("setup_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error(t("pw_mismatch")); return; }
    if (newPw.length < 8) { toast.error(t("pw_too_short")); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success(t("pw_success"));
    } catch {
      toast.error(t("setup_error"));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Shield className="w-8 h-8 text-ex-yellow" /> {t("title")}
        </h1>
        <p className="text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* ── Google Authenticator ─────────────────────────────────────────── */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ex-yellow/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-ex-yellow" />
            </div>
            <div>
              <div className="font-bold">{t("totp_title")}</div>
              <div className="text-xs text-gray-500">{t("totp_subtitle")}</div>
            </div>
          </div>
          {totpEnabled ? (
            <span className="flex items-center gap-1.5 text-ex-green text-xs font-bold bg-ex-green/10 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> {t("totp_enabled")}
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">{t("totp_disabled")}</span>
          )}
        </div>

        {!totpEnabled && setupStep === "idle" && (
          <div>
            <p className="text-sm text-gray-400 mb-4">{t("totp_desc")}</p>
            <button onClick={startSetup} disabled={loading}
              className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              {t("totp_setup_btn")}
            </button>
          </div>
        )}

        {setupStep === "scan" && (
          <div className="space-y-5">
            <p className="text-sm text-gray-400">
              <strong className="text-white">Step 1</strong> — {t("totp_step1")}
            </p>
            <div className="flex justify-center">
              {totpUri && (
                <div className="p-4 bg-white rounded-2xl inline-block">
                  <QRCodeSVG value={totpUri} size={180} />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t("totp_cant_scan")}</p>
              <div className="flex items-center gap-2 bg-ex-card2 border border-ex-border rounded-xl px-4 py-2">
                <code className="font-mono text-sm text-ex-yellow flex-1 break-all">{totpSecret}</code>
                <button onClick={() => { navigator.clipboard.writeText(totpSecret).catch(() => {}); toast.success("Copied!"); }}
                  className="text-gray-400 hover:text-white transition-colors shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              <strong className="text-white">Step 2</strong> — {t("totp_step2")}
            </p>
            <div className="flex gap-2">
              <input
                className="ex-input text-center text-xl font-num tracking-[0.3em] font-bold flex-1"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
              <button onClick={confirmEnable} disabled={loading || totpCode.length !== 6}
                className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap disabled:opacity-50">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("totp_verify_btn")}
              </button>
            </div>
            <button onClick={() => setSetupStep("idle")}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t("totp_cancel")}
            </button>
          </div>
        )}

        {totpEnabled && !showDisable && (
          <div className="mt-2">
            <p className="text-sm text-gray-400 mb-4">{t("totp_active_desc")}</p>
            <button onClick={() => setShowDisable(true)}
              className="text-xs text-ex-red hover:underline">
              {t("totp_disable_link")}
            </button>
          </div>
        )}

        {totpEnabled && showDisable && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-ex-red bg-ex-red/10 border border-ex-red/20 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t("totp_disable_warning")}
            </div>
            <div className="flex gap-2">
              <input
                className="ex-input text-center text-xl font-num tracking-[0.3em] font-bold flex-1"
                type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
              <button onClick={handleDisable} disabled={loading || disableCode.length !== 6}
                className="px-5 py-2.5 text-sm font-bold rounded-xl bg-ex-red text-white whitespace-nowrap disabled:opacity-50">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("totp_disable_btn")}
              </button>
            </div>
            <button onClick={() => { setShowDisable(false); setDisableCode(""); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {t("cancel")}
            </button>
          </div>
        )}
      </div>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <div className="bg-ex-card border border-ex-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="font-bold">{t("pw_title")}</div>
            <div className="text-xs text-gray-500">{t("pw_subtitle")}</div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t("pw_current_label")}</label>
            <div className="relative">
              <input className="ex-input pr-10" type={showCur ? "text" : "password"}
                value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder={t("pw_current_placeholder")} />
              <button type="button" onClick={() => setShowCur(!showCur)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t("pw_new_label")}</label>
            <div className="relative">
              <input className="ex-input pr-10" type={showNew ? "text" : "password"}
                value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder={t("pw_new_placeholder")} minLength={8} />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t("pw_confirm_label")}</label>
            <input className="ex-input" type="password"
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder={t("pw_confirm_placeholder")} />
          </div>
          <button type="submit" className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2" disabled={pwLoading}>
            {pwLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t("pw_btn_loading")}</> : t("pw_btn")}
          </button>
        </form>
      </div>
    </div>
  );
}
