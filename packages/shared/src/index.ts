/** Shared domain types and constants for teletype. */

export type GameMode = "time" | "words" | "quote";

export type TimeDuration = 15 | 30 | 60;
export type WordCount = 10 | 25 | 50 | 100;

export type ThemeId =
  | "phosphor"
  | "amber"
  | "vga"
  | "xterm"
  | "solarized"
  | "ibm3270";

export interface ModeConfig {
  mode: GameMode;
  duration?: TimeDuration;
  wordCount?: WordCount;
  quoteId?: string;
}

export interface LiveMetrics {
  /** Gross WPM including errors (standard: chars/5 / minutes). */
  wpm: number;
  /** Net WPM after error penalty. */
  netWpm: number;
  /** 0–100, correct chars / typed chars. */
  accuracy: number;
  /** Characters typed (including corrections path as raw keystrokes counted separately). */
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  rawKeystrokes: number;
  elapsedMs: number;
  /** Progress 0–1 for current run. */
  progress: number;
}

export interface RunResult {
  id: string;
  mode: GameMode;
  modeKey: string;
  wpm: number;
  netWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  rawKeystrokes: number;
  elapsedMs: number;
  completedAt: string;
  ranked: boolean;
  source: "guest" | "server";
}

export interface Quote {
  id: string;
  text: string;
  source?: string;
}

export interface WordListResponse {
  language: string;
  words: string[];
}

export interface HealthResponse {
  ok: true;
  service: "teletype-api";
  version: string;
  time: string;
}

export const TIME_DURATIONS: TimeDuration[] = [15, 30, 60];
export const WORD_COUNTS: WordCount[] = [10, 25, 50, 100];
export const DEFAULT_TIME_DURATION: TimeDuration = 30;
export const DEFAULT_WORD_COUNT: WordCount = 25;

export const THEME_IDS: ThemeId[] = [
  "phosphor",
  "amber",
  "vga",
  "xterm",
  "solarized",
  "ibm3270",
];

export function modeKey(config: ModeConfig): string {
  if (config.mode === "time") return `time:${config.duration ?? DEFAULT_TIME_DURATION}`;
  if (config.mode === "words") return `words:${config.wordCount ?? DEFAULT_WORD_COUNT}`;
  return `quote:${config.quoteId ?? "random"}`;
}

/** Standard typing WPM: (characters / 5) / minutes. */
export function calcWpm(chars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return chars / 5 / minutes;
}

export function calcAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect;
  if (total <= 0) return 100;
  return (correct / total) * 100;
}
