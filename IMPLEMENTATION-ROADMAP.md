# 🌱 Life Cadence Ledger — Implementation Roadmap

## Architecture

### System Overview
```
[macOS Notification] → [Tauri Event] → [Check-in Form (React)]
                                               ↓
                                    [src/lib/db.ts (SQLite)]
                                               ↓
                              ┌────────────────┴───────────────┐
                              ↓                                ↓
                    [Check-in History]           [Pattern Dashboard (Recharts)]
```

### File Structure
```
life-cadence-ledger/
├── src/
│   ├── components/
│   │   ├── CheckInForm.tsx          # 60-second daily log form
│   │   ├── CheckInHistory.tsx       # Scrollable past entries list
│   │   ├── HabitManager.tsx         # Add / edit / archive habits
│   │   ├── PatternDashboard.tsx     # All Recharts panels
│   │   ├── charts/
│   │   │   ├── EnergyFocusTrend.tsx # Dual line chart, 30-day trailing
│   │   │   ├── HabitStreakGrid.tsx  # GitHub-style 90-day grid
│   │   │   ├── SleepEnergyScatter.tsx
│   │   │   └── DayOfWeekBar.tsx    # Avg energy per weekday
│   │   ├── WeeklySummary.tsx        # 7-day color-coded row
│   │   ├── Onboarding.tsx           # First-launch wizard
│   │   └── SettingsPanel.tsx        # Notification time, habit management
│   ├── hooks/
│   │   ├── useCheckins.ts           # CRUD for checkins table
│   │   ├── useHabits.ts             # CRUD for habits table
│   │   └── usePatterns.ts           # Aggregation queries for charts
│   ├── lib/
│   │   ├── db.ts                    # DB init, migrations, all SQL
│   │   ├── notifications.ts         # Tauri notification scheduling
│   │   └── dates.ts                 # Date helpers (no date-fns bloat)
│   ├── types/
│   │   └── index.ts                 # All shared TypeScript interfaces
│   ├── App.tsx                      # Root: tab navigation (Check-in / Dashboard / Settings)
│   └── main.tsx                     # Tauri entry point
├── src-tauri/
│   ├── src/
│   │   └── main.rs                  # Tauri app entry, notification commands
│   ├── tauri.conf.json              # App config, permissions
│   └── Cargo.toml
├── migrations/
│   └── 001_initial.sql             # Schema (also in db.ts for runtime init)
├── CLAUDE.md
├── IMPLEMENTATION-ROADMAP.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Data Model

```sql
-- Run on first launch via db.ts initDatabase()

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,                          -- nanoid()
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '✅',
  active INTEGER DEFAULT 1,                     -- soft delete
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,                          -- nanoid()
  checkin_date DATE UNIQUE NOT NULL,            -- 'YYYY-MM-DD', one per day
  energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5),
  focus_quality INTEGER CHECK(focus_quality BETWEEN 1 AND 5),
  sleep_hours REAL CHECK(sleep_hours BETWEEN 0 AND 24),
  mood INTEGER CHECK(mood BETWEEN 1 AND 5),    -- optional, collapsed in form
  notes TEXT,                                   -- optional, collapsed in form
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,                          -- nanoid()
  checkin_date DATE NOT NULL,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed INTEGER DEFAULT 0,
  UNIQUE(checkin_date, habit_id)
);

-- Indexes for dashboard query performance
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_habit ON habit_completions(habit_id);
```

---

## TypeScript Interfaces

```typescript
// src/types/index.ts

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Checkin {
  id: string;
  checkinDate: string;        // 'YYYY-MM-DD'
  energyLevel: number;        // 1–5
  focusQuality: number;       // 1–5
  sleepHours: number;
  mood?: number;              // 1–5, optional
  notes?: string;             // optional
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  checkinDate: string;
  habitId: string;
  completed: boolean;
}

export interface CheckinWithHabits extends Checkin {
  habits: { habitId: string; completed: boolean }[];
}

// For chart queries
export interface DailyAggregateRow {
  checkinDate: string;
  energyLevel: number;
  focusQuality: number;
  sleepHours: number;
  completedHabits: number;
  totalHabits: number;
}

export interface HabitCorrelation {
  habitId: string;
  habitName: string;
  avgEnergyWithHabit: number;
  avgEnergyWithout: number;
  avgFocusWithHabit: number;
  avgFocusWithout: number;
  sampleCount: number;
}
```

---

## Dependencies

```bash
# Scaffold
npm create tauri-app@latest life-cadence-ledger -- --template react-ts

cd life-cadence-ledger

# Frontend deps
npm install recharts tailwindcss autoprefixer postcss nanoid

# Tauri plugins
npm install @tauri-apps/plugin-sql @tauri-apps/plugin-notification

