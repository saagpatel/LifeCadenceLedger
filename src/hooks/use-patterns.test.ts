import { describe, expect, it } from "vitest";
import type { CheckinWithHabits, Habit } from "../types";
import {
	buildDowAverages,
	buildHabitStreaks,
	buildScatterPoints,
	buildTrendPoints,
	buildWeekSummary,
	generateDateRange,
} from "./use-patterns";

// --- Test Helpers ---

function makeCheckin(
	date: string,
	overrides: Partial<CheckinWithHabits> = {},
): CheckinWithHabits {
	return {
		id: `chk-${date}`,
		checkinDate: date,
		energyLevel: 3,
		focusQuality: 3,
		sleepHours: 7,
		createdAt: `${date} 08:00:00`,
		updatedAt: `${date} 08:00:00`,
		habits: [],
		...overrides,
	};
}

function makeHabit(id: string, name: string, emoji = "✅"): Habit {
	return {
		id,
		name,
		emoji,
		active: true,
		sortOrder: 0,
		createdAt: "2026-01-01 00:00:00",
	};
}

// --- generateDateRange ---

describe("generateDateRange", () => {
	it("generates dates from start to end inclusive", () => {
		const dates = generateDateRange("2026-03-01", "2026-03-05");
		expect(dates).toEqual([
			"2026-03-01",
			"2026-03-02",
			"2026-03-03",
			"2026-03-04",
			"2026-03-05",
		]);
	});

	it("handles single day range", () => {
		const dates = generateDateRange("2026-03-15", "2026-03-15");
		expect(dates).toEqual(["2026-03-15"]);
	});

	it("handles month boundary", () => {
		const dates = generateDateRange("2026-02-27", "2026-03-02");
		expect(dates).toHaveLength(4);
		expect(dates[0]).toBe("2026-02-27");
		expect(dates[3]).toBe("2026-03-02");
	});
});

// --- buildTrendPoints ---

describe("buildTrendPoints", () => {
	it("returns all nulls for 0 checkins", () => {
		const points = buildTrendPoints([], "2026-03-20");
		expect(points.length).toBeGreaterThan(0);
		for (const p of points) {
			expect(p.energy).toBeNull();
			expect(p.focus).toBeNull();
			expect(p.energyAvg7).toBeNull();
			expect(p.focusAvg7).toBeNull();
		}
	});

	it("fills raw values for checkin days", () => {
		const checkins = [
			makeCheckin("2026-03-20", { energyLevel: 4, focusQuality: 5 }),
		];
		const points = buildTrendPoints(checkins, "2026-03-18");
		const mar20 = points.find((p) => p.date === "2026-03-20");
		expect(mar20?.energy).toBe(4);
		expect(mar20?.focus).toBe(5);
	});

	it("leaves gaps for missing days", () => {
		const checkins = [
			makeCheckin("2026-03-18", { energyLevel: 4, focusQuality: 3 }),
			makeCheckin("2026-03-20", { energyLevel: 2, focusQuality: 5 }),
		];
		const points = buildTrendPoints(checkins, "2026-03-18");
		const mar19 = points.find((p) => p.date === "2026-03-19");
		expect(mar19?.energy).toBeNull();
		expect(mar19?.focus).toBeNull();
	});

	it("computes rolling average with 2+ data points", () => {
		// 3 consecutive days — avg should appear from day 2 onward
		const checkins = [
			makeCheckin("2026-03-10", { energyLevel: 2, focusQuality: 4 }),
			makeCheckin("2026-03-11", { energyLevel: 4, focusQuality: 2 }),
			makeCheckin("2026-03-12", { energyLevel: 3, focusQuality: 3 }),
		];
		const points = buildTrendPoints(checkins, "2026-03-10");

		const day1 = points.find((p) => p.date === "2026-03-10");
		expect(day1?.energyAvg7).toBeNull(); // only 1 data point

		const day2 = points.find((p) => p.date === "2026-03-11");
		expect(day2?.energyAvg7).toBe(3); // avg(2, 4) = 3

		const day3 = points.find((p) => p.date === "2026-03-12");
		expect(day3?.energyAvg7).toBe(3); // avg(2, 4, 3) = 3
	});

	it("rolling average does not include days outside the 7-day window", () => {
		const checkins = [
			makeCheckin("2026-03-01", { energyLevel: 5, focusQuality: 5 }),
			// 8-day gap — beyond the 7-day window
			makeCheckin("2026-03-10", { energyLevel: 1, focusQuality: 1 }),
		];
		const points = buildTrendPoints(checkins, "2026-03-01");
		const mar10 = points.find((p) => p.date === "2026-03-10");
		// Only 1 data point in the [Mar 4 .. Mar 10] window → null
		expect(mar10?.energyAvg7).toBeNull();
	});
});

// --- buildHabitStreaks ---

