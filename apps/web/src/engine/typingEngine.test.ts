import { describe, expect, it } from "vitest";
import { modeKey } from "@teletype/shared";
import { TypingEngine, generateWordText } from "./typingEngine";

describe("TypingEngine", () => {
  it("uses shared modeKey helper for result identity", () => {
    const engine = new TypingEngine({
      mode: { mode: "time" },
      text: "hello",
    });
    expect(engine.getSnapshot().modeKey).toBe(modeKey({ mode: "time" }));
    expect(engine.getSnapshot().modeKey).toBe("time:30");
  });

  it("tracks correct keystrokes and finishes words mode", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "words", wordCount: 10 },
      text: "ab cd",
      now: () => t,
    });

    for (const ch of "ab cd") {
      t += 100;
      engine.handleKey(ch);
    }

    const snap = engine.getSnapshot();
    expect(snap.status).toBe("finished");
    expect(snap.metrics.correctChars).toBe(5);
    expect(snap.metrics.incorrectChars).toBe(0);
    expect(snap.metrics.accuracy).toBe(100);
    expect(snap.modeKey).toBe(modeKey({ mode: "words", wordCount: 10 }));
  });

  it("counts mistakes without undoing accuracy on backspace", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "words", wordCount: 10 },
      text: "hi",
      now: () => t,
    });
    t = 100;
    engine.handleKey("x");
    engine.handleKey("Backspace");
    engine.handleKey("h");
    engine.handleKey("i");
    const snap = engine.getSnapshot();
    expect(snap.metrics.incorrectChars).toBe(1);
    expect(snap.metrics.correctChars).toBe(2);
    expect(snap.status).toBe("finished");
  });

  it("net WPM does not penalize corrected errors", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "words", wordCount: 10 },
      text: "hi",
      now: () => t,
    });

    t = 1000;
    engine.handleKey("x"); // wrong at pos 0
    t = 2000;
    engine.handleKey("Backspace"); // correct it
    t = 3000;
    engine.handleKey("h"); // correct at pos 0
    t = 4000;
    engine.handleKey("i"); // correct at pos 1

    const snap = engine.getSnapshot();
    // correctChars = 2, incorrectChars = 1 (cumulative for accuracy)
    // uncorrectedErrors = 0 (the error was corrected via Backspace)
    // net wpm should equal gross wpm since no uncorrected errors
    expect(snap.metrics.correctChars).toBe(2);
    expect(snap.metrics.incorrectChars).toBe(1);
    expect(snap.metrics.wpm).toBe(snap.metrics.netWpm);
  });

  it("net WPM penalizes uncorrected errors", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "words", wordCount: 10 },
      text: "hi",
      now: () => t,
    });

    t = 1000;
    engine.handleKey("x"); // wrong at pos 0, not corrected
    t = 2000;
    engine.handleKey("i"); // target[1] = "i", correct

    const snap = engine.getSnapshot();
    expect(snap.metrics.correctChars).toBe(1);
    expect(snap.metrics.incorrectChars).toBe(1);
    // uncorrectedErrors = 1 (pos 0 still has "x" instead of "h")
    // netWpm = calcWpm(max(0, 1 - 1), elapsed) = 0
    expect(snap.metrics.netWpm).toBe(0);
    expect(snap.metrics.wpm).toBeGreaterThan(0);
  });

  it("finishes time mode on tick after duration", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "time", duration: 15 },
      text: "hello world foo bar baz",
      now: () => t,
    });
    t = 0;
    engine.handleKey("h");
    t = 15_000;
    expect(engine.tick()).toBe(true);
    expect(engine.getSnapshot().status).toBe("finished");
  });

  it("extendText appends to target and errorMap", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "time", duration: 60 },
      text: "ab cd",
      now: () => t,
    });
    const originalLen = engine.getSnapshot().target.length;
    engine.extendText(" ef gh");
    const snap = engine.getSnapshot();
    expect(snap.target).toBe("ab cd ef gh");
    expect(snap.target.length).toBe(originalLen + 6);
    expect(snap.errorMap.length).toBe(snap.target.length);
  });

  it("shouldExtendText returns true at 80% in time mode", () => {
    let t = 0;
    const engine = new TypingEngine({
      mode: { mode: "time", duration: 60 },
      text: "abcdefghij", // 10 chars
      now: () => t,
    });
    // Type 7 chars (70%) — should not trigger
    for (const ch of "abcdefg") {
      t += 100;
      engine.handleKey(ch);
    }
    expect(engine.shouldExtendText()).toBe(false);
    // Type 1 more (80%) — should trigger
    t += 100;
    engine.handleKey("h");
    expect(engine.shouldExtendText()).toBe(true);
  });

  it("shouldExtendText returns false in words mode", () => {
    const engine = new TypingEngine({
      mode: { mode: "words", wordCount: 10 },
      text: "abcdefghij",
    });
    // Type all chars — should still be false
    for (const ch of "abcdefghij") {
      engine.handleKey(ch);
    }
    expect(engine.shouldExtendText()).toBe(false);
  });
});

describe("generateWordText", () => {
  it("returns requested word count", () => {
    const text = generateWordText(["a", "b", "c"], 10, () => 0);
    expect(text.split(" ")).toHaveLength(10);
  });
});
