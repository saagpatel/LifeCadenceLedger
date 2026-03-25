import { useCallback, useEffect, useState } from "react";
import { todayAsISODate } from "../lib/dates";
import {
	getCheckinsLast90Days,
	getTodayCheckin,
	upsertCheckin,
	upsertHabitCompletion,
} from "../lib/db";
import type { CheckinWithHabits, SaveCheckinInput } from "../types";

export interface UseCheckinsReturn {
	todayCheckin: CheckinWithHabits | null;
	recentCheckins: CheckinWithHabits[];
	isLoading: boolean;
	error: string | null;
	saveCheckin: (data: SaveCheckinInput) => Promise<void>;
	reloadCheckins: () => Promise<void>;
}

export function useCheckins(): UseCheckinsReturn {
	const [todayCheckin, setTodayCheckin] = useState<CheckinWithHabits | null>(
		null,
	);
	const [recentCheckins, setRecentCheckins] = useState<CheckinWithHabits[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reloadCheckins = useCallback(async () => {
		try {
			const [today, recent] = await Promise.all([
				getTodayCheckin(),
				getCheckinsLast90Days(),
			]);
			setTodayCheckin(today);
			setRecentCheckins(recent);
			setError(null);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load check-ins";
			setError(message);
			console.error("useCheckins: failed to load", err);
		}
	}, []);

	useEffect(() => {
		reloadCheckins().finally(() => setIsLoading(false));
	}, [reloadCheckins]);

	const saveCheckin = useCallback(
		async (data: SaveCheckinInput) => {
			try {
				const date = todayAsISODate();
				await upsertCheckin({
					checkinDate: date,
					energyLevel: data.energyLevel,
					focusQuality: data.focusQuality,
					sleepHours: data.sleepHours,
					mood: data.mood,
					notes: data.notes,
				});

				for (const hc of data.habitCompletions) {
					await upsertHabitCompletion(date, hc.habitId, hc.completed);
				}

				await reloadCheckins();
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to save check-in";
				setError(message);
				console.error("useCheckins: failed to save", err);
			}
		},
		[reloadCheckins],
	);

	return {
		todayCheckin,
		recentCheckins,
		isLoading,
		error,
		saveCheckin,
		reloadCheckins,
	};
}
