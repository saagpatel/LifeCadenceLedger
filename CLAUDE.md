# 🌱 Life Cadence Ledger

## Overview
A local-first macOS desktop app for tracking daily energy, focus, habits, and sleep, then surfacing correlations over time. Built for personal use — the goal is to understand when you're at your best and design your schedule around actual patterns rather than assumptions. All data stays on-device, zero network calls.

## Tech Stack
- **Tauri**: 2.0 — macOS desktop shell, system notifications, SQLite plugin
- **React**: 18 — UI framework
- **TypeScript**: 5.x (strict mode)
- **SQLite**: via `@tauri-apps/plugin-sql` — local-first persistence
- **Recharts**: 2.x — trend and correlation charts
- **Tailwind CSS**: 3.x — styling

## Development Conventions
- TypeScript strict mode — no `any` types
- File naming: kebab-case for files, PascalCase for React components
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`
- All database mutations go through `src/lib/db.ts` — no raw SQL in components
- All data transforms must have unit tests before committing

## Current Phase
**Phase 0: Foundation**
See IMPLEMENTATION-ROADMAP.md for full phase details and acceptance criteria.

## Key Decisions
| Decision | Choice | Why |
|---|---|---|
| Desktop shell | Tauri 2.0 (not Electron) | Smaller binary, native SQLite plugin, local-first |
| Storage | SQLite via Tauri plugin | Zero config, single file, portable |
| Charts | Recharts | Best Tauri/React compatibility, declarative API |
| Network calls | None | Privacy is non-negotiable — daily mood/energy data is sensitive |
| v2 features | Deferred entirely | Focus on the 60-second check-in habit first |

## Do NOT
- Do not make any network calls — zero outbound requests, no telemetry, no analytics
- Do not build v2 features (project tagging, Claude API summary, CSV export, iCloud sync) in v1
- Do not add features not in the current phase of IMPLEMENTATION-ROADMAP.md
- Do not put SQL queries directly in React components — all DB calls go through `src/lib/db.ts`
- Do not make the check-in form take more than 60 seconds — if a field is not required, collapse it
- Do not use class components — hooks only
