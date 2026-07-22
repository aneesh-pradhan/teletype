# Contributing to teletype

## Workflow (required)

We use **GitHub as the system of record**: issues for work, branches + PRs for changes, Projects for sprint planning. Avoid committing straight to `main` except emergency hotfixes.

### 1. Track work with issues

- Every non-trivial change starts as a **GitHub Issue** (bug / feature / task templates).
- Use labels: `status:*`, `priority:*`, `area:*`, `sprint:current`, `mvp`, etc.
- Prefer one issue per mergeable outcome. Link subtasks with “Blocked by #n” / “Part of #n”.

### 2. Branch from `main`

```bash
git checkout main && git pull
git checkout -b <type>/<short-slug>   # e.g. chore/stack-up, fix/mode-key, feat/db-package
```

Types: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`.

### 3. Implement & verify locally (all-in-one host)

```bash
pnpm stack:up          # Postgres, Redis, API :8787, web :5173
pnpm typecheck && pnpm test && pnpm build
```

Human QA: **http://localhost:5173**

### 4. Open a pull request

- Push the branch and open a PR against `main`.
- Fill the PR template; link issues (`Fixes #n` or `Refs #n`).
- Keep PRs reviewably small (one vertical slice when possible).
- **CI must pass** before merge (typecheck, test, build, API smoke).
- No force-push to `main`; no agent `Co-authored-by` trailers.

### 5. Review & merge

- Prefer **squash merge** for feature branches (clean history on `main`).
- Delete the branch after merge.
- Move/close issues via keywords or manually set `status:done` and close.

### 6. Project board (scrum)

Use the **teletype** GitHub Project for sprint columns (Backlog → Ready → In Progress → In Review → Done).  
Issues in the active sprint carry `sprint:current` and the current Sprint milestone.

## Repo hygiene

- Product code + tooling only on the remote (see `.gitignore`).
- Do not commit local agent trees (`.grok/`, `AGENTS.md`, planning scratch).
- Never add `Co-authored-by:` for tools/agents.

## Commands cheat sheet

| Command | Purpose |
|---------|---------|
| `pnpm stack:up` / `stack:down` | Full local stack |
| `pnpm db:up` / `db:down` | Postgres + Redis only |
| `pnpm typecheck` / `test` / `build` | Quality gates |
| `pnpm dev` | API + web without docker helper |