describe("buildHabitStreaks", () => {
	const habit = makeHabit("h1", "Exercise", "🏃");

	it("returns streak 0 for 0 checkins", () => {
		const streaks = buildHabitStreaks([], [habit]);
		expect(streaks).toHaveLength(1);
		expect(streaks[0].currentStreak).toBe(0);
		expect(streaks[0].longestStreak).toBe(0);
	});

	it("computes longest streak from forward pass", () => {
		const checkins = [
			makeCheckin("2026-03-01", {
				habits: [{ habitId: "h1", completed: true }],
			}),
			makeCheckin("2026-03-02", {
				habits: [{ habitId: "h1", completed: true }],
			}),
			makeCheckin("2026-03-03", {
				habits: [{ habitId: "h1", completed: true }],
			}),
			makeCheckin("2026-03-04", {
				habits: [{ habitId: "h1", completed: false }],
			}),
		];
		const streaks = buildHabitStreaks(checkins, [habit]);
		expect(streaks[0].longestStreak).toBe(3);
	});

	it("breaks streak on uncompleted day", () => {
		const checkins = [
			makeCheckin("2026-03-01", {
				habits: [{ habitId: "h1", completed: true }],
			}),
			makeCheckin("2026-03-02", {
				habits: [{ habitId: "h1", completed: false }],
			}),
			makeCheckin("2026-03-03", {
				habits: [{ habitId: "h1", completed: true }],
			}),
		];
		const streaks = buildHabitStreaks(checkins, [habit]);
		expect(streaks[0].longestStreak).toBe(1);
	});

	it("sorts by current streak descending", () => {
		const h1 = makeHabit("h1", "A");
		const h2 = makeHabit("h2", "B");
		// h2 has a longer current streak
		const today = new Date();
		const fmt = (d: Date) =>
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		const todayStr = fmt(today);
		const yesterdayDate = new Date(today);
		yesterdayDate.setDate(yesterdayDate.getDate() - 1);
		const yesterdayStr = fmt(yesterdayDate);

		const checkins = [
			makeCheckin(yesterdayStr, {
				habits: [
					{ habitId: "h1", completed: false },
					{ habitId: "h2", completed: true },
				],
			}),
			makeCheckin(todayStr, {
				habits: [
					{ habitId: "h1", completed: true },
					{ habitId: "h2", completed: true },
				],
			}),
		];
		const streaks = buildHabitStreaks(checkins, [h1, h2]);
		expect(streaks[0].habitId).toBe("h2"); // streak 2
		expect(streaks[1].habitId).toBe("h1"); // streak 1
	});
});

// --- buildScatterPoints ---

describe("buildScatterPoints", () => {
	it("maps fields correctly", () => {
		const checkins = [
			makeCheckin("2026-03-15", {
				energyLevel: 4,
				focusQuality: 3,
				sleepHours: 8,
				habits: [
					{ habitId: "h1", completed: true },
					{ habitId: "h2", completed: false },
				],
			}),
		];
		const points = buildScatterPoints(checkins);
		expect(points).toHaveLength(1);
		expect(points[0]).toEqual({
			checkinDate: "2026-03-15",
			energyLevel: 4,
			focusQuality: 3,
			sleepHours: 8,
			completedHabits: 1,
			totalHabits: 2,
		});
	});

	it("returns empty array for no checkins", () => {
		expect(buildScatterPoints([])).toEqual([]);
	});
});

// --- buildDowAverages ---

describe("buildDowAverages", () => {
	it("excludes weekdays with < 2 samples", () => {
		// Single checkin on a Monday
		const checkins = [
			makeCheckin("2026-03-16", { energyLevel: 4, focusQuality: 3 }), // Monday
		];
		const avgs = buildDowAverages(checkins);
		expect(avgs).toHaveLength(0);
	});

	it("includes weekdays with 2+ samples", () => {
		const checkins = [
			makeCheckin("2026-03-16", { energyLevel: 4, focusQuality: 2 }), // Monday
			makeCheckin("2026-03-23", { energyLevel: 2, focusQuality: 4 }), // Monday
		];
		const avgs = buildDowAverages(checkins);
		expect(avgs).toHaveLength(1);
		expect(avgs[0].dayLabel).toBe("Mon");
		expect(avgs[0].avgEnergy).toBe(3); // (4+2)/2
		expect(avgs[0].avgFocus).toBe(3); // (2+4)/2
		expect(avgs[0].sampleCount).toBe(2);
	});

	it("normalizes day-of-week correctly (Mon=0, Sun=6)", () => {
		const checkins = [
			makeCheckin("2026-03-15", { energyLevel: 5, focusQuality: 5 }), // Sunday
			makeCheckin("2026-03-22", { energyLevel: 5, focusQuality: 5 }), // Sunday
		];
		const avgs = buildDowAverages(checkins);
		expect(avgs[0].dayLabel).toBe("Sun");
		expect(avgs[0].dayIndex).toBe(6);
	});
});

// --- buildWeekSummary ---

describe("buildWeekSummary", () => {
	it("returns exactly 7 days", () => {
		const days = buildWeekSummary([], []);
		expect(days).toHaveLength(7);
		expect(days[0].dayLabel).toBe("Mon");
		expect(days[6].dayLabel).toBe("Sun");
	});

	it("marks days with checkins as hasCheckin", () => {
		// Create a checkin for today
		const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
		const checkins = [
			makeCheckin(todayStr, { energyLevel: 4, focusQuality: 5 }),
		];
		const days = buildWeekSummary(checkins, []);
		const todayEntry = days.find((d) => d.date === todayStr);
		expect(todayEntry?.hasCheckin).toBe(true);
		expect(todayEntry?.energyLevel).toBe(4);
	});

	it("marks days without checkins", () => {
		const days = buildWeekSummary([], []);
		for (const day of days) {
			expect(day.hasCheckin).toBe(false);
			expect(day.energyLevel).toBeNull();
		}
	});
});
