import { describe, expect, it } from "vitest";
import {
	daysAgo,
	formatDisplayDate,
	isToday,
	parseISODate,
	todayAsISODate,
} from "./dates";

describe("todayAsISODate", () => {
	it("returns YYYY-MM-DD format", () => {
		const result = todayAsISODate();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("matches Date components", () => {
		const now = new Date();
		const result = todayAsISODate();
		const [year, month, day] = result.split("-").map(Number);
		expect(year).toBe(now.getFullYear());
		expect(month).toBe(now.getMonth() + 1);
		expect(day).toBe(now.getDate());
	});
});

describe("parseISODate", () => {
	it("parses a date at midnight local time", () => {
		const d = parseISODate("2026-03-15");
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(2); // March = 2
		expect(d.getDate()).toBe(15);
		expect(d.getHours()).toBe(0);
		expect(d.getMinutes()).toBe(0);
	});

	it("does not shift timezone for edge dates", () => {
		const d = parseISODate("2026-01-01");
		expect(d.getDate()).toBe(1);
		expect(d.getMonth()).toBe(0);
	});
});

describe("formatDisplayDate", () => {
	it("formats as weekday, month day", () => {
		// 2026-03-15 is a Sunday
		const result = formatDisplayDate("2026-03-15");
		expect(result).toContain("Sun");
		expect(result).toContain("Mar");
		expect(result).toContain("15");
	});

	it("handles month boundaries", () => {
		const result = formatDisplayDate("2026-02-28");
		expect(result).toContain("Feb");
		expect(result).toContain("28");
	});
});

describe("daysAgo", () => {
	it("returns today for 0 days ago", () => {
		expect(daysAgo(0)).toBe(todayAsISODate());
	});

	it("returns correct format for 90 days ago", () => {
		const result = daysAgo(90);
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		// Verify it's approximately 90 days ago (DST can shift by ±1 day in ms calculation)
		const d = parseISODate(result);
		const today = parseISODate(todayAsISODate());
		const diffMs = today.getTime() - d.getTime();
		const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
		expect(diffDays).toBe(90);
	});
});

describe("isToday", () => {
	it("returns true for today", () => {
		expect(isToday(todayAsISODate())).toBe(true);
	});

	it("returns false for yesterday", () => {
		expect(isToday(daysAgo(1))).toBe(false);
	});

	it("returns false for a fixed past date", () => {
		expect(isToday("2020-01-01")).toBe(false);
	});
});
