import { useEffect, useRef, useState } from "react";
import type { LiveMetrics } from "@teletype/shared";

interface Props {
  metrics: LiveMetrics;
  status: string;
  remainingLabel?: string;
}

/**
 * Eases a displayed number toward `target` using requestAnimationFrame so the
 * metrics bar reads as continuous motion (Codex-CLI-diff-counter feel) instead
 * of hard-jumping on every keystroke / 100 ms tick.
 *
 * - Uses an easeOutCubic curve over `duration` ms.
 * - When `reset` is true (e.g. the run returns to idle), snaps to `target`
 *   with no animation so a fresh run starts from zero rather than counting
 *   down from the previous run's value.
 * - Honours `prefers-reduced-motion` by snapping to `target`.
 *
 * The animation lives entirely in the UI layer; the engine's `LiveMetrics`
 * stay pure and are still what gets persisted on finish.
 */
function useAnimatedNumber(target: number, reset: boolean, duration = 320): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reset) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      currentRef.current = target;
      setDisplay(target);
      return;
    }
    if (reduceMotion.current || target === currentRef.current) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }
    const from = currentRef.current;
    const start = performance.now();
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const step = (ts: number) => {
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      currentRef.current = value;
      setDisplay(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        currentRef.current = target;
        setDisplay(target);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, reset]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return display;
}

export function MetricsBar({ metrics, status, remainingLabel }: Props) {
  const idle = status === "idle";
  // Reset (snap) whenever the run is idle so the next run starts from zero.
  const wpm = useAnimatedNumber(metrics.wpm, idle);
  const netWpm = useAnimatedNumber(metrics.netWpm, idle);
  const accuracy = useAnimatedNumber(metrics.accuracy, idle);

  return (
    <div className="metrics" aria-live="polite">
      <div className="metric">
        <div className="label">wpm</div>
        <div className="value">{idle ? "—" : wpm.toFixed(0)}</div>
      </div>
      <div className="metric">
        <div className="label">acc</div>
        <div className="value">{idle ? "—" : `${accuracy.toFixed(0)}%`}</div>
      </div>
      <div className="metric">
        <div className="label">time</div>
        <div className="value">
          {remainingLabel ??
            (idle ? "—" : `${(metrics.elapsedMs / 1000).toFixed(0)}s`)}
        </div>
      </div>
      <div className="metric">
        <div className="label">net</div>
        <div className="value">{idle ? "—" : netWpm.toFixed(0)}</div>
      </div>
    </div>
  );
}
