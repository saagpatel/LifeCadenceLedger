import Database from "@tauri-apps/plugin-sql";
import type {
	Checkin,
	CheckinWithHabits,
	Habit,
	HabitCompletion,
} from "../types";
import { todayAsISODate } from "./dates";

// --- Row interfaces (snake_case, raw SQLite types) ---

export interface HabitRow {
	id: string;
	name: string;
	emoji: string;
	active: number;
	sort_order: number;
	created_at: string;
}

export interface CheckinRow {
	id: string;
	checkin_date: string;
	energy_level: number;
	focus_quality: number;
	sleep_hours: number;
	mood: number | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface HabitCompletionRow {
	id: string;
	checkin_date: string;
	habit_id: string;
	completed: number;
}

// --- Row mappers (pure, testable) ---

export function mapHabit(row: HabitRow): Habit {
	return {
		id: row.id,
		name: row.name,
		emoji: row.emoji,
		active: row.active === 1,
		sortOrder: row.sort_order,
		createdAt: row.created_at,
	};
}

export function mapCheckin(row: CheckinRow): Checkin {
	return {
		id: row.id,
		checkinDate: row.checkin_date,
		energyLevel: row.energy_level,
		focusQuality: row.focus_quality,
		sleepHours: row.sleep_hours,
		mood: row.mood ?? undefined,
		notes: row.notes ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function mapHabitCompletion(row: HabitCompletionRow): HabitCompletion {
	return {
		id: row.id,
		checkinDate: row.checkin_date,
		habitId: row.habit_id,
		completed: row.completed === 1,
	};
}

// --- Database singleton ---

let db: Database | null = null;

async function getDb(): Promise<Database> {
	if (!db) {
		db = await Database.load("sqlite:life-cadence-ledger.db");
	}
	return db;
}

/** Initialize database connection (triggers migration via Rust plugin). */
export async function initDatabase(): Promise<void> {
	await getDb();
}

// --- Habits CRUD ---

export async function createHabit(name: string, emoji = "✅"): Promise<Habit> {
	const d = await getDb();
	const id = crypto.randomUUID();
	const maxOrder = await d.select<{ max_order: number | null }[]>(
		"SELECT MAX(sort_order) as max_order FROM habits WHERE active = 1",
	);
	const sortOrder = (maxOrder[0]?.max_order ?? -1) + 1;
	await d.execute(
		"INSERT INTO habits (id, name, emoji, sort_order) VALUES ($1, $2, $3, $4)",
		[id, name, emoji, sortOrder],
	);
	const rows = await d.select<HabitRow[]>(
		"SELECT id, name, emoji, active, sort_order, created_at FROM habits WHERE id = $1",
		[id],
	);
	return mapHabit(rows[0]);
}

export async function getActiveHabits(): Promise<Habit[]> {
	const d = await getDb();
	const rows = await d.select<HabitRow[]>(
		"SELECT id, name, emoji, active, sort_order, created_at FROM habits WHERE active = 1 ORDER BY sort_order ASC",
	);
	return rows.map(mapHabit);
}

export async function getAllHabits(): Promise<Habit[]> {
	const d = await getDb();
	const rows = await d.select<HabitRow[]>(
		"SELECT id, name, emoji, active, sort_order, created_at FROM habits ORDER BY sort_order ASC",
	);
	return rows.map(mapHabit);
}

export async function updateHabit(
	id: string,
	updates: { name?: string; emoji?: string },
): Promise<void> {
	const d = await getDb();
	const sets: string[] = [];
	const params: unknown[] = [];
	let paramIdx = 1;

	if (updates.name !== undefined) {
		sets.push(`name = $${paramIdx}`);
		params.push(updates.name);
		paramIdx++;
	}
	if (updates.emoji !== undefined) {
		sets.push(`emoji = $${paramIdx}`);
		params.push(updates.emoji);
		paramIdx++;
	}

	if (sets.length === 0) return;

	params.push(id);
	await d.execute(
		`UPDATE habits SET ${sets.join(", ")} WHERE id = $${paramIdx}`,
		params,
	);
}

export async function archiveHabit(id: string): Promise<void> {
	const d = await getDb();
	await d.execute("UPDATE habits SET active = 0 WHERE id = $1", [id]);
}

// --- Checkins CRUD ---

export async function upsertCheckin(data: {
	checkinDate: string;
	energyLevel: number;
	focusQuality: number;
	sleepHours: number;
	mood?: number;
	notes?: string;
}): Promise<string> {
	const d = await getDb();
	const id = crypto.randomUUID();
	await d.execute(
		`INSERT INTO checkins (id, checkin_date, energy_level, focus_quality, sleep_hours, mood, notes, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		 ON CONFLICT(checkin_date) DO UPDATE SET
		   energy_level = excluded.energy_level,
		   focus_quality = excluded.focus_quality,
		   sleep_hours = excluded.sleep_hours,
		   mood = excluded.mood,
		   notes = excluded.notes,
		   updated_at = CURRENT_TIMESTAMP`,
		[
			id,
			data.checkinDate,
			data.energyLevel,
			data.focusQuality,
			data.sleepHours,
			data.mood ?? null,
			data.notes ?? null,
		],
	);

	// Return the actual id (might differ on update)
	const rows = await d.select<{ id: string }[]>(
		"SELECT id FROM checkins WHERE checkin_date = $1",
		[data.checkinDate],
	);
	return rows[0].id;
}

export async function getTodayCheckin(): Promise<CheckinWithHabits | null> {
	return getCheckinByDate(todayAsISODate());
}

export async function getCheckinByDate(
	date: string,
): Promise<CheckinWithHabits | null> {
	const d = await getDb();
	const checkinRows = await d.select<CheckinRow[]>(
		"SELECT id, checkin_date, energy_level, focus_quality, sleep_hours, mood, notes, created_at, updated_at FROM checkins WHERE checkin_date = $1",
		[date],
	);
	if (checkinRows.length === 0) return null;

	const checkin = mapCheckin(checkinRows[0]);
	const completionRows = await d.select<HabitCompletionRow[]>(
		"SELECT id, checkin_date, habit_id, completed FROM habit_completions WHERE checkin_date = $1",
		[date],
	);

	return {
		...checkin,
		habits: completionRows.map((r) => ({
			habitId: r.habit_id,
			completed: r.completed === 1,
		})),
	};
}

export async function getCheckinsLast90Days(): Promise<CheckinWithHabits[]> {
	const d = await getDb();
	const since = new Date();
	since.setDate(since.getDate() - 90);
	const sinceStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;

	const checkinRows = await d.select<CheckinRow[]>(
		"SELECT id, checkin_date, energy_level, focus_quality, sleep_hours, mood, notes, created_at, updated_at FROM checkins WHERE checkin_date >= $1 ORDER BY checkin_date DESC",
		[sinceStr],
	);

	if (checkinRows.length === 0) return [];

	const completionRows = await d.select<HabitCompletionRow[]>(
		"SELECT id, checkin_date, habit_id, completed FROM habit_completions WHERE checkin_date >= $1",
		[sinceStr],
	);

	const completionsByDate = new Map<
		string,
		{ habitId: string; completed: boolean }[]
	>();
	for (const r of completionRows) {
		const list = completionsByDate.get(r.checkin_date) ?? [];
		list.push({ habitId: r.habit_id, completed: r.completed === 1 });
		completionsByDate.set(r.checkin_date, list);
	}

	return checkinRows.map((row) => ({
		...mapCheckin(row),
		habits: completionsByDate.get(row.checkin_date) ?? [],
	}));
}

export async function getCheckinsInRange(
	sinceDate: string,
): Promise<CheckinWithHabits[]> {
	const d = await getDb();

	const checkinRows = await d.select<CheckinRow[]>(
		"SELECT id, checkin_date, energy_level, focus_quality, sleep_hours, mood, notes, created_at, updated_at FROM checkins WHERE checkin_date >= $1 ORDER BY checkin_date ASC",
		[sinceDate],
	);

	if (checkinRows.length === 0) return [];

	const completionRows = await d.select<HabitCompletionRow[]>(
		"SELECT id, checkin_date, habit_id, completed FROM habit_completions WHERE checkin_date >= $1",
		[sinceDate],
	);

	const completionsByDate = new Map<
		string,
		{ habitId: string; completed: boolean }[]
	>();
	for (const r of completionRows) {
		const list = completionsByDate.get(r.checkin_date) ?? [];
		list.push({ habitId: r.habit_id, completed: r.completed === 1 });
		completionsByDate.set(r.checkin_date, list);
	}

	return checkinRows.map((row) => ({
		...mapCheckin(row),
		habits: completionsByDate.get(row.checkin_date) ?? [],
	}));
}

// --- Habit Completions ---

export async function upsertHabitCompletion(
	checkinDate: string,
	habitId: string,
	completed: boolean,
): Promise<void> {
	const d = await getDb();
	const id = crypto.randomUUID();
	await d.execute(
		`INSERT INTO habit_completions (id, checkin_date, habit_id, completed)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT(checkin_date, habit_id) DO UPDATE SET completed = excluded.completed`,
		[id, checkinDate, habitId, completed ? 1 : 0],
	);
}

export async function getCompletionsForDate(
	date: string,
): Promise<HabitCompletion[]> {
	const d = await getDb();
	const rows = await d.select<HabitCompletionRow[]>(
		"SELECT id, checkin_date, habit_id, completed FROM habit_completions WHERE checkin_date = $1",
		[date],
	);
	return rows.map(mapHabitCompletion);
}

// --- Settings ---

export async function getSetting(key: string): Promise<string | null> {
	const d = await getDb();
	const rows = await d.select<{ value: string }[]>(
		"SELECT value FROM settings WHERE key = $1",
		[key],
	);
	return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
	const d = await getDb();
	await d.execute(
		`INSERT INTO settings (key, value) VALUES ($1, $2)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		[key, value],
	);
}