# Tailwind init
npx tailwindcss init -p
```

```toml
# src-tauri/Cargo.toml — add under [dependencies]
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-notification = "2"
```

```json
// src-tauri/tauri.conf.json — add to plugins
{
  "plugins": {
    "sql": {},
    "notification": {}
  }
}
```

---

## Scope Boundaries

**In scope (v1):**
- Daily check-in form (energy, focus, sleep, habits, optional mood/notes)
- Habit management (add, edit, archive, reorder)
- Pattern dashboard: 5 chart panels (see below)
- Weekly cadence summary view
- macOS notification at configurable daily time
- Onboarding wizard (first launch: add habits, set reminder time)
- CSV import from 30-day manual log (3 columns min: date, energy, focus)
- All data local — SQLite on device

**Out of scope (v1 — do not build):**
- Per-check-in project/context tagging
- Claude API weekly narrative summary
- CSV export
- Statistical correlation analysis (Pearson r, p-values)
- iCloud / any cloud sync
- Windows / Linux builds
- Mobile app

**Deferred to v2:**
- Claude API: weekly narrative digest using check-in data
- iCloud sync via Tauri plugin
- CSV export
- Advanced stats (rolling correlations, regression)

---

## Security

- No network calls. `tauri.conf.json` must have `allowlist.http.all = false` (Tauri 2 default deny is fine).
- SQLite file lives in Tauri's app data dir: `$HOME/Library/Application Support/life-cadence-ledger/`
- No telemetry. No Sentry. No analytics.
- Data is mood/energy/habit — sensitive personal data. Local-only is non-negotiable.

---

## Phase 0: Foundation (Week 1)

**Objective:** Working Tauri app with SQLite initialized, habits CRUD functional, and check-in form that persists data.

**Tasks:**

1. Scaffold Tauri 2 + React + TypeScript project
   - **Acceptance:** `npm run tauri dev` opens desktop window with default React screen

2. Install and configure all dependencies (plugins, Tailwind, Recharts, nanoid)
   - **Acceptance:** `import Database from '@tauri-apps/plugin-sql'` resolves with no TS errors; Tailwind classes render in the app

3. Implement `src/lib/db.ts` — `initDatabase()`, all CRUD functions for all 3 tables
   - **Acceptance:** `initDatabase()` creates tables on cold start; calling `createHabit({name:'Exercise', emoji:'🏃'})` inserts a row verifiable in DB Browser for SQLite

4. Implement `useHabits` hook — list active habits, add, edit, archive
   - **Acceptance:** Unit tests pass for all operations; `useHabits()` returns correct habit list after add/archive cycle

5. Build `HabitManager.tsx` — list habits, inline add, toggle active
   - **Acceptance:** Can add "Exercise 🏃", "No caffeine ☕", archive one — changes persist after app restart

6. Implement `useCheckins` hook — create, update today's check-in, fetch last 90 days
   - **Acceptance:** Unit tests pass; calling save twice on same date updates rather than duplicates (UNIQUE constraint on checkin_date)

7. Build `CheckInForm.tsx` — energy (1–5 tap), focus (1–5 tap), sleep hours input, habit completion toggles, collapsed optional section (mood, notes)
   - **Acceptance:** Complete form interaction in under 60 seconds (time yourself); data persists across app restarts; re-opening shows today's data pre-filled in edit mode

8. Build `CheckInHistory.tsx` — scrollable list of past check-ins, 90-day window
   - **Acceptance:** After 3+ check-ins across different dates, list shows them in reverse-chron order with energy/focus/habit summary

9. Implement `src/lib/notifications.ts` + `SettingsPanel.tsx` (notification time only for Phase 0)
   - **Acceptance:** Set reminder to 2 minutes from now; macOS notification fires at that time with "Time for your daily check-in" message

**Verification checklist:**
- [ ] `npm run tauri dev` → app opens with no console errors
- [ ] Add 3 habits → restart app → habits persist
- [ ] Complete a check-in → restart app → check-in visible in history
- [ ] Complete check-in for today → re-open form → shows today's data for editing
- [ ] Submit same date twice → no duplicate rows in DB (UPDATE, not INSERT)
- [ ] macOS notification fires at configured time

**Risks:**
- `@tauri-apps/plugin-sql` SQLite setup on macOS arm64 → follow plugin docs exactly for `Cargo.toml` features; fallback: use `better-sqlite3` via Tauri sidecar if plugin fails
- `@tauri-apps/plugin-notification` requires macOS notification permission → add permission request on first launch

---

## Phase 1: Pattern Dashboard (Week 2)

**Objective:** All 5 chart panels functional with real data. Dashboard is the primary view after 7+ check-ins.

**Prerequisite:** Must have at least 14 check-ins in DB before charts render meaningfully. Show empty state with "Log X more check-ins to unlock this chart" for charts that need more data.

**Tasks:**

1. Implement `usePatterns` hook — aggregation queries powering all 5 chart panels
   - **Acceptance:** Unit tests pass for all 5 query functions; returns correct data shapes matching `DailyAggregateRow` and `HabitCorrelation` interfaces

2. Build `EnergyFocusTrend.tsx` — dual line chart (energy + focus), 30-day trailing, 7-day rolling average
   - **Acceptance:** With 30+ check-ins, shows two lines with rolling average; missing days shown as gaps (not zero); date range selector for 30/60/90 days

3. Build `HabitStreakGrid.tsx` — GitHub contribution-style grid, 90-day trailing, one cell per day per habit
   - **Acceptance:** Each habit gets its own row; completed days show colored cell; empty days show grey; streak count shown per habit

4. Build `SleepEnergyScatter.tsx` — scatter plot: sleep hours (x) vs energy level (y), one point per check-in
   - **Acceptance:** With 14+ check-ins, points render correctly; tooltip shows date + values on hover; requires 14 check-ins minimum (empty state otherwise)

5. Build `DayOfWeekBar.tsx` — average energy level per weekday (Mon–Sun)
   - **Acceptance:** With 8+ check-ins, bars show per-weekday averages; requires minimum 2 data points per day to display that day's bar

6. Build `WeeklySummary.tsx` — 7-day color-coded row showing energy/focus/habits per day, best/worst day callout
   - **Acceptance:** Shows current week; tapping a day navigates to that check-in in history; "Best day this week: Wednesday (4.2 avg)" callout renders correctly

7. Assemble `PatternDashboard.tsx` — tab or scroll layout combining all 5 panels
   - **Acceptance:** All 5 panels visible in one scrollable view; date range selector applies to trend charts; empty states display correctly for each panel's minimum data requirement

**Verification checklist:**
- [ ] Seed DB with 30 synthetic check-ins (write a seed script) → all 5 charts render with data
- [ ] Remove all but 5 check-ins → all charts show appropriate empty states
- [ ] Rolling average on trend chart is visually smooth (not jagged from single-day spikes)
- [ ] Habit streak grid shows correct streak counts vs raw DB data

---

## Phase 2: Polish & CSV Import (Week 3)

**Objective:** App is ready for daily use. Onboarding guides first-time setup. CSV import brings in the 30-day manual log data.

**Tasks:**

1. Build `Onboarding.tsx` — first-launch wizard: welcome → add habits → set notification time → done
   - **Acceptance:** On a clean install (no DB), wizard appears on first launch; completing it sets habits, notification time, and marks onboarding complete (stored in SQLite settings table); never shows again

2. Empty states for all charts (Phase 1 incomplete task — verify each has a good empty state)
   - **Acceptance:** Fresh install → dashboard shows all empty states with specific "Log X more check-ins" messaging per chart

3. CSV import (30-day manual log format)
   - **Acceptance:** Import a CSV with columns `date,energy,focus,sleep_hours,notes` → rows appear in check-in history; duplicate dates update existing rows; malformed rows are skipped with error count shown

4. Add settings table to SQLite for app preferences
   ```sql
   CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   );
   -- Keys: 'notification_time' (HH:MM), 'onboarding_complete' (0/1), 'reminder_enabled' (0/1)
   ```
   - **Acceptance:** Notification time persists across restarts; onboarding_complete flag persists

5. App icon, window title, and basic packaging
   - **Acceptance:** `npm run tauri build` produces `.dmg`; app name and icon are correct in macOS dock

6. Final 60-second check-in timing audit — measure actual completion time with real habits list
   - **Acceptance:** With 5 active habits, completing a check-in (all required fields) takes ≤ 60 seconds

**Verification checklist:**
- [ ] Fresh install → onboarding wizard appears → complete it → never shows again
- [ ] CSV import with 30 rows → all rows visible in history
- [ ] CSV import with a malformed row → error count shown, valid rows imported
- [ ] `npm run tauri build` → `.dmg` installs cleanly, launches from Applications
- [ ] Complete check-in with 5 habits in under 60 seconds (timed)
- [ ] All data persists after full app quit and relaunch

---

## Definition of Done (v1)

- [ ] Add and manage habits (add, edit, archive, reorder)
- [ ] Complete daily check-in in under 60 seconds
- [ ] Daily macOS notification reminder fires at configured time
- [ ] All 5 pattern dashboard charts render with 30+ days of data
- [ ] CSV import from 30-day manual log works
- [ ] All data persists across restarts
- [ ] Zero network calls (verifiable via macOS Little Snitch or proxyman)
- [ ] `npm run tauri build` produces working `.dmg`
