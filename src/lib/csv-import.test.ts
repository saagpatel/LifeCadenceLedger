import { describe, expect, it } from "vitest";
import { parseAndValidateCsv } from "./csv-import";

describe("parseAndValidateCsv", () => {
	describe("happy path", () => {
		it("parses valid 5-column CSV", () => {
			const csv = `date,energy,focus,sleep_hours,notes
2026-03-01,4,3,7.5,Good day
2026-03-02,3,4,8,
2026-03-03,5,5,6.5,Great focus`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(3);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0]).toEqual({
				date: "2026-03-01",
				energy: 4,
				focus: 3,
				sleepHours: 7.5,
				notes: "Good day",
			});
		});

		it("accepts 3-column minimum (date,energy,focus) with sleep defaulting to 0", () => {
			const csv = `date,energy,focus
2026-03-01,4,3
2026-03-02,3,4`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(2);
			expect(result.valid[0].sleepHours).toBe(0);
			expect(result.valid[0].notes).toBeUndefined();
		});

		it("accepts header aliases (energy_level, focus_quality)", () => {
			const csv = `date,energy_level,focus_quality,sleep_hours
2026-03-01,4,3,7`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(1);
			expect(result.valid[0].energy).toBe(4);
			expect(result.valid[0].focus).toBe(3);
		});

		it("accepts float sleep hours", () => {
			const csv = `date,energy,focus,sleep_hours
2026-03-01,3,3,7.5`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid[0].sleepHours).toBe(7.5);
		});

		it("treats empty notes as undefined", () => {
			const csv = `date,energy,focus,notes
2026-03-01,3,3,`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid[0].notes).toBeUndefined();
		});

		it("handles normalized headers with spaces and mixed case", () => {
			const csv = `Date,Energy Level,Focus Quality,Sleep Hours,Notes
2026-03-01,4,3,7,Test`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(1);
			expect(result.valid[0].energy).toBe(4);
		});
	});

	describe("validation errors", () => {
		it("rejects energy = 0", () => {
			const csv = `date,energy,focus
2026-03-01,0,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(0);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].reason).toContain("Energy must be integer 1-5");
		});

		it("rejects energy = 6", () => {
			const csv = `date,energy,focus
2026-03-01,6,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.errors).toHaveLength(1);
		});

		it("rejects non-integer energy", () => {
			const csv = `date,energy,focus
2026-03-01,2.5,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].reason).toContain("Energy must be integer 1-5");
		});

		it("rejects sleep_hours below 0", () => {
			const csv = `date,energy,focus,sleep_hours
2026-03-01,3,3,-1`;

			const result = parseAndValidateCsv(csv);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].reason).toContain("Sleep hours must be 0-24");
		});

		it("rejects sleep_hours above 24", () => {
			const csv = `date,energy,focus,sleep_hours
2026-03-01,3,3,25`;

			const result = parseAndValidateCsv(csv);
			expect(result.errors).toHaveLength(1);
		});

		it("rejects wrong date format", () => {
			const csv = `date,energy,focus
03/24/2026,3,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].reason).toContain("Invalid date");
		});

		it("rejects invalid calendar date", () => {
			const csv = `date,energy,focus
2026-02-31,3,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].reason).toContain("Invalid date");
		});
	});

	describe("edge cases", () => {
		it("returns empty for header-only CSV", () => {
			const csv = "date,energy,focus,sleep_hours,notes\n";
			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(0);
			expect(result.errors).toHaveLength(0);
		});

		it("skips blank rows silently", () => {
			const csv = `date,energy,focus
2026-03-01,3,3

2026-03-02,4,4`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(2);
			expect(result.errors).toHaveLength(0);
		});

		it("allows duplicate dates (DB handles dedup)", () => {
			const csv = `date,energy,focus
2026-03-01,3,3
2026-03-01,4,4`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(2);
		});

		it("handles BOM prefix", () => {
			const csv = `\uFEFFdate,energy,focus
2026-03-01,3,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(1);
		});

		it("handles CRLF line endings", () => {
			const csv = "date,energy,focus\r\n2026-03-01,3,3\r\n2026-03-02,4,4\r\n";

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(2);
		});
	});

	describe("missing columns", () => {
		it("errors all rows when required column is missing", () => {
			const csv = `date,focus
2026-03-01,3
2026-03-02,4`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(0);
			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].reason).toContain(
				"Missing required column: energy",
			);
		});

		it("errors on completely wrong headers", () => {
			const csv = `foo,bar,baz
1,2,3`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(0);
			expect(result.errors[0].reason).toContain("Missing required column");
		});
	});

	describe("mixed valid and invalid rows", () => {
		it("imports valid rows and collects errors separately", () => {
			const csv = `date,energy,focus,sleep_hours
2026-03-01,4,3,7
2026-03-02,0,3,7
2026-03-03,3,4,8`;

			const result = parseAndValidateCsv(csv);
			expect(result.valid).toHaveLength(2);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].rowNumber).toBe(3); // row 2 in data = row 3 counting header
		});
	});
});
