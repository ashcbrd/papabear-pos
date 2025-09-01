import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onConfirm: () => Promise<void> | void; // called after full hold
  idleLabel?: string; // text when idle
  confirmingLabel?: string; // text while holding
  successLabel?: string; // text after success
  className?: string;
  holdMs?: number; // duration to hold (default 2000ms)
};

export default function LongPressServeButton({
  onConfirm,
  idleLabel = "Mark as Served",
  confirmingLabel = "Hold…",
  successLabel = "Served!",
  className = "",
  holdMs = 2000,
}: Props) {
  // Visual state
  const [progress, setProgress] = useState(0); // 0..1
  const [isRunning, setIsRunning] = useState(false); // async confirm running
  const [done, setDone] = useState(false); // show success flash

  // Logic refs to avoid stale closures
  const holdingRef = useRef(false); // are we currently holding?
  const triggeredRef = useRef(false); // did we already confirm?
  const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const progressRef = useRef(0); // mirror of progress for cancel logic

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const hardReset = useCallback(() => {
    holdingRef.current = false;
    triggeredRef.current = false;
    startTsRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setProgress(0);
  }, []);

  const finishAndFlash = useCallback(() => {
    setDone(true);
    setTimeout(() => {
      if (!mountedRef.current) return;
      hardReset();
      setDone(false);
    }, 1500);
  }, [hardReset]);

  const runConfirm = useCallback(async () => {
    if (triggeredRef.current || isRunning) return; // guard double fire
    triggeredRef.current = true;
    setIsRunning(true);
    try {
      await onConfirm();
    } catch (e) {
      console.error("Confirm failed:", e);
    } finally {
      if (!mountedRef.current) return;
      setIsRunning(false);
      finishAndFlash();
    }
  }, [finishAndFlash, isRunning, onConfirm]);

  const tick = useCallback(
    (now: number) => {
      if (startTsRef.current === null) startTsRef.current = now;
      const elapsed = now - startTsRef.current;
      const p = Math.min(1, elapsed / holdMs);

      setProgress(p);

      // If user canceled before finishing and we haven't triggered, stop ticking
      if (!holdingRef.current && !triggeredRef.current) return;

      if (p >= 1 && !triggeredRef.current) {
        // Completed hold — trigger confirm even if the finger lifted this frame
        holdingRef.current = false;
        runConfirm();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [holdMs, runConfirm]
  );

  const beginHold = useCallback(
    (e?: React.PointerEvent | React.KeyboardEvent) => {
      if (isRunning) return; // ignore while async is running
      setDone(false);
      triggeredRef.current = false;
      holdingRef.current = true;
      startTsRef.current = null;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);

      // Pointer capture keeps events even if finger drifts
      if (e && "pointerId" in e && "currentTarget" in e) {
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
      }
    },
    [isRunning, tick]
  );

  const cancelHold = useCallback(
    (e?: React.PointerEvent | React.KeyboardEvent) => {
      // If already completed (triggered), ignore cancels
      if (triggeredRef.current) return;

      // Release capture if any
      if (e && "pointerId" in e && "currentTarget" in e) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
      }

      // Stop holding
      holdingRef.current = false;

      // If user let go BEFORE completion, reset immediately
      if (progressRef.current < 1) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        startTsRef.current = null;
        triggeredRef.current = false;
        setProgress(0); // snap back to 0 (or animate if you prefer)
      }
      // If progress reached 1 this same frame, runConfirm already handled success
    },
    []
  );

  // Unified, robust events
  const events = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault(); // stop text selection / native long-press menu
      beginHold(e);
    },
    onPointerUp: (e: React.PointerEvent) => {
      cancelHold(e);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      cancelHold(e);
    },
    // Do NOT cancel on pointerleave; common in scrollable containers
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        beginHold(e);
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      cancelHold(e);
    },
  };

  return (
    <button
      type="button"
      className={`relative overflow-hidden w-full touch-none select-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      aria-label={idleLabel}
      aria-pressed={holdingRef.current}
      disabled={isRunning}
      onContextMenu={(e) => e.preventDefault()}
      {...events}
    >
      {/* Progress fill */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none"
        style={{
          width: `${progress * 100}%`,
          transition: holdingRef.current ? "none" : "width 150ms ease-out",
          willChange: "width",
        }}
      />
      <span className="relative z-10">
        {isRunning
          ? "Processing…"
          : holdingRef.current
          ? confirmingLabel
          : done
          ? successLabel
          : idleLabel}
      </span>
    </button>
  );
}
