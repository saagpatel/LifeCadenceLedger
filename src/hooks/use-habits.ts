import { useCallback, useEffect, useState } from "react";
import {
	archiveHabit,
	createHabit,
	getActiveHabits,
	updateHabit,
} from "../lib/db";
import type { Habit } from "../types";

export interface UseHabitsReturn {
	habits: Habit[];
	isLoading: boolean;
	error: string | null;
	addHabit: (name: string, emoji?: string) => Promise<void>;
	editHabit: (
		id: string,
		updates: { name?: string; emoji?: string },
	) => Promise<void>;
	removeHabit: (id: string) => Promise<void>;
	reloadHabits: () => Promise<void>;
}

export function useHabits(): UseHabitsReturn {
	const [habits, setHabits] = useState<Habit[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const reloadHabits = useCallback(async () => {
		try {
			const result = await getActiveHabits();
			setHabits(result);
			setError(null);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to load habits";
			setError(message);
			console.error("useHabits: failed to load", err);
		}
	}, []);

	useEffect(() => {
		reloadHabits().finally(() => setIsLoading(false));
	}, [reloadHabits]);

	const addHabit = useCallback(
		async (name: string, emoji?: string) => {
			try {
				await createHabit(name, emoji);
				await reloadHabits();
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to add habit";
				setError(message);
				console.error("useHabits: failed to add", err);
			}
		},
		[reloadHabits],
	);

	const editHabit = useCallback(
		async (id: string, updates: { name?: string; emoji?: string }) => {
			try {
				await updateHabit(id, updates);
				await reloadHabits();
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to update habit";
				setError(message);
				console.error("useHabits: failed to update", err);
			}
		},
		[reloadHabits],
	);

	const removeHabit = useCallback(
		async (id: string) => {
			try {
				await archiveHabit(id);
				await reloadHabits();
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to archive habit";
				setError(message);
				console.error("useHabits: failed to archive", err);
			}
		},
		[reloadHabits],
	);

	return {
		habits,
		isLoading,
		error,
		addHabit,
		editHabit,
		removeHabit,
		reloadHabits,
	};
}
