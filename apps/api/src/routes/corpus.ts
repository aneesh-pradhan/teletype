import { Hono } from "hono";
import type { Quote, WordListResponse } from "@teletype/shared";
import { ENGLISH_WORDS, QUOTES } from "../data/english.js";

export const corpusRoute = new Hono();

corpusRoute.get("/words", (c) => {
  const language = c.req.query("lang") ?? "en";
  if (language !== "en") {
    return c.json({ error: "unsupported_language", language }, 400);
  }
  const body: WordListResponse = {
    language: "en",
    words: ENGLISH_WORDS,
  };
  return c.json(body);
});

corpusRoute.get("/quotes", (c) => {
  const quotes: Quote[] = QUOTES;
  return c.json({ quotes });
});

corpusRoute.get("/quotes/random", (c) => {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]!;
  return c.json({ quote });
});

corpusRoute.get("/quotes/:id", (c) => {
  const id = c.req.param("id");
  const quote = QUOTES.find((q) => q.id === id);
  if (!quote) return c.json({ error: "not_found" }, 404);
  return c.json({ quote });
});
