# teletype — coding agent guidance (product only)

This file is for GitHub Copilot / coding agents working in this repository.

## Product

teletype is a Monkeytype/TypeRacer-style typing site with a **Linux TTY / manpage / retro-terminal** aesthetic. Prefer monospace, high-contrast themes, keyboard-first UX.

## Stack

- Monorepo: pnpm workspaces
- `apps/web` — React 19 + Vite + TypeScript
- `apps/api` — Hono on Node
- `packages/shared` — domain types
- Docker Compose: Postgres 16 + Redis 7

## Hard rules

1. **Never** add `Co-authored-by:` or other agent/tool co-author trailers to commits.
2. Do not commit local agent planning files (`AGENTS.md`, `.cursor/`, design scratch, etc.). They are gitignored.
3. Prefer path-scoped `git add`; commit product code and tooling only.
4. Keystroke latency stays on the client; do not put the game loop behind network round-trips.
5. Keep UI terminal-first (CSS variables / themes under `apps/web/src/styles/`).

## Commands

```bash
pnpm install
pnpm --filter @teletype/shared build
pnpm typecheck
pnpm test
pnpm build
pnpm dev
pnpm db:up
```
