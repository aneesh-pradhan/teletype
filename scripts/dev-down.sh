#!/usr/bin/env bash
# Stop API + web dev servers started by scripts/dev-up.sh (keeps Docker DBs up)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${ROOT}/.grok/logs"

stop_pidfile() {
  local name="$1"
  local f="${LOG_DIR}/${name}.pid"
  if [[ -f "$f" ]]; then
    local pid
    pid="$(cat "$f")"
    if kill -0 "$pid" 2>/dev/null; then
      # kill process group / children of pnpm
      pkill -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
      echo "stopped ${name} pid=${pid}"
    fi
    rm -f "$f"
  fi
}

stop_pidfile api
stop_pidfile web

# Belt-and-suspenders: path-scoped node children
pgrep -f "${ROOT}/apps/web/.*vite" 2>/dev/null | xargs -r kill 2>/dev/null || true
pgrep -f "${ROOT}/apps/api/.*tsx" 2>/dev/null | xargs -r kill 2>/dev/null || true

echo "dev servers down (Docker DBs left running; use: pnpm db:down)"
