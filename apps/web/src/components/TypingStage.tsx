import { useEffect, useMemo, useRef, useState } from "react";
import type { EngineSnapshot } from "../engine/typingEngine";

interface Props {
  snapshot: EngineSnapshot;
  focused: boolean;
  onFocus: () => void;
  onKey: (key: string) => void;
}

export function TypingStage({ snapshot, focused, onFocus, onKey }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused, snapshot.status]);

  const chars = useMemo(() => {
    const out: { ch: string; cls: string; isCaret: boolean }[] = [];
    const { target, caretIndex, typed, errorMap } = snapshot;
    for (let i = 0; i < target.length; i++) {
      const ch = target[i]!;
      let cls = "char";
      if (i < caretIndex) {
        const typedCh = typed[i];
        cls += typedCh === ch && !errorMap[i] ? " correct" : " incorrect";
        // If they corrected after error, errorMap stays true → show incorrect style once erred
        if (errorMap[i]) cls = "char incorrect";
        else if (typedCh === ch) cls = "char correct";
        else cls = "char incorrect";
      }
      out.push({ ch, cls, isCaret: i === caretIndex && snapshot.status !== "finished" });
    }
    return out;
  }, [snapshot]);

  // Smooth vertical scroll: keep the caret comfortably in view (lower-middle of
  // the typing window) instead of letting long runs jump the page. The .words
  // container is given a fixed max height + overflow hidden in CSS; here we
  // translate it by `scrollOffset` px with a CSS transition for motion.
  useEffect(() => {
    const container = wordsRef.current;
    const caret = caretRef.current;
    if (!container || !caret) {
      setScrollOffset(0);
      return;
    }
    const visible = container.clientHeight;
    const content = container.scrollHeight;
    // No overflow → keep content pinned to the top.
    if (content <= visible) {
      setScrollOffset(0);
      return;
    }
    // Caret line top relative to the (untranslated) words content.
    const caretTop = caret.offsetTop;
    // Target keeping the caret around 45% down the visible window.
    const target = caretTop - visible * 0.45;
    const clamped = Math.max(0, Math.min(target, content - visible));
    setScrollOffset(clamped);
  }, [snapshot.caretIndex, snapshot.status]);

  return (
    <div
      className="typing-area"
      role="textbox"
      aria-label="Typing area"
      tabIndex={0}
      onClick={() => {
        onFocus();
        inputRef.current?.focus();
      }}
      onFocus={onFocus}
    >
      <input
        ref={inputRef}
        className="hidden-input"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value=""
        aria-hidden
        onChange={() => {}}
        onKeyDown={(e) => {
          // Tab is reserved for Tab+Enter restart (handled at App level).
          if (e.key === "Tab") {
            e.preventDefault();
            return;
          }
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          if (e.key === "Backspace") {
            e.preventDefault();
            onKey("Backspace");
            return;
          }
          if (e.key.length === 1) {
            e.preventDefault();
            onKey(e.key);
          }
        }}
      />
      <div
        className="words"
        ref={wordsRef}
        style={{ transform: `translateY(-${scrollOffset}px)` }}
        aria-live="off"
      >
        {chars.map((c, i) => (
          <span
            key={i}
            className={c.isCaret ? `${c.cls} caret-host` : c.cls}
            ref={
              c.isCaret
                ? (el) => {
                    caretRef.current = el;
                  }
                : undefined
            }
          >
            {c.isCaret && <span className="caret" aria-hidden />}
            {c.ch}
          </span>
        ))}
        {snapshot.status !== "finished" &&
          snapshot.caretIndex >= snapshot.target.length && (
            <span className="caret" aria-hidden />
          )}
      </div>
      {!focused && snapshot.status !== "finished" && (
        <p className="hint" style={{ marginTop: "1rem" }}>
          click or focus to start typing
        </p>
      )}
    </div>
  );
}
