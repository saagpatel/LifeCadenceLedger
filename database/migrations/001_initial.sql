-- Life Cadence Ledger — Initial Schema

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '✅',
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  checkin_date DATE UNIQUE NOT NULL,
  energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5),
  focus_quality INTEGER CHECK(focus_quality BETWEEN 1 AND 5),
  sleep_hours REAL CHECK(sleep_hours BETWEEN 0 AND 24),
  mood INTEGER CHECK(mood BETWEEN 1 AND 5),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  checkin_date DATE NOT NULL,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed INTEGER DEFAULT 0,
  UNIQUE(checkin_date, habit_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_habit ON habit_completions(habit_id);
