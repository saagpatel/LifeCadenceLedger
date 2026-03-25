import { useCallback, useEffect, useState } from "react";
import { daysAgo, parseISODate, todayAsISODate } from "../lib/dates";
import { getActiveHabits, getCheckinsInRange } from "../lib/db";
import type {
	CheckinWithHabits,
	DailyAggregateRow,
	DowAverage,
	Habit,
	HabitStreakEntry,
	TrendPoint,
	WeekSummaryDay,
} from "../types";

// --- Pure aggregation functions (exported for testing) ---

/** Generate all calendar dates from start to end inclusive as YYYY-MM-DD strings. */
export function generateDateRange(
	startDate: string,
	endDate: string,
): string[] {
	const dates: string[] = [];
	const current = parseISODate(startDate);
	const end = parseISODate(endDate);

	while (current <= end) {
		const y = current.getFullYear();
		const m = String(current.getMonth() + 1).padStart(2, "0");
		const d = String(current.getDate()).padStart(2, "0");
		dates.push(`${y}-${m}-${d}`);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

/** Build trend points with 7-day rolling average for energy and focus. */
export function buildTrendPoints(
	checkins: CheckinWithHabits[],
	sinceDate: string,
): TrendPoint[] {
	const today = todayAsISODate();
	const allDates = generateDateRange(sinceDate, today);
	const checkinMap = new Map<string, CheckinWithHabits>();
	for (const c of checkins) {
		checkinMap.set(c.checkinDate, c);
	}

	return allDates.map((date) => {
		const c = checkinMap.get(date);
		const energy = c ? c.energyLevel : null;
		const focus = c ? c.focusQuality : null;

		// 7-day rolling average (7 calendar days ending on this date)
		const windowStart = parseISODate(date);
		windowStart.setDate(windowStart.getDate() - 6);
		const windowStartStr = `${windowStart.getFullYear()}-${String(windowStart.getMonth() + 1).padStart(2, "0")}-${String(windowStart.getDate()).padStart(2, "0")}`;

		const windowCheckins: CheckinWithHabits[] = [];
		for (const d of allDates) {
			if (d >= windowStartStr && d <= date) {
				const wc = checkinMap.get(d);
				if (wc) windowCheckins.push(wc);
			}
		}

		let energyAvg7: number | null = null;
		let focusAvg7: number | null = null;

		if (windowCheckins.length >= 2) {
			energyAvg7 =
				windowCheckins.reduce((sum, wc) => sum + wc.energyLevel, 0) /
				windowCheckins.length;
			focusAvg7 =
				windowCheckins.reduce((sum, wc) => sum + wc.focusQuality, 0) /
				windowCheckins.length;
			energyAvg7 = Math.round(energyAvg7 * 100) / 100;
			focusAvg7 = Math.round(focusAvg7 * 100) / 100;
		}

		return { date, energy, focus, energyAvg7, focusAvg7 };
	});
}

/** Build habit streak data for the contribution grid. */
export function buildHabitStreaks(
	checkins: CheckinWithHabits[],
	habits: Habit[],
): HabitStreakEntry[] {
	const checkinDates = new Set(checkins.map((c) => c.checkinDate));

	// Build per-habit completion lookup: habitId → Set of completed dates
	const habitCompletedDates = new Map<string, Set<string>>();
	for (const c of checkins) {
		for (const h of c.habits) {
			if (h.completed) {
				const set = habitCompletedDates.get(h.habitId) ?? new Set();
				set.add(c.checkinDate);
				habitCompletedDates.set(h.habitId, set);
			}
		}
	}

	const today = todayAsISODate();

	return habits
		.map((habit) => {
			const completed = habitCompletedDates.get(habit.id) ?? new Set<string>();

			// Build completionsByDate map for all checkin dates
			const completionsByDate = new Map<string, boolean>();
			for (const c of checkins) {
				const hc = c.habits.find((h) => h.habitId === habit.id);
				if (hc) {
					completionsByDate.set(c.checkinDate, hc.completed);
				}
			}

			// Current streak: walk backwards from today
			let currentStreak = 0;
			const cursor = parseISODate(today);
			while (true) {
				const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;

				if (!checkinDates.has(dateStr)) {
					// No checkin on this day — if it's today and no checkin yet, check yesterday
					if (dateStr === today && currentStreak === 0) {
						cursor.setDate(cursor.getDate() - 1);
						continue;
					}
					break;
				}
				if (!completed.has(dateStr)) break;
				currentStreak++;
				cursor.setDate(cursor.getDate() - 1);
			}

			// Longest streak: forward pass through sorted dates
			let longestStreak = 0;
			let runningStreak = 0;
			const sortedDates = [...checkinDates].sort();
			let prevDate: Date | null = null;

			for (const dateStr of sortedDates) {
				const d = parseISODate(dateStr);
				const isConsecutive =
					prevDate !== null && d.getTime() - prevDate.getTime() === 86400000;

				if (completed.has(dateStr)) {
					runningStreak = isConsecutive ? runningStreak + 1 : 1;
					longestStreak = Math.max(longestStreak, runningStreak);
				} else {
					runningStreak = 0;
				}
				prevDate = d;
			}

			return {
				habitId: habit.id,
				habitName: habit.name,
				habitEmoji: habit.emoji,
				completionsByDate,
				currentStreak,
				longestStreak,
			};
		})
		.sort((a, b) => b.currentStreak - a.currentStreak);
}

/** Map checkins to scatter-friendly aggregate rows. */
export function buildScatterPoints(
	checkins: CheckinWithHabits[],
): DailyAggregateRow[] {
	return checkins.map((c) => ({
		checkinDate: c.checkinDate,
		energyLevel: c.energyLevel,
		focusQuality: c.focusQuality,
		sleepHours: c.sleepHours,
		completedHabits: c.habits.filter((h) => h.completed).length,
		totalHabits: c.habits.length,
	}));
}

/** Build day-of-week averages. Only includes weekdays with 2+ data points. */
export function buildDowAverages(checkins: CheckinWithHabits[]): DowAverage[] {
	const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	const buckets: { energySum: number; focusSum: number; count: number }[] =
		Array.from({ length: 7 }, () => ({ energySum: 0, focusSum: 0, count: 0 }));

	for (const c of checkins) {
		const d = parseISODate(c.checkinDate);
		const dowIdx = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
		buckets[dowIdx].energySum += c.energyLevel;
		buckets[dowIdx].focusSum += c.focusQuality;
		buckets[dowIdx].count++;
	}

	return buckets
		.map((b, i) => ({
			dayLabel: DOW_LABELS[i],
			dayIndex: i,
			avgEnergy:
				b.count >= 2 ? Math.round((b.energySum / b.count) * 100) / 100 : null,
			avgFocus:
				b.count >= 2 ? Math.round((b.focusSum / b.count) * 100) / 100 : null,
			sampleCount: b.count,
		}))
		.filter((d) => d.sampleCount >= 2);
}

/** Build the 7-day summary for the current ISO week (Mon–Sun). */
export function buildWeekSummary(
	checkins: CheckinWithHabits[],
	habits: Habit[],
): WeekSummaryDay[] {
	const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const today = parseISODate(todayAsISODate());
	const todayStr = todayAsISODate();

	// Find Monday of this week
	const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0
	const monday = new Date(today);
	monday.setDate(monday.getDate() - dayOfWeek);

	const checkinMap = new Map<string, CheckinWithHabits>();
	for (const c of checkins) {
		checkinMap.set(c.checkinDate, c);
	}

	const days: WeekSummaryDay[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(d.getDate() + i);
		const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

		const c = checkinMap.get(dateStr);
		const isFuture = dateStr > todayStr;

		days.push({
			date: dateStr,
			dayLabel: DOW_LABELS[i],
			energyLevel: c && !isFuture ? c.energyLevel : null,
			focusQuality: c && !isFuture ? c.focusQuality : null,
			completedHabits: c ? c.habits.filter((h) => h.completed).length : 0,
			totalHabits: c ? c.habits.length : habits.length,
			hasCheckin: !!c && !isFuture,
		});
	}

	return days;
}

// --- React Hook ---

export interface UsePatternsReturn {
	trendPoints: TrendPoint[];
	habitStreaks: HabitStreakEntry[];
	scatterPoints: DailyAggregateRow[];
	dowAverages: DowAverage[];
	weekSummary: WeekSummaryDay[];
	checkinCount: number;
	isLoading: boolean;
	error: string | null;
	reload: () => Promise<void>;
}

export function usePatterns(dateRange: 30 | 60 | 90): UsePatternsReturn {
	const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([]);
	const [habitStreaks, setHabitStreaks] = useState<HabitStreakEntry[]>([]);
	const [scatterPoints, setScatterPoints] = useState<DailyAggregateRow[]>([]);
	const [dowAverages, setDowAverages] = useState<DowAverage[]>([]);
	const [weekSummary, setWeekSummary] = useState<WeekSummaryDay[]>([]);
	const [checkinCount, setCheckinCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(async () => {
		try {
			// Fetch 90-day superset (covers all ranges)
			const allCheckins = await getCheckinsInRange(daysAgo(90));
			const habits = await getActiveHabits();

			// Slice to requested range for trend/scatter/dow
			const rangeStart = daysAgo(dateRange);
			const rangeCheckins = allCheckins.filter(
				(c) => c.checkinDate >= rangeStart,
			);

			setTrendPoints(buildTrendPoints(rangeCheckins, rangeStart));
			setHabitStreaks(buildHabitStreaks(allCheckins, habits)); // always 90 days
			setScatterPoints(buildScatterPoints(rangeCheckins));
			setDowAverages(buildDowAverages(rangeCheckins));
			setWeekSummary(buildWeekSummary(allCheckins, habits));
			setCheckinCount(rangeCheckins.length);
			setError(null);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load patterns";
			setError(message);
			console.error("usePatterns: failed to load", err);
		}
	}, [dateRange]);

	useEffect(() => {
		reload().finally(() => setIsLoading(false));
	}, [reload]);

	return {
		trendPoints,
		habitStreaks,
		scatterPoints,
		dowAverages,
		weekSummary,
		checkinCount,
		isLoading,
		error,
		reload,
	};
}
