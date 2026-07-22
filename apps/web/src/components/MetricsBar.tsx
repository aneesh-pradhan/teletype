import type { LiveMetrics } from "@teletype/shared";

interface Props {
  metrics: LiveMetrics;
  status: string;
  remainingLabel?: string;
}

export function MetricsBar({ metrics, status, remainingLabel }: Props) {
  return (
    <div className="metrics" aria-live="polite">
      <div className="metric">
        <div className="label">wpm</div>
        <div className="value">{status === "idle" ? "—" : metrics.wpm.toFixed(0)}</div>
      </div>
      <div className="metric">
        <div className="label">acc</div>
        <div className="value">
          {status === "idle" ? "—" : `${metrics.accuracy.toFixed(0)}%`}
        </div>
      </div>
      <div className="metric">
        <div className="label">time</div>
        <div className="value">
          {remainingLabel ??
            (status === "idle"
              ? "—"
              : `${(metrics.elapsedMs / 1000).toFixed(0)}s`)}
        </div>
      </div>
      <div className="metric">
        <div className="label">raw</div>
        <div className="value">
          {status === "idle" ? "—" : metrics.netWpm.toFixed(0)}
        </div>
      </div>
    </div>
  );
}
