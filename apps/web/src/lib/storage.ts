import type { RunResult, ThemeId } from "@teletype/shared";

const RESULTS_KEY = "teletype:guest-results";
const THEME_KEY = "teletype:theme";
const MAX_RESULTS = 50;

export function loadGuestResults(): RunResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RunResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestResult(result: RunResult): RunResult[] {
  const prev = loadGuestResults();
  const next = [result, ...prev].slice(0, MAX_RESULTS);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(next));
  return next;
}

export function loadTheme(): ThemeId {
  const t = localStorage.getItem(THEME_KEY) as ThemeId | null;
  return t ?? "phosphor";
}

export function saveTheme(theme: ThemeId): void {
  localStorage.setItem(THEME_KEY, theme);
}
