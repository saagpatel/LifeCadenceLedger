/**
 * Seed the Life Cadence Ledger database with synthetic data.
 *
 * Usage:
 *   npx tsx scripts/seed-db.ts           # seed 30 days + 3 habits
 *   npx tsx scripts/seed-db.ts --days 60 # seed 60 days
 *   npx tsx scripts/seed-db.ts --clear   # clear all data
 */

import Database from "better-sqlite3";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DB_PATH = join(
	homedir(),
	"Library/Application Support/com.lifecadenceledger.app/life-cadence-ledger.db",
);

function parseArgs(): { days: number; clear: boolean } {
	const args = process.argv.slice(2);
	let days = 30;
	let clear = false;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--days" && args[i + 1]) {
			days = parseInt(args[i + 1], 10);
			i++;
		}
		if (args[i] === "--clear") {
			clear = true;
		}
	}

	return { days, clear };
}

function randomBetween(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

function formatDate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function main() {
	const { days, clear } = parseArgs();

	if (!existsSync(DB_PATH)) {
		console.error(`Database not found at: ${DB_PATH}`);
		console.error("Run the app once first to create the database.");
		process.exit(1);
	}

	const db = new Database(DB_PATH);

	if (clear) {
		db.exec("DELETE FROM habit_completions");
		db.exec("DELETE FROM checkins");
		db.exec("DELETE FROM habits");
		console.log("Cleared all data.");
		db.close();
		return;
	}

	// Ensure default habits exist
	const DEFAULT_HABITS = [
		{ name: "Exercise", emoji: "🏃", rate: 0.7 },
		{ name: "Meditation", emoji: "🧘", rate: 0.5 },
		{ name: "Reading", emoji: "📚", rate: 0.6 },
	];

	const existingHabits = db
		.prepare("SELECT id, name FROM habits WHERE active = 1")
		.all() as { id: string; name: string }[];

	const habitIds: { id: string; rate: number }[] = [];

	for (const h of DEFAULT_HABITS) {
		const existing = existingHabits.find((e) => e.name === h.name);
		if (existing) {
			habitIds.push({ id: existing.id, rate: h.rate });
		} else {
			const id = crypto.randomUUID();
			db.prepare(
				"INSERT INTO habits (id, name, emoji, sort_order) VALUES (?, ?, ?, ?)",
			).run(id, h.name, h.emoji, habitIds.length);
			habitIds.push({ id, rate: h.rate });
			console.log(`Created habit: ${h.emoji} ${h.name}`);
		}
	}

	// Generate checkins
	const insertCheckin = db.prepare(
		`INSERT OR REPLACE INTO checkins (id, checkin_date, energy_level, focus_quality, sleep_hours, mood, notes, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
	);

	const insertCompletion = db.prepare(
		`INSERT OR REPLACE INTO habit_completions (id, checkin_date, habit_id, completed)
		 VALUES (?, ?, ?, ?)`,
	);

	let created = 0;
	const today = new Date();

	for (let i = days - 1; i >= 0; i--) {
		// Skip ~8% of days to create gaps
		if (Math.random() < 0.08 && i > 0) continue;

		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const dateStr = formatDate(d);

		// Energy: sine wave (weekly rhythm) + noise, biased higher on weekdays
		const dayOfWeek = d.getDay();
		const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
		const weekCycle = Math.sin((i / 7) * Math.PI * 2) * 0.8;
		const energyBase = isWeekday ? 3.2 : 2.8;
		const energy = clamp(
			Math.round(energyBase + weekCycle + randomBetween(-1, 1)),
			1,
			5,
		);

		// Sleep: normal-ish around 7h, weekends slightly more
		const sleepBase = isWeekday ? 6.8 : 7.5;
		const sleep = Math.round((sleepBase + randomBetween(-1.5, 1.5)) * 2) / 2;
		const sleepClamped = clamp(sleep, 4, 10);

		// Focus: loosely correlated with sleep
		const focusFromSleep = sleepClamped > 7 ? 0.5 : sleepClamped < 6 ? -0.5 : 0;
		const focus = clamp(
			Math.round(3 + focusFromSleep + randomBetween(-1, 1)),
			1,
			5,
		);

		// Mood: occasionally filled (~60% of the time)
		const mood =
			Math.random() < 0.6
				? clamp(Math.round(3 + randomBetween(-1.5, 1.5)), 1, 5)
				: null;

		const checkinId = crypto.randomUUID();
		insertCheckin.run(
			checkinId,
			dateStr,
			energy,
			focus,
			sleepClamped,
			mood,
			null, // no notes for synthetic data
		);

		// Habit completions
		for (const h of habitIds) {
			const completed = Math.random() < h.rate ? 1 : 0;
			insertCompletion.run(crypto.randomUUID(), dateStr, h.id, completed);
		}

		created++;
	}

	db.close();
	console.log(
		`Seeded ${created} check-ins over ${days} days with ${habitIds.length} habits.`,
	);
}

main();
