# Life Cadence Ledger

Local-first macOS desktop app tracking daily energy, focus, habits, and sleep — surfaces correlations over time. All data stays on-device; zero network calls.

## Stack

- **Tauri 2.x** — macOS desktop shell, system notifications, SQLite plugin
- **React 19** — UI framework (hooks only, no class components)
- **TypeScript 7.0.x** (strict mode)
- **SQLite** via `@tauri-apps/plugin-sql` — local-first persistence
- **Recharts 3.x** — trend and correlation charts
- **Tailwind CSS 4.x** — styling

## Build / Test / Run

```bash
npm ci               # install locked dependencies
npm test             # run all configured Vitest tests
npm run build        # TypeScript check and Vite bundle
npm run dev          # frontend browser development
npm run tauri dev    # native desktop development
```

Use npm with `package-lock.json`. See README.md for Node.js requirements,
native prerequisites, and the separate Cargo check. `make build` and `make test`
wrap the npm scripts; no JavaScript lint/format script is configured. Native
development stores app data and may schedule reminders; use the README's
disposable-profile and synthetic-data precautions.

## Architecture

- All database mutations go through `src/lib/db.ts` — no raw SQL in components.
- All data transforms require unit tests before merging.
- File naming: kebab-case for files, PascalCase for React components.
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`.

## Scope Gates

**Privacy hard constraint:** zero outbound requests — no network calls, no telemetry, no analytics. Any new code that adds a network call is a blocker.

**Phase constraint:** implement only features in the current phase of `IMPLEMENTATION-ROADMAP.md`. v2 features (project tagging, Claude API summary, CSV export, iCloud sync) are deferred until v1 ships.

**UX constraint:** keep the check-in form completable in ≤60 seconds. Collapse any non-required field rather than showing it inline.

## Status

v1.0 — All phases complete (Phase 0: Foundation, Phase 1: Pattern Dashboard, Phase 2: Polish & CSV Import). See `IMPLEMENTATION-ROADMAP.md` for full details.

<!-- portfolio-context:start -->
# Portfolio Context

## What This Project Is

A local-first macOS desktop app for tracking daily energy, focus, habits, and sleep, then surfacing correlations over time. Built for personal use — the goal is to understand when you're at your best and design your schedule around actual patterns rather than assumptions. All data stays on-device, zero network calls.

## Current State

**v1.0 — All phases complete** (Phase 0: Foundation, Phase 1: Pattern Dashboard, Phase 2: Polish & CSV Import)
See IMPLEMENTATION-ROADMAP.md for full phase details and acceptance criteria.

## Stack

- **Tauri**: 2.x — macOS desktop shell, system notifications, SQLite plugin
- **React**: 19 — UI framework
- **TypeScript**: 7.0.x (strict mode)
- **SQLite**: via `@tauri-apps/plugin-sql` — local-first persistence
- **Recharts**: 3.x — trend and correlation charts
- **Tailwind CSS**: 4.x — styling

## How To Run

- Install locked dependencies with `npm ci`.
- Start frontend browser development with `npm run dev`; use `npm run tauri dev` for the native app with the README's data/reminder precautions.
- Review the repo README for any required verification commands before shipping.

## Known Risks

- Do not make any network calls — zero outbound requests, no telemetry, no analytics
- Do not build v2 features (project tagging, Claude API summary, CSV export, iCloud sync) in v1
- Do not add features not in the current phase of IMPLEMENTATION-ROADMAP.md
- Do not put SQL queries directly in React components — all DB calls go through `src/lib/db.ts`
- Do not make the check-in form take more than 60 seconds — if a field is not required, collapse it
- Do not use class components — hooks only

## Next Recommended Move

Use this context plus the README and supporting docs to resume the next active task, then promote the repo beyond minimum-viable by capturing a dedicated handoff, roadmap, or discovery artifact.

<!-- portfolio-context:end -->
