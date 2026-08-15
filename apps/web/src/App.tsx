import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_TIME_DURATION,
  DEFAULT_WORD_COUNT,
  THEME_IDS,
  modeKey as buildModeKey,
  type GameMode,
  type RunResult,
  type ThemeId,
  type TimeDuration,
  type WordCount,
} from "@teletype/shared";
import {
  TypingEngine,
  generateTimeText,
  generateWordText,
  type EngineSnapshot,
} from "./engine/typingEngine";
import { FALLBACK_WORDS, fetchRandomQuote, fetchWords } from "./lib/api";
import { loadGuestResults, loadTheme, saveGuestResult, saveTheme } from "./lib/storage";
import { HelpOverlay } from "./components/HelpOverlay";
import { MetricsBar } from "./components/MetricsBar";
import { ModeSelector } from "./components/ModeSelector";
import { ResultsPanel } from "./components/ResultsPanel";
import { TypingStage } from "./components/TypingStage";

/** Extension chunk size for time mode when the caret approaches the end. */
const TIME_MODE_EXTENSION_WORDS = 100;

function emptySnap(): EngineSnapshot {
  return {
    status: "idle",
    target: "",
    caretIndex: 0,
    typed: "",
    metrics: {
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
    },
    mode: "time",
    modeKey: "time:30",
    errorMap: [],
  };
}

