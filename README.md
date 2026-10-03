# LifeCadenceLedger

[![Status](https://img.shields.io/badge/status-v1.0-green?style=flat-square)](#)

> A personal ledger for the rhythms, habits, and obligations that structure daily life.

LifeCadenceLedger tracks recurring commitments — the cadence layer that sits between a calendar and a habit tracker. Captures daily energy, focus, sleep, and habit completions, then surfaces patterns over time. All data stays on-device via SQLite; zero network calls.

## Features

- Daily check-in form — energy (1–5), focus (1–5), sleep hours, mood, habit completions
- Habit manager — add, archive, and reorder tracked habits
- Pattern dashboard — 5 chart panels: energy/focus trend, habit streak grid, sleep vs energy scatter, weekday averages, weekly summary
- macOS notification reminder at a configurable daily time
- CSV import from a prior manual log
- Local-first — no accounts, no cloud required

## Development and verification

The stack is Tauri 2.x, React 19.x, TypeScript 7.0.x (strict mode), Recharts 3.x,
and Tailwind CSS 4.x, with SQLite via `@tauri-apps/plugin-sql` 2.5.0.
`package.json` and `src-tauri/Cargo.toml` declare dependencies;
`package-lock.json` and `src-tauri/Cargo.lock` record resolved versions.

From the repository root, use npm with `package-lock.json` and Node.js
22.13+ within 22.x, 24.x, or 26.x. These ranges satisfy
the locked Vite, Vitest, jsdom, and better-sqlite3 engines; “22.13+” alone
would also include unsupported odd-numbered releases. Native desktop work also needs Rust stable and macOS
developer tools. Install the checked-in npm dependencies, then run the local
gates before opening the app:

```bash
npm ci
npm test -- src/lib/dates.test.ts src/lib/csv-import.test.ts  # focused pure fixtures
npm test                            # all configured Vitest tests
npm run build                       # TypeScript check and Vite bundle
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

`make build` and `make test` wrap the actual npm scripts. The broader Vitest
lane uses jsdom and Testing Library; native optional dependencies such as canvas
may need their platform build prerequisites if a prebuilt binary is unavailable.
Tests use synthetic inputs; they do not launch the Tauri app. No separate
JavaScript lint/format script is configured. The current CodeQL workflow is
static analysis, not proof that build or tests ran.

Use `npm run dev` for frontend browser checks. Use `npm run tauri dev` for the
native app, in a disposable macOS user profile with synthetic check-ins/habits:
it stores SQLite in the application data directory and may schedule reminders.
For UI/chart changes, check the affected empty/populated states in the browser;
for SQL/notification changes, native verification is separate. Do not import
personal logs, replace the existing ledger, or trigger reminders as routine tests.

## License

MIT
