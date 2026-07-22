import { Hono } from "hono";
import type { HealthResponse } from "@teletype/shared";

export const healthRoute = new Hono();

healthRoute.get("/", (c) => {
  const body: HealthResponse = {
    ok: true,
    service: "teletype-api",
    version: "0.1.0",
    time: new Date().toISOString(),
  };
  return c.json(body);
});