export function App() {
  const [theme, setTheme] = useState<ThemeId>(() => loadTheme());
  const [mode, setMode] = useState<GameMode>("time");
  const [duration, setDuration] = useState<TimeDuration>(DEFAULT_TIME_DURATION);
  const [wordCount, setWordCount] = useState<WordCount>(DEFAULT_WORD_COUNT);
  const [words, setWords] = useState<string[]>(FALLBACK_WORDS);
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(emptySnap);
  const [focused, setFocused] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [history, setHistory] = useState<RunResult[]>(() => loadGuestResults());
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"up" | "down" | "…">("…");

  const engineRef = useRef<TypingEngine | null>(null);
  const savedRef = useRef(false);
  /** Tab arms restart; Enter within the window confirms (Monkeytype-style). */
  const tabRestartArmedRef = useRef(false);
  const tabRestartTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = await fetchWords();
        if (!cancelled) {
          setWords(w);
          setApiStatus("up");
        }
      } catch {
        if (!cancelled) setApiStatus("down");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rebuild = useCallback(async () => {
    setLoading(true);
    savedRef.current = false;

    let text: string;
    let config: {
      mode: GameMode;
      duration?: TimeDuration;
      wordCount?: WordCount;
      quoteId?: string;
    };

    if (mode === "quote") {
      try {
        const q = await fetchRandomQuote();
        text = q.text;
        config = { mode: "quote", quoteId: q.id };
        setApiStatus("up");
      } catch {
        text =
          "A teleprinter is an electromechanical device that can send and receive typed messages.";
        config = { mode: "quote", quoteId: "fallback" };
        setApiStatus("down");
      }
    } else if (mode === "time") {
      text = generateTimeText(words, duration);
      config = { mode: "time", duration };
    } else {
      text = generateWordText(words, wordCount);
      config = { mode: "words", wordCount };
    }

    const engine = new TypingEngine({ mode: config, text });
    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());
    setLoading(false);
    setFocused(true);
  }, [mode, duration, wordCount, words]);

  useEffect(() => {
    void rebuild();
  }, [rebuild]);

  // Time-mode ticker
  useEffect(() => {
    if (snapshot.status !== "running" || mode !== "time") return;
    const id = window.setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;
      eng.tick();
      setSnapshot(eng.getSnapshot());
    }, 100);
    return () => clearInterval(id);
  }, [snapshot.status, mode]);

  // Persist guest result once when finished
  useEffect(() => {
    if (snapshot.status !== "finished" || savedRef.current) return;
    savedRef.current = true;
    const result: RunResult = {
      id: crypto.randomUUID(),
      mode: snapshot.mode,
      modeKey: snapshot.modeKey,
      wpm: snapshot.metrics.wpm,
      netWpm: snapshot.metrics.netWpm,
      accuracy: snapshot.metrics.accuracy,
      correctChars: snapshot.metrics.correctChars,
      incorrectChars: snapshot.metrics.incorrectChars,
      rawKeystrokes: snapshot.metrics.rawKeystrokes,
      elapsedMs: snapshot.metrics.elapsedMs,
      completedAt: new Date().toISOString(),
      ranked: false,
      source: "guest",
    };
    setHistory(saveGuestResult(result));
  }, [snapshot]);

  useEffect(() => {
    const clearTabRestartArm = () => {
      tabRestartArmedRef.current = false;
      if (tabRestartTimerRef.current != null) {
        window.clearTimeout(tabRestartTimerRef.current);
        tabRestartTimerRef.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !helpOpen) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      if ((e.key === "Escape" || e.key === "q") && helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (helpOpen) return;

      // Tab + Enter restart (help manpage documents this).
      if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        tabRestartArmedRef.current = true;
        if (tabRestartTimerRef.current != null) {
          window.clearTimeout(tabRestartTimerRef.current);
        }
        tabRestartTimerRef.current = window.setTimeout(clearTabRestartArm, 1500);
        return;
      }
      if (e.key === "Enter" && tabRestartArmedRef.current) {
        e.preventDefault();
        clearTabRestartArm();
        void rebuild();
        return;
      }
      if (tabRestartArmedRef.current && e.key !== "Shift") {
        clearTabRestartArm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTabRestartArm();
    };
  }, [helpOpen, rebuild]);

  const onKey = (key: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.handleKey(key)) {
      // Extend text in time mode when the user is approaching the end
      if (eng.shouldExtendText()) {
        eng.extendText(generateWordText(words, TIME_MODE_EXTENSION_WORDS));
      }
      setSnapshot(eng.getSnapshot());
    }
  };

  const remainingLabel = (() => {
    if (mode !== "time") return undefined;
    if (snapshot.status === "idle") return `${duration}s`;
    const left = Math.max(
      0,
      duration - snapshot.metrics.elapsedMs / 1000,
    );
    return `${Math.ceil(left)}s`;
  })();

  const running = snapshot.status === "running";

  return (
    <div className="crt app">
      <header className="topbar">
        <div className="brand">
          teletype <span>tty1</span>
        </div>
        <nav className="nav">
          <button type="button" onClick={() => void rebuild()} title="Restart">
            restart
          </button>
          <button type="button" onClick={() => setHelpOpen(true)}>
            man
          </button>
          <label className="sr-only" htmlFor="theme">
            Theme
          </label>
          <select
            id="theme"
            className="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeId)}
          >
            {THEME_IDS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </nav>
      </header>

      <ModeSelector
        mode={mode}
        duration={duration}
        wordCount={wordCount}
        disabled={running}
        onMode={(m) => setMode(m)}
        onDuration={(d) => setDuration(d)}
        onWordCount={(n) => setWordCount(n)}
      />

      <div className="prompt-line">
        <span className="path">guest@teletype</span>
        :<span className="path">~</span>$ type{" "}
        <span>{buildModeKey({ mode, duration, wordCount })}</span>
        {loading ? " …" : ""}
      </div>

      <MetricsBar
        metrics={snapshot.metrics}
        status={snapshot.status}
        remainingLabel={remainingLabel}
      />

      <main className="stage">
        {snapshot.status === "finished" ? (
          <ResultsPanel
            metrics={snapshot.metrics}
            modeKey={snapshot.modeKey}
            onRestart={() => void rebuild()}
          />
        ) : (
          <TypingStage
            snapshot={snapshot}
            focused={focused}
            onFocus={() => setFocused(true)}
            onKey={onKey}
          />
        )}

        {history.length > 0 && (
          <section className="history" aria-label="Recent results">
            <table>
              <thead>
                <tr>
                  <th>mode</th>
                  <th>wpm</th>
                  <th>acc</th>
                  <th>when</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td>{r.modeKey}</td>
                    <td>{r.wpm.toFixed(0)}</td>
                    <td>{r.accuracy.toFixed(0)}%</td>
                    <td>{new Date(r.completedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>
          press <kbd>?</kbd> for man · guest session · api {apiStatus}
        </span>
        <span>teletype v0.1.0-mvp</span>
      </footer>

      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
