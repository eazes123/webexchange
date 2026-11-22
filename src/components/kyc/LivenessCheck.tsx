"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Camera, Eye, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  CheckCircle, AlertCircle, Loader2, Shield,
} from "lucide-react";

type Challenge = "LOOK_LEFT" | "LOOK_RIGHT" | "LOOK_UP" | "LOOK_DOWN" | "BLINK";
type Phase = "loading" | "positioning" | "challenge" | "capturing" | "done" | "error";

const CHALLENGE_INFO: Record<Challenge, { label: string; instruction: string }> = {
  LOOK_LEFT:  { label: "Look Left",  instruction: "Slowly turn your head to the LEFT"  },
  LOOK_RIGHT: { label: "Look Right", instruction: "Slowly turn your head to the RIGHT" },
  LOOK_UP:    { label: "Look Up",    instruction: "Slowly tilt your head UP"           },
  LOOK_DOWN:  { label: "Look Down",  instruction: "Slowly tilt your head DOWN"         },
  BLINK:      { label: "Blink",      instruction: "Slowly blink your eyes twice"       },
};

function pickChallenges(): Challenge[] {
  const pool: Challenge[] = ["LOOK_LEFT", "LOOK_RIGHT", "LOOK_UP", "LOOK_DOWN"];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // 2 random movement + BLINK (anti-spoof)
  return [...pool.slice(0, 2), "BLINK"];
}

