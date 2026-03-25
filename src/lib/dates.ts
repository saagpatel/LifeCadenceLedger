/** Returns today's date as 'YYYY-MM-DD' in local time. */
export function todayAsISODate(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parses 'YYYY-MM-DD' into a Date at midnight local time (no timezone shift). */
export function parseISODate(s: string): Date {
	return new Date(s + "T00:00:00");
}

/** Formats 'YYYY-MM-DD' as e.g. "Mon, Mar 24" for display. */
export function formatDisplayDate(s: string): string {
	const d = parseISODate(s);
	return d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

/** Returns the ISO date string for `n` days before today. */
export function daysAgo(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns true if the given ISO date string is today. */
export function isToday(isoDate: string): boolean {
	return isoDate === todayAsISODate();
}
