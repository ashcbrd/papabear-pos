// LongPressServeButton.tsx
import React, { useCallback, useRef, useState } from "react";

type Props = {
  onConfirm: () => Promise<void> | void; // what to do after 2s hold
  idleLabel?: string; // button text when idle
  confirmingLabel?: string; // optional text while holding
  successLabel?: string; // optional text after success
  className?: string;
  holdMs?: number; // default 2000ms
};

export default function LongPressServeButton({
  onConfirm,
  idleLabel = "Mark as Served",
  confirmingLabel = "Hold…",
  successLabel = "Served!",
  className = "",
  holdMs = 2000,
}: Props) {
  const [progress, setProgress] = useState(0); // 0 → 1
  const [isHolding, setIsHolding] = useState(false);
  const [isRunning, setIsRunning] = useState(false); // prevents double-press during async
  const [done, setDone] = useState(false);

  const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
    startTsRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const step = useCallback(
    (ts: number) => {
      if (startTsRef.current === null) startTsRef.current = ts;
      const elapsed = ts - startTsRef.current;
      const p = Math.min(1, elapsed / holdMs);
      setProgress(p);
      if (p < 1 && isHolding) {
        rafRef.current = requestAnimationFrame(step);
      } else if (p >= 1 && isHolding) {
        // Trigger confirm
        (async () => {
          setIsRunning(true);
          try {
            await onConfirm();
            setDone(true);
          } finally {
            setIsRunning(false);
            reset();
          }
        })();
      }
    },
    [holdMs, isHolding, onConfirm, reset]
  );

  const beginHold = useCallback(() => {
    if (isRunning) return;
    setDone(false);
    setIsHolding(true);
    startTsRef.current = null;
    rafRef.current = requestAnimationFrame(step);
  }, [isRunning, step]);

  const cancelHold = useCallback(() => {
    if (!isHolding) return;
    reset();
  }, [isHolding, reset]);

  // Pointer + touch support
  const events = {
    onMouseDown: beginHold,
    onMouseUp: cancelHold,
    onMouseLeave: cancelHold,
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault(); // avoid 300ms delay/ghost click
      beginHold();
    },
    onTouchEnd: cancelHold,
    onTouchCancel: cancelHold,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") beginHold();
    },
    onKeyUp: cancelHold,
  };

  return (
    <button
      type="button"
      className={`relative overflow-hidden w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      aria-label={idleLabel}
      aria-pressed={isHolding}
      disabled={isRunning}
      {...events}
    >
      {/* Progress fill */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-white/20"
        style={{
          width: `${progress * 100}%`,
          transition: isHolding ? "none" : "width 150ms ease-out",
        }}
      />
      <span className="relative z-10 select-none">
        {isRunning
          ? "Processing…"
          : isHolding
          ? confirmingLabel
          : done
          ? successLabel
          : idleLabel}
      </span>
    </button>
  );
}