function dist2D(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function eyeAspectRatio(pts: { x: number; y: number }[]) {
  if (pts.length < 6) return 1;
  return (dist2D(pts[1], pts[5]) + dist2D(pts[2], pts[4])) / (2 * dist2D(pts[0], pts[3]));
}

function getHeadPose(pts: { x: number; y: number }[]) {
  if (pts.length < 68) return { yaw: 0, pitch: 0.5 };
  const faceW  = pts[16].x - pts[0].x;
  const faceCX = (pts[0].x + pts[16].x) / 2;
  const yaw    = faceW > 0 ? (pts[30].x - faceCX) / (faceW / 2) : 0;
  const eyeY   = (pts[36].y + pts[39].y + pts[42].y + pts[45].y) / 4;
  const faceH  = pts[8].y - eyeY;
  const pitch  = faceH > 0 ? (pts[30].y - eyeY) / faceH : 0.5;
  return { yaw, pitch };
}

function ChallengeIcon({ ch, size = 5 }: { ch: Challenge; size?: number }) {
  const cls = `w-${size} h-${size} text-[#f0b90b]`;
  if (ch === "LOOK_LEFT")  return <ArrowLeft  className={cls} />;
  if (ch === "LOOK_RIGHT") return <ArrowRight className={cls} />;
  if (ch === "LOOK_UP")    return <ArrowUp    className={cls} />;
  if (ch === "LOOK_DOWN")  return <ArrowDown  className={cls} />;
  return <Eye className={cls} />;
}

interface Props {
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export default function LivenessCheck({ onComplete, onCancel }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);
  const faceApiRef = useRef<any>(null);

  // Mutable detection state (no re-render needed)
  const phaseRef        = useRef<Phase>("loading");
  const challengeIdxRef = useRef(0);
  const holdMsRef       = useRef(0);
  const lastFrameMs     = useRef(0);
  const blinkStateRef   = useRef<"open" | "closed">("open");
  const blinkCountRef   = useRef(0);
  const countdownRef    = useRef(3);
  const countdownTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // React state (UI only)
  const [phase, setPhase]             = useState<Phase>("loading");
  const [faceIn, setFaceIn]           = useState(false);
  const [challenges]                  = useState<Challenge[]>(pickChallenges);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [doneList, setDoneList]       = useState<boolean[]>([]);
  const [progress, setProgress]       = useState(0);
  const [countdown, setCountdown]     = useState(3);
  const [blinkCount, setBlinkCount]   = useState(0);
  const [errorMsg, setErrorMsg]       = useState("");
  const [flashGreen, setFlashGreen]   = useState(false);

  // ── Load face-api.js models ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const fa = await import("face-api.js");
        await Promise.all([
          (fa as any).nets.tinyFaceDetector.loadFromUri("/models"),
          (fa as any).nets.faceLandmark68TinyNet.loadFromUri("/models"),
        ]);
        faceApiRef.current = fa;
        phaseRef.current = "positioning";
        setPhase("positioning");
      } catch {
        setErrorMsg("Failed to load face detection. Please reload the page and try again.");
        phaseRef.current = "error";
        setPhase("error");
      }
    })();
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "positioning") return;
    let alive = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch {
        setErrorMsg("Camera access denied. Please allow camera access and try again.");
        phaseRef.current = "error";
        setPhase("error");
      }
    })();
    // Only mark alive=false on cleanup — stream stays open until captureSelfie or unmount
    return () => { alive = false; };
  }, [phase]);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── Capture selfie ────────────────────────────────────────────────────────────
  const captureSelfie = useCallback(() => {
    const video  = videoRef.current;
    const canvas = captureRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror to match what user sees (video is CSS-flipped)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach(t => t.stop());
      phaseRef.current = "done";
      setPhase("done");
      onComplete(blob);
    }, "image/jpeg", 0.92);
  }, [onComplete]);

  // ── Detection loop ────────────────────────────────────────────────────────────
  const loop = useCallback(async (now: number) => {
    const p = phaseRef.current;
    if (p === "done" || p === "error" || p === "loading") return;

    rafRef.current = requestAnimationFrame(loop);

    // Throttle heavy work to every 80ms
    if (now - lastFrameMs.current < 80) return;
    lastFrameMs.current = now;

    const fa      = faceApiRef.current;
    const video   = videoRef.current;
    const overlay = overlayRef.current;
    if (!fa || !video || !overlay || video.paused) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    overlay.width  = video.videoWidth  || 640;
    overlay.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    let result: any;
    try {
      result = await fa.detectSingleFace(
        video,
        new fa.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 }),
      ).withFaceLandmarks(true);
    } catch { return; }

    if (!result) {
      setFaceIn(false);
      drawGuide(ctx, overlay.width, overlay.height, false, 0);
      return;
    }

    setFaceIn(true);
    const pts = result.landmarks.positions as { x: number; y: number }[];
    drawGuide(ctx, overlay.width, overlay.height, true, holdMsRef.current);
    drawMesh(ctx, pts);

    const { yaw, pitch } = getHeadPose(pts);
    const avgEAR = (eyeAspectRatio(pts.slice(36, 42)) + eyeAspectRatio(pts.slice(42, 48))) / 2;

    // Countdown phase → switch to challenge
    if (phaseRef.current === "positioning" && countdownRef.current <= 0) {
      phaseRef.current = "challenge";
      setPhase("challenge");
      return;
    }

    // Challenge detection
    if (phaseRef.current === "challenge") {
      const ch = challenges[challengeIdxRef.current];
      let condMet = false;

      switch (ch) {
        // yaw is in raw (unmirrored) video coords — user's left = positive yaw
        case "LOOK_LEFT":  condMet = yaw   >  0.19; break;
        case "LOOK_RIGHT": condMet = yaw   < -0.19; break;
        case "LOOK_UP":    condMet = pitch <  0.28; break;
        case "LOOK_DOWN":  condMet = pitch >  0.60; break;
        case "BLINK":
          if (avgEAR < 0.25 && blinkStateRef.current === "open") blinkStateRef.current = "closed";
          else if (avgEAR > 0.27 && blinkStateRef.current === "closed") {
            blinkStateRef.current = "open";
            blinkCountRef.current++;
            setBlinkCount(blinkCountRef.current);
          }
          condMet = blinkCountRef.current >= 1;
          break;
      }

      const holdNeeded = ch === "BLINK" ? 1 : 500;

      if (condMet) holdMsRef.current = Math.min(holdMsRef.current + 80, holdNeeded);
      else if (ch !== "BLINK") holdMsRef.current = Math.max(0, holdMsRef.current - 25);

      const prog = holdMsRef.current / holdNeeded;
      setProgress(prog);

      if (prog >= 1) {
        // Challenge complete!
        const nextIdx = challengeIdxRef.current + 1;
        setDoneList(d => [...d, true]);
        setFlashGreen(true);
        setTimeout(() => setFlashGreen(false), 700);
        holdMsRef.current = 0;
        blinkCountRef.current = 0;
        blinkStateRef.current = "open";
        setBlinkCount(0);
        setProgress(0);

        if (nextIdx >= challenges.length) {
          cancelAnimationFrame(rafRef.current);
          phaseRef.current = "capturing";
          setPhase("capturing");
          setTimeout(() => captureSelfie(), 450);
        } else {
          challengeIdxRef.current = nextIdx;
          setChallengeIdx(nextIdx);
        }
      }
    }
  }, [challenges, captureSelfie]);

  useEffect(() => {
    if (phase === "positioning" || phase === "challenge") {
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, loop]);

  // ── Countdown ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "positioning") return;
    if (!faceIn) {
      if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
      countdownRef.current = 3;
      setCountdown(3);
      return;
    }
    countdownRef.current = 3;
    setCountdown(3);
    countdownTimer.current = setInterval(() => {
      countdownRef.current--;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        clearInterval(countdownTimer.current!);
        countdownTimer.current = null;
      }
    }, 1000);
    return () => { if (countdownTimer.current) clearInterval(countdownTimer.current); };
  }, [phase, faceIn]);

  // ── Canvas draw helpers ───────────────────────────────────────────────────────
  function drawGuide(ctx: CanvasRenderingContext2D, w: number, h: number, detected: boolean, holdMs: number) {
    const cx = w / 2, cy = h / 2;
    const rx = w * 0.22, ry = h * 0.38;

    // Vignette mask
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Oval border with color feedback
    const prog = Math.min(1, holdMs / 500);
    const color = !detected ? "#555555" : prog > 0.6 ? "#0ecb81" : "#f0b90b";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = detected ? 3 : 2;
    ctx.setLineDash(detected ? [] : [8, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress arc (clockwise, yellow-to-green)
    if (detected && prog > 0) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, -Math.PI / 2, 0, prog * Math.PI * 2);
      ctx.strokeStyle = prog > 0.8 ? "#0ecb81" : "#f0b90b";
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawMesh(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
    const groups = [
      pts.slice(0, 17),   // jaw
      pts.slice(17, 22),  // left brow
      pts.slice(22, 27),  // right brow
      pts.slice(27, 36),  // nose
      pts.slice(36, 42),  // left eye
      pts.slice(42, 48),  // right eye
      pts.slice(48, 60),  // outer lips
    ];
    ctx.strokeStyle = "rgba(240, 185, 11, 0.35)";
    ctx.lineWidth = 1;
    for (const g of groups) {
      if (g.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(g[0].x, g[0].y);
      for (let i = 1; i < g.length; i++) ctx.lineTo(g[i].x, g[i].y);
      ctx.stroke();
    }
    // Eye dots
    ctx.fillStyle = "rgba(240, 185, 11, 0.7)";
    for (const pt of pts.slice(36, 48)) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const ch   = challenges[challengeIdx];
  const info = CHALLENGE_INFO[ch];

  if (phase === "loading") return (
    <div className="flex flex-col items-center justify-center gap-5 py-14">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border border-[#1e1e1e] bg-[#131313] flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[#f0b90b] animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f0b90b]/20 border border-[#f0b90b]/40 flex items-center justify-center">
          <Shield className="w-2.5 h-2.5 text-[#f0b90b]" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-bold text-white">Loading AI Detection</p>
        <p className="text-sm text-gray-500 mt-1">Preparing liveness models (~270KB)…</p>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f6465d]/10 border border-[#f6465d]/30 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-[#f6465d]" />
      </div>
      <div>
        <p className="font-bold text-white mb-1">Liveness Check Error</p>
        <p className="text-sm text-gray-400 max-w-xs">{errorMsg}</p>
      </div>
      <button onClick={onCancel}
        className="px-6 py-2.5 rounded-xl bg-[#131313] border border-[#1e1e1e] text-sm font-semibold text-gray-300 hover:bg-[#1a1a1a] transition-colors">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Challenge progress pills */}
      <div className="flex gap-2 justify-center flex-wrap">
        {challenges.map((c, i) => {
          const done   = !!doneList[i];
          const active = i === challengeIdx && phase === "challenge";
          return (
            <div key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${
              done   ? "bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]/30"
              : active ? "bg-[#f0b90b]/15 text-[#f0b90b] border-[#f0b90b]/30 ring-2 ring-[#f0b90b]/20"
              : "bg-[#131313] text-gray-600 border-[#1e1e1e]"
            }`}>
              {done ? <CheckCircle className="w-3 h-3" /> : <span className="opacity-60">{i + 1}</span>}
              {CHALLENGE_INFO[c].label}
            </div>
          );
        })}
      </div>

      {/* Camera viewport */}
      <div
        className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
          flashGreen
            ? "border-[#0ecb81] shadow-[0_0_24px_rgba(14,203,129,0.35)]"
            : "border-[#1e1e1e]"
        }`}
        style={{ aspectRatio: "4/3", maxHeight: 320, background: "#000" }}
      >
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Face status badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border transition-all ${
            faceIn
              ? "bg-[#0ecb81]/20 text-[#0ecb81] border-[#0ecb81]/40"
              : "bg-black/60 text-gray-400 border-white/10"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${faceIn ? "bg-[#0ecb81] animate-pulse" : "bg-gray-600"}`} />
            {faceIn ? "Face detected" : "No face detected"}
          </div>
        </div>

        {/* Positioning overlay */}
        {phase === "positioning" && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-center pointer-events-none">
            {!faceIn ? (
              <p className="text-[#f0b90b] text-sm font-bold">Center your face inside the oval</p>
            ) : countdown > 0 ? (
              <div>
                <p className="text-gray-400 text-xs mb-1">Hold still…</p>
                <p className="text-3xl font-black text-white tabular-nums">{countdown}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Challenge overlay */}
        {phase === "challenge" && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pointer-events-none">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#f0b90b]/20 border border-[#f0b90b]/40 flex items-center justify-center shrink-0">
                <ChallengeIcon ch={ch} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Challenge {challengeIdx + 1} of {challenges.length}
                </div>
                <div className="text-sm font-bold text-white">{info.instruction}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${Math.min(100, progress * 100)}%`,
                  background: progress > 0.7 ? "#0ecb81" : "#f0b90b",
                }}
              />
            </div>
          </div>
        )}

        {/* Capturing overlay */}
        {phase === "capturing" && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#0ecb81]/20 border-2 border-[#0ecb81] flex items-center justify-center mx-auto mb-3">
                <Camera className="w-7 h-7 text-[#0ecb81]" />
              </div>
              <p className="text-white font-bold text-sm">All Challenges Passed!</p>
              <p className="text-xs text-gray-400 mt-1">Capturing your photo…</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={captureRef} className="hidden" />

      {/* Blink counter (only during BLINK challenge) */}
      {phase === "challenge" && ch === "BLINK" && (
        <div className="bg-[#f0b90b]/8 border border-[#f0b90b]/20 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Blinks detected</span>
          <div className="flex gap-1.5">
            {[0, 1].map(i => (
              <div key={i} className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                blinkCount > i
                  ? "bg-[#0ecb81]/20 border-[#0ecb81]/50 text-[#0ecb81]"
                  : "bg-[#131313] border-[#1e1e1e] text-gray-700"
              }`}>
                <Eye className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No-face hint */}
      {(phase === "positioning" || phase === "challenge") && !faceIn && (
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">
            Make sure you are in a <span className="text-white font-semibold">well-lit area</span> and facing the camera directly
          </p>
        </div>
      )}

      <button
        onClick={onCancel}
        className="w-full py-2.5 rounded-xl bg-[#131313] border border-[#1e1e1e] text-sm text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" /> Cancel Verification
      </button>
    </div>
  );
}
