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
});

describe("generateWordText", () => {
  it("returns requested word count", () => {
    const text = generateWordText(["a", "b", "c"], 10, () => 0);
    expect(text.split(" ")).toHaveLength(10);
  });
});
