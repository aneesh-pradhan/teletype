#!/usr/bin/env bash
# All-in-one local stack: Postgres + Redis + API + Web
# Frontend for humans: http://localhost:5173
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/usr/bin:${HOME}/.local/share/fnm:${PATH}"
if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)" 2>/dev/null || true
  fnm use 22 2>/dev/null || true
fi

mkdir -p "${ROOT}/.grok/logs"
LOG_DIR="${ROOT}/.grok/logs"

echo "==> teletype all-in-one up"
echo "    root: ${ROOT}"

# 1) Data plane
if command -v docker >/dev/null 2>&1; then
  if docker compose ps >/dev/null 2>&1; then
    docker compose up -d
  else
    sudo docker compose up -d
  fi
else
  echo "WARN: docker not found; skipping Postgres/Redis"
fi

# 2) Env
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "    wrote .env from .env.example"
fi

# 3) Shared package (needed by api/web)
pnpm --filter @teletype/shared build

# 4) Dev servers (background, logs under .grok/logs — gitignored)
if [[ -f "${LOG_DIR}/api.pid" ]] && kill -0 "$(cat "${LOG_DIR}/api.pid")" 2>/dev/null; then
  echo "    api already running pid=$(cat "${LOG_DIR}/api.pid")"
else
  nohup pnpm --filter @teletype/api dev >"${LOG_DIR}/api.log" 2>&1 &
  echo $! >"${LOG_DIR}/api.pid"
  echo "    api started pid=$! → :8787"
fi

if [[ -f "${LOG_DIR}/web.pid" ]] && kill -0 "$(cat "${LOG_DIR}/web.pid")" 2>/dev/null; then
  echo "    web already running pid=$(cat "${LOG_DIR}/web.pid")"
else
  nohup pnpm --filter @teletype/web dev >"${LOG_DIR}/web.log" 2>&1 &
  echo $! >"${LOG_DIR}/web.pid"
  echo "    web started pid=$! → :5173"
fi

# 5) Wait for readiness
echo "==> waiting for health"
for i in $(seq 1 40); do
  api_ok=0
  web_ok=0
  curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1 && api_ok=1
  curl -fsS -o /dev/null http://127.0.0.1:5173/ 2>/dev/null && web_ok=1
  if [[ $api_ok -eq 1 && $web_ok -eq 1 ]]; then
    break
  fi
  sleep 0.25
done

echo
echo "┌─────────────────────────────────────────────┐"
echo "│  teletype all-in-one                        │"
echo "│  Frontend:  http://localhost:5173           │"
echo "│  API:       http://localhost:8787           │"
echo "│  Health:    http://localhost:8787/health    │"
echo "│  Postgres:  localhost:5432  (teletype/*)    │"
echo "│  Redis:     localhost:6379                  │"
echo "│  Logs:      .grok/logs/{api,web}.log        │"
echo "└─────────────────────────────────────────────┘"

curl -fsS http://127.0.0.1:8787/health || echo "API not ready — see .grok/logs/api.log"
curl -fsS -o /dev/null -w "web HTTP %{http_code}\n" http://127.0.0.1:5173/ || echo "Web not ready — see .grok/logs/web.log"
