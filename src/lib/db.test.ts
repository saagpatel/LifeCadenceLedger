import { describe, expect, it } from "vitest";
import type { CheckinRow, HabitCompletionRow, HabitRow } from "./db";
import { mapCheckin, mapHabit, mapHabitCompletion } from "./db";

describe("mapHabit", () => {
	const baseRow: HabitRow = {
		id: "abc-123",
		name: "Exercise",
		emoji: "🏃",
		active: 1,
		sort_order: 0,
		created_at: "2026-03-24 10:00:00",
	};

	it("maps active = 1 to true", () => {
		expect(mapHabit(baseRow).active).toBe(true);
	});

	it("maps active = 0 to false", () => {
		expect(mapHabit({ ...baseRow, active: 0 }).active).toBe(false);
	});

	it("maps snake_case to camelCase", () => {
		const result = mapHabit(baseRow);
		expect(result.sortOrder).toBe(0);
		expect(result.createdAt).toBe("2026-03-24 10:00:00");
	});

	it("preserves all fields", () => {
		const result = mapHabit(baseRow);
		expect(result).toEqual({
			id: "abc-123",
			name: "Exercise",
			emoji: "🏃",
			active: true,
			sortOrder: 0,
			createdAt: "2026-03-24 10:00:00",
		});
	});
});

describe("mapCheckin", () => {
	const baseRow: CheckinRow = {
		id: "chk-001",
		checkin_date: "2026-03-24",
		energy_level: 4,
		focus_quality: 3,
		sleep_hours: 7.5,
		mood: 4,
		notes: "Good day",
		created_at: "2026-03-24 08:00:00",
		updated_at: "2026-03-24 08:00:00",
	};

	it("maps all required fields", () => {
		const result = mapCheckin(baseRow);
		expect(result.checkinDate).toBe("2026-03-24");
		expect(result.energyLevel).toBe(4);
		expect(result.focusQuality).toBe(3);
		expect(result.sleepHours).toBe(7.5);
	});

	it("maps null mood to undefined", () => {
		const result = mapCheckin({ ...baseRow, mood: null });
		expect(result.mood).toBeUndefined();
	});

	it("maps null notes to undefined", () => {
		const result = mapCheckin({ ...baseRow, notes: null });
		expect(result.notes).toBeUndefined();
	});

	it("preserves mood when present", () => {
		const result = mapCheckin(baseRow);
		expect(result.mood).toBe(4);
	});

	it("preserves notes when present", () => {
		const result = mapCheckin(baseRow);
		expect(result.notes).toBe("Good day");
	});
});

describe("mapHabitCompletion", () => {
	const baseRow: HabitCompletionRow = {
		id: "hc-001",
		checkin_date: "2026-03-24",
		habit_id: "hab-001",
		completed: 1,
	};

	it("maps completed = 1 to true", () => {
		expect(mapHabitCompletion(baseRow).completed).toBe(true);
	});

	it("maps completed = 0 to false", () => {
		expect(mapHabitCompletion({ ...baseRow, completed: 0 }).completed).toBe(
			false,
		);
	});

	it("maps snake_case to camelCase", () => {
		const result = mapHabitCompletion(baseRow);
		expect(result.checkinDate).toBe("2026-03-24");
		expect(result.habitId).toBe("hab-001");
	});
});
