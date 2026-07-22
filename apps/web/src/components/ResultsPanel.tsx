import type { LiveMetrics } from "@teletype/shared";

interface Props {
  metrics: LiveMetrics;
  modeKey: string;
  onRestart: () => void;
}

export function ResultsPanel({ metrics, modeKey, onRestart }: Props) {
  return (
    <div className="results-panel" role="status">
      <h2>$ job complete — {modeKey}</h2>
      <div className="results-grid">
        <div className="metric">
          <div className="label">wpm</div>
          <div className="value">{metrics.wpm.toFixed(0)}</div>
        </div>
        <div className="metric">
          <div className="label">net</div>
          <div className="value">{metrics.netWpm.toFixed(0)}</div>
        </div>
        <div className="metric">
          <div className="label">acc</div>
          <div className="value">{metrics.accuracy.toFixed(1)}%</div>
        </div>
        <div className="metric">
          <div className="label">time</div>
          <div className="value">{(metrics.elapsedMs / 1000).toFixed(1)}s</div>
        </div>
      </div>
      <button type="button" className="chip active" onClick={onRestart}>
        restart
      </button>
    </div>
  );
}
