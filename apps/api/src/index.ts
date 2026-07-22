import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoute } from "./routes/health.js";
import { corpusRoute } from "./routes/corpus.js";

const app = new Hono();

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const port = Number(process.env.PORT ?? 8787);
const hostname = process.env.HOST ?? "0.0.0.0";

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      webOrigin,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.route("/health", healthRoute);
app.route("/api/v1/corpus", corpusRoute);

app.get("/", (c) =>
  c.json({
    name: "teletype-api",
    version: "0.1.0",
    docs: "GET /health, GET /api/v1/corpus/words, GET /api/v1/corpus/quotes",
  }),
);

console.log(`teletype api listening on http://${hostname}:${port}`);
serve({ fetch: app.fetch, port, hostname });
