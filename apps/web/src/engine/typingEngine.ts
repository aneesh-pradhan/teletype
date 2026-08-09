import {
  DEFAULT_TIME_DURATION,
  calcAccuracy,
  calcWpm,
  modeKey,
  type GameMode,
  type LiveMetrics,
  type ModeConfig,
  type TimeDuration,
  type WordCount,
} from "@teletype/shared";

export type EngineStatus = "idle" | "running" | "finished";

export interface EngineSnapshot {
  status: EngineStatus;
  target: string;
  /** Per-character state relative to caret. */
  caretIndex: number;
  typed: string;
  metrics: LiveMetrics;
  mode: GameMode;
  modeKey: string;
  errorMap: boolean[];
}

export interface EngineOptions {
  mode: ModeConfig;
  /** Full text to type (already generated). */
  text: string;
  now?: () => number;
}

function emptyMetrics(): LiveMetrics {
  return {
    wpm: 0,
    netWpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    rawKeystrokes: 0,
    elapsedMs: 0,
    progress: 0,
  };
}

/**
 * Pure client-side typing engine.
 * Keystroke path stays off the network for ≤16ms paint targets.
 */
export class TypingEngine {
  private status: EngineStatus = "idle";
  private target: string;
  private typed = "";
  private caretIndex = 0;
  private errorMap: boolean[] = [];
  private correctChars = 0;
  private incorrectChars = 0;
  private rawKeystrokes = 0;
  private startedAt: number | null = null;
  private finishedAt: number | null = null;
  private mode: ModeConfig;
  private modeKey: string;
  private now: () => number;
  private durationMs: number | null;

  constructor(opts: EngineOptions) {
    this.target = opts.text;
    this.mode = opts.mode;
    this.modeKey = modeKey(opts.mode);
    this.now = opts.now ?? (() => performance.now());
    this.errorMap = Array.from({ length: opts.text.length }, () => false);
    this.durationMs =
      opts.mode.mode === "time"
        ? (opts.mode.duration ?? DEFAULT_TIME_DURATION) * 1000
        : null;
  }

  getSnapshot(): EngineSnapshot {
    return {
      status: this.status,
      target: this.target,
      caretIndex: this.caretIndex,
      typed: this.typed,
      metrics: this.computeMetrics(),
      mode: this.mode.mode,
      modeKey: this.modeKey,
      errorMap: [...this.errorMap],
    };
  }

  /** Handle a printable character or Backspace. Returns true if state changed. */
  handleKey(key: string): boolean {
    if (this.status === "finished") return false;

    if (key === "Backspace") {
      if (this.caretIndex === 0) return false;
      this.rawKeystrokes += 1;
      this.caretIndex -= 1;
      this.typed = this.typed.slice(0, -1);
      // Errors already counted stay counted (Monkeytype-style: mistakes not undone for accuracy).
      return true;
    }

    // Only single printable characters
    if (key.length !== 1) return false;

    if (this.status === "idle") {
      this.status = "running";
      this.startedAt = this.now();
    }

    this.rawKeystrokes += 1;
    const expected = this.target[this.caretIndex];

    if (this.caretIndex >= this.target.length) {
      // Extra chars past end (rare for fixed text)
      this.incorrectChars += 1;
      this.typed += key;
      return true;
    }

    if (key === expected) {
      this.correctChars += 1;
    } else {
      this.incorrectChars += 1;
      this.errorMap[this.caretIndex] = true;
    }

    this.typed += key;
    this.caretIndex += 1;

    this.checkFinished();
    return true;
  }

  /** Call on animation frame / timer for time-mode expiry. */
  tick(): boolean {
    if (this.status !== "running") return false;
    if (this.durationMs != null && this.startedAt != null) {
      const elapsed = this.now() - this.startedAt;
      if (elapsed >= this.durationMs) {
        this.finish();
        return true;
      }
    }
    return false;
  }

  private checkFinished(): void {
    if (this.mode.mode === "time") {
      // finished via tick
      return;
    }
    if (this.mode.mode === "words" || this.mode.mode === "quote") {
      if (this.caretIndex >= this.target.length) {
        this.finish();
      }
    }
  }

  private finish(): void {
    if (this.status === "finished") return;
    this.status = "finished";
    this.finishedAt = this.now();
  }

  /**
   * Count positions where the user typed incorrectly and did not correct it.
   * A position is "uncorrected" if errorMap[i] is true AND the final typed
   * character at that position differs from the target.
   */
  private countUncorrectedErrors(): number {
    let count = 0;
    for (let i = 0; i < this.caretIndex && i < this.errorMap.length; i++) {
      if (this.errorMap[i]) {
        // The position was errored at some point. Check if it's still wrong.
        if (this.typed[i] !== this.target[i]) {
          count++;
        }
      }
    }
    return count;
  }

  private computeMetrics(): LiveMetrics {
    if (this.status === "idle") return emptyMetrics();

    const end = this.finishedAt ?? this.now();
    const start = this.startedAt ?? end;
    const elapsedMs = Math.max(0, end - start);

    const wpm = round1(calcWpm(this.correctChars, elapsedMs));

    // Net WPM: subtract only uncorrected errors (positions where errorMap is
    // still true at or behind the caret). Corrected errors should not penalize
    // net WPM — they already cost time via the Backspace + retype cycle.
    const uncorrectedErrors = this.countUncorrectedErrors();
    const netWpm = round1(
      calcWpm(Math.max(0, this.correctChars - uncorrectedErrors), elapsedMs),
    );
    const accuracy = round1(
      calcAccuracy(this.correctChars, this.incorrectChars),
    );

    let progress = 0;
    if (this.mode.mode === "time" && this.durationMs) {
      progress = Math.min(1, elapsedMs / this.durationMs);
    } else if (this.target.length > 0) {
      progress = Math.min(1, this.caretIndex / this.target.length);
    }

    return {
      wpm,
      netWpm,
      accuracy,
      correctChars: this.correctChars,
      incorrectChars: this.incorrectChars,
      extraChars: 0,
      missedChars:
        this.status === "finished"
          ? Math.max(0, this.target.length - this.caretIndex)
          : 0,
      rawKeystrokes: this.rawKeystrokes,
      elapsedMs: Math.round(elapsedMs),
      progress,
    };
  }
}

function round1(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

/** Shuffle-sample words into a typing string. */
export function generateWordText(
  words: string[],
  count: WordCount | number,
  rng: () => number = Math.random,
): string {
  if (words.length === 0) return "the quick brown fox jumps over the lazy dog";
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const w = words[Math.floor(rng() * words.length)]!;
    picked.push(w.toLowerCase());
  }
  return picked.join(" ");
}

/** Enough words for time mode (keep typing until timer ends). */
export function generateTimeText(
  words: string[],
  duration: TimeDuration | number,
  rng: () => number = Math.random,
): string {
  // ~60 wpm * duration seconds / 60 * 1.5 buffer
  const estimate = Math.max(40, Math.ceil((duration / 60) * 60 * 2.5));
  return generateWordText(words, estimate, rng);
}

export type { ModeConfig, TimeDuration, WordCount };
