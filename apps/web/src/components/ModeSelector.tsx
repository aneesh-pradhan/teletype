import {
  TIME_DURATIONS,
  WORD_COUNTS,
  type GameMode,
  type TimeDuration,
  type WordCount,
} from "@teletype/shared";

interface Props {
  mode: GameMode;
  duration: TimeDuration;
  wordCount: WordCount;
  disabled?: boolean;
  onMode: (m: GameMode) => void;
  onDuration: (d: TimeDuration) => void;
  onWordCount: (n: WordCount) => void;
}

export function ModeSelector({
  mode,
  duration,
  wordCount,
  disabled,
  onMode,
  onDuration,
  onWordCount,
}: Props) {
  return (
    <div className="controls-row" role="group" aria-label="Mode">
      {(["time", "words", "quote"] as GameMode[]).map((m) => (
        <button
          key={m}
          type="button"
          className={mode === m ? "chip active" : "chip"}
          disabled={disabled}
          onClick={() => onMode(m)}
        >
          {m}
        </button>
      ))}
      <span style={{ color: "var(--fg-muted)" }}>|</span>
      {mode === "time" &&
        TIME_DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            className={duration === d ? "chip active" : "chip"}
            disabled={disabled}
            onClick={() => onDuration(d)}
          >
            {d}
          </button>
        ))}
      {mode === "words" &&
        WORD_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            className={wordCount === n ? "chip active" : "chip"}
            disabled={disabled}
            onClick={() => onWordCount(n)}
          >
            {n}
          </button>
        ))}
      {mode === "quote" && (
        <span className="chip" style={{ cursor: "default" }}>
          random
        </span>
      )}
    </div>
  );
}
