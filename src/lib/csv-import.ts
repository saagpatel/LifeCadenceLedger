import Papa from "papaparse";
import { upsertCheckin } from "./db";

// --- Types ---

export type CsvRow = {
	date: string;
	energy: number;
	focus: number;
	sleepHours: number;
	notes?: string;
};

export type CsvRowError = {
	rowNumber: number;
	raw: Record<string, string>;
	reason: string;
};

export type CsvParseResult = {
	valid: CsvRow[];
	errors: CsvRowError[];
};

export type CsvImportResult = {
	imported: number;
	skipped: number;
	errors: CsvRowError[];
};

// --- Header normalization ---

const HEADER_ALIASES: Record<string, string> = {
	date: "date",
	energy: "energy",
	energy_level: "energy",
	focus: "focus",
	focus_quality: "focus",
	sleep_hours: "sleep_hours",
	sleep: "sleep_hours",
	notes: "notes",
	note: "notes",
};

function normalizeHeader(raw: string): string {
	const key = raw.toLowerCase().replace(/\s+/g, "_").trim();
	return HEADER_ALIASES[key] ?? key;
}

// --- Validation ---

function isValidDate(s: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const d = new Date(s + "T00:00:00");
	return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

function isBlankRow(row: Record<string, string>): boolean {
	return Object.values(row).every((v) => !v || v.trim() === "");
}

// --- Pure parse + validate (exported for testing) ---

export function parseAndValidateCsv(rawText: string): CsvParseResult {
	const parsed = Papa.parse<Record<string, string>>(rawText, {
		header: true,
		skipEmptyLines: true,
	});

	if (!parsed.data.length) {
		return { valid: [], errors: [] };
	}

	// Normalize headers
	const headerMap = new Map<string, string>();
	const originalHeaders = parsed.meta.fields ?? [];
	for (const h of originalHeaders) {
		headerMap.set(normalizeHeader(h), h);
	}

	// Check required columns
	const missingCols: string[] = [];
	if (!headerMap.has("date")) missingCols.push("date");
	if (!headerMap.has("energy")) missingCols.push("energy");
	if (!headerMap.has("focus")) missingCols.push("focus");

	if (missingCols.length > 0) {
		return {
			valid: [],
			errors: parsed.data
				.filter((row) => !isBlankRow(row))
				.map((row, i) => ({
					rowNumber: i + 2,
					raw: row,
					reason: `Missing required column: ${missingCols.join(", ")}`,
				})),
		};
	}

	const valid: CsvRow[] = [];
	const errors: CsvRowError[] = [];

	for (let i = 0; i < parsed.data.length; i++) {
		const raw = parsed.data[i];
		if (isBlankRow(raw)) continue;

		const rowNumber = i + 2; // 1-indexed, skip header
		const getVal = (normalized: string): string =>
			raw[headerMap.get(normalized) ?? ""]?.trim() ?? "";

		// Date
		const dateVal = getVal("date");
		if (!isValidDate(dateVal)) {
			errors.push({ rowNumber, raw, reason: `Invalid date: "${dateVal}"` });
			continue;
		}

		// Energy
		const energyRaw = getVal("energy");
		const energy = Number(energyRaw);
		if (!Number.isInteger(energy) || energy < 1 || energy > 5) {
			errors.push({
				rowNumber,
				raw,
				reason: `Energy must be integer 1-5, got "${energyRaw}"`,
			});
			continue;
		}

		// Focus
		const focusRaw = getVal("focus");
		const focus = Number(focusRaw);
		if (!Number.isInteger(focus) || focus < 1 || focus > 5) {
			errors.push({
				rowNumber,
				raw,
				reason: `Focus must be integer 1-5, got "${focusRaw}"`,
			});
			continue;
		}

		// Sleep hours (optional column — default to 0 if missing)
		let sleepHours = 0;
		if (headerMap.has("sleep_hours")) {
			const sleepRaw = getVal("sleep_hours");
			if (sleepRaw) {
				sleepHours = Number(sleepRaw);
				if (Number.isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24) {
					errors.push({
						rowNumber,
						raw,
						reason: `Sleep hours must be 0-24, got "${sleepRaw}"`,
					});
					continue;
				}
			}
		}

		// Notes (optional)
		const notesRaw = headerMap.has("notes") ? getVal("notes") : "";
		const notes = notesRaw || undefined;

		valid.push({ date: dateVal, energy, focus, sleepHours, notes });
	}

	return { valid, errors };
}

// --- Tauri integration (not unit testable) ---

export async function importCsvFromText(
	rawText: string,
): Promise<CsvImportResult> {
	const { valid, errors } = parseAndValidateCsv(rawText);

	let imported = 0;
	for (const row of valid) {
		await upsertCheckin({
			checkinDate: row.date,
			energyLevel: row.energy,
			focusQuality: row.focus,
			sleepHours: row.sleepHours,
			notes: row.notes,
		});
		imported++;
	}

	return { imported, skipped: errors.length, errors };
}
