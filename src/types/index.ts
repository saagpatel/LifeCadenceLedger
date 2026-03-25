export interface Habit {
	id: string;
	name: string;
	emoji: string;
	active: boolean;
	sortOrder: number;
	createdAt: string;
}

export interface Checkin {
	id: string;
	checkinDate: string; // 'YYYY-MM-DD'
	energyLevel: number; // 1–5
	focusQuality: number; // 1–5
	sleepHours: number;
	mood?: number; // 1–5, optional
	notes?: string; // optional
	createdAt: string;
	updatedAt: string;
}

export interface HabitCompletion {
	id: string;
	checkinDate: string;
	habitId: string;
	completed: boolean;
}

export interface CheckinWithHabits extends Checkin {
	habits: { habitId: string; completed: boolean }[];
}

export interface DailyAggregateRow {
	checkinDate: string;
	energyLevel: number;
	focusQuality: number;
	sleepHours: number;
	completedHabits: number;
	totalHabits: number;
}

export interface HabitCorrelation {
	habitId: string;
	habitName: string;
	avgEnergyWithHabit: number;
	avgEnergyWithout: number;
	avgFocusWithHabit: number;
	avgFocusWithout: number;
	sampleCount: number;
}

// --- Phase 1: Pattern Dashboard types ---

export interface TrendPoint {
	date: string;
	energy: number | null;
	focus: number | null;
	energyAvg7: number | null;
	focusAvg7: number | null;
}

export interface HabitStreakEntry {
	habitId: string;
	habitName: string;
	habitEmoji: string;
	completionsByDate: Map<string, boolean>;
	currentStreak: number;
	longestStreak: number;
}

export interface WeekSummaryDay {
	date: string;
	dayLabel: string;
	energyLevel: number | null;
	focusQuality: number | null;
	completedHabits: number;
	totalHabits: number;
	hasCheckin: boolean;
}

export interface DowAverage {
	dayLabel: string;
	dayIndex: number;
	avgEnergy: number | null;
	avgFocus: number | null;
	sampleCount: number;
}

export interface SaveCheckinInput {
	energyLevel: number;
	focusQuality: number;
	sleepHours: number;
	mood?: number;
	notes?: string;
	habitCompletions: { habitId: string; completed: boolean }[];
}
