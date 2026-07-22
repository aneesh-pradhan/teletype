import type { Quote, WordListResponse } from "@teletype/shared";

/** Same-origin via Vite proxy in dev; override with VITE_API_URL if needed. */
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchWords(lang = "en"): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/v1/corpus/words?lang=${lang}`);
  if (!res.ok) throw new Error(`words fetch failed: ${res.status}`);
  const data = (await res.json()) as WordListResponse;
  return data.words;
}

export async function fetchRandomQuote(): Promise<Quote> {
  const res = await fetch(`${API_BASE}/api/v1/corpus/quotes/random`);
  if (!res.ok) throw new Error(`quote fetch failed: ${res.status}`);
  const data = (await res.json()) as { quote: Quote };
  return data.quote;
}

/** Offline fallback if API is down. */
export const FALLBACK_WORDS = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
  "shell", "terminal", "kernel", "linux", "type", "speed", "cursor",
  "buffer", "stream", "socket", "packet", "command", "prompt", "script",
  "module", "function", "return", "value", "string", "number", "array",
  "object", "class", "method", "state", "store", "cache", "queue",
  "stack", "graph", "tree", "list", "map", "hash", "index", "query",
  "table", "token", "session", "header", "status", "request", "route",
  "config", "option", "flag", "build", "test", "deploy", "release",
  "version", "branch", "commit", "merge", "patch", "debug", "error",
  "input", "output", "memory", "disk", "file", "path", "server",
  "client", "network", "window", "screen", "pixel", "light", "code",
];
