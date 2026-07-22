# teletype

Retro TTY-inspired typing game (Monkeytype / TypeRacer vibes, manpage chrome).

## Stack (MVP)

| Piece | Tech |
|-------|------|
| Web | React 19 + Vite + TypeScript |
| API | Hono on Node |
| Shared | `@teletype/shared` domain types |
| Monorepo | pnpm workspaces |

## Prerequisites (Ubuntu)

Installed / expected on the host:

| Tool | Notes |
|------|--------|
| Node.js 20+ | `apt install nodejs` (22.x) or fnm |
| pnpm 9 | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| Docker + Compose | `apt install docker.io docker-compose-v2` — add user to `docker` group |
| `psql`, `redis-cli` | optional clients: `postgresql-client`, `redis-tools` |
| build-essential | C toolchain for native npm modules |

After first Docker install: `sudo usermod -aG docker $USER` then re-login (or `sg docker -c bash`).

## Quick start

```bash
# Data services (Postgres 16 + Redis 7)
docker compose up -d

# App
pnpm install
pnpm --filter @teletype/shared build
pnpm dev
```

- Web: http://localhost:5173  
- API: http://localhost:8787  
- Postgres: `localhost:5432` (user/pass/db: `teletype` / `teletype` / `teletype`)  
- Redis: `localhost:6379`  

Copy `.env.example` → `.env` when wiring the API to the DB.  
Vite proxies `/api` and `/health` to the API in development.

## What’s in the basic MVP

- Guest play (no account)
- Modes: **time** (15/30/60), **words** (10/25/50/100), **quote**
- Live WPM / accuracy; results saved in `localStorage`
- Terminal themes (phosphor, amber, VGA, xterm, solarized, ibm3270)
- `man` / `?` help overlay
- Corpus API: word list + quotes

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | API + web in parallel |
| `pnpm build` | Build shared, api, web |
| `pnpm test` | Unit tests (engine) |
| `pnpm typecheck` | TypeScript check all packages |

## Repo hygiene

- Local agent planning / `AGENTS.md` / IDE rule packs are **gitignored** — do not commit them.
- Commits should contain product code and tooling config only.
- **Never** add `Co-authored-by:` (or other agent) trailers to commits.
- GitHub Copilot product guidance lives in `.github/copilot-instructions.md` (committed).

## GitHub

| Path | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Typecheck, test, build, API health smoke |
| `.github/dependabot.yml` | Weekly npm + Actions updates |
| `.github/ISSUE_TEMPLATE/` | Bug / feature / task forms |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist |
| `.github/CODEOWNERS` | Default review ownership |
| `.github/copilot-instructions.md` | In-repo agent guidance for the product |

## Roadmap (post-MVP)

Auth, Postgres results/PBs, leaderboards, Redis rate limits, multiplayer races.
