import { useCallback, useEffect, useState } from "react";
import type { CheckinWithHabits, Habit, SaveCheckinInput } from "../types";

interface Props {
	habits: Habit[];
	todayCheckin: CheckinWithHabits | null;
	onSave: (data: SaveCheckinInput) => Promise<void>;
}

const LEVELS = [1, 2, 3, 4, 5] as const;

function LevelSelector({
	label,
	value,
	onChange,
	color,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	color: string;
}) {
	return (
		<div className="mb-5">
			<label
				className="block text-xs font-light tracking-widest uppercase mb-2"
				style={{ color: "var(--color-text-muted)" }}
			>
				{label}
			</label>
			<div className="flex gap-2">
				{LEVELS.map((level) => (
					<button
						key={level}
						type="button"
						onClick={() => onChange(level)}
						className="flex-1 h-11 rounded-lg text-sm font-bold transition-all duration-150"
						style={{
							backgroundColor: value === level ? color : "var(--color-surface)",
							color:
								value === level ? "var(--color-bg)" : "var(--color-text-muted)",
							border: `1px solid ${value === level ? color : "var(--color-border)"}`,
						}}
					>
						{level}
					</button>
				))}
			</div>
		</div>
	);
}

function SleepInput({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="mb-5">
			<label
				className="block text-xs font-light tracking-widest uppercase mb-2"
				style={{ color: "var(--color-text-muted)" }}
			>
				Sleep Hours
			</label>
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => onChange(Math.max(0, value - 0.5))}
					className="w-11 h-11 rounded-lg text-lg font-bold transition-colors duration-150"
					style={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						color: "var(--color-text)",
					}}
				>
					−
				</button>
				<span
					className="flex-1 text-center text-2xl font-bold"
					style={{ color: "var(--color-sleep)" }}
				>
					{value.toFixed(1)}
				</span>
				<button
					type="button"
					onClick={() => onChange(Math.min(24, value + 0.5))}
					className="w-11 h-11 rounded-lg text-lg font-bold transition-colors duration-150"
					style={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						color: "var(--color-text)",
					}}
				>
					+
				</button>
			</div>
		</div>
	);
}

export function CheckInForm({ habits, todayCheckin, onSave }: Props) {
	const [energyLevel, setEnergyLevel] = useState(3);
	const [focusQuality, setFocusQuality] = useState(3);
	const [sleepHours, setSleepHours] = useState(7.0);
	const [mood, setMood] = useState<number | undefined>(undefined);
	const [notes, setNotes] = useState("");
	const [completions, setCompletions] = useState<Map<string, boolean>>(
		new Map(),
	);
	const [showOptional, setShowOptional] = useState(false);
	const [saving, setSaving] = useState(false);

	// Pre-fill from today's checkin
	useEffect(() => {
		if (todayCheckin) {
			setEnergyLevel(todayCheckin.energyLevel);
			setFocusQuality(todayCheckin.focusQuality);
			setSleepHours(todayCheckin.sleepHours);
			setMood(todayCheckin.mood);
			setNotes(todayCheckin.notes ?? "");
			if (todayCheckin.mood || todayCheckin.notes) {
				setShowOptional(true);
			}

			const map = new Map<string, boolean>();
			for (const h of todayCheckin.habits) {
				map.set(h.habitId, h.completed);
			}
			setCompletions(map);
		}
	}, [todayCheckin]);

	// Initialize new habits that aren't in existing completions
	useEffect(() => {
		setCompletions((prev) => {
			const next = new Map(prev);
			for (const h of habits) {
				if (!next.has(h.id)) {
					next.set(h.id, false);
				}
			}
			return next;
		});
	}, [habits]);

	const toggleHabit = useCallback((habitId: string) => {
		setCompletions((prev) => {
			const next = new Map(prev);
			next.set(habitId, !prev.get(habitId));
			return next;
		});
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			await onSave({
				energyLevel,
				focusQuality,
				sleepHours,
				mood,
				notes: notes.trim() || undefined,
				habitCompletions: habits.map((h) => ({
					habitId: h.id,
					completed: completions.get(h.id) ?? false,
				})),
			});
		} finally {
			setSaving(false);
		}
	};

	const isEditing = todayCheckin !== null;

	return (
		<div className="flex-1 overflow-y-auto px-5 py-6">
			<h2
				className="text-xl font-bold mb-6"
				style={{ color: "var(--color-text)" }}
			>
				{isEditing ? "Update Today's Check-in" : "Daily Check-in"}
			</h2>

			<LevelSelector
				label="Energy"
				value={energyLevel}
				onChange={setEnergyLevel}
				color="var(--color-energy)"
			/>

			<LevelSelector
				label="Focus"
				value={focusQuality}
				onChange={setFocusQuality}
				color="var(--color-focus)"
			/>

			<SleepInput value={sleepHours} onChange={setSleepHours} />

			{habits.length > 0 && (
				<div className="mb-5">
					<label
						className="block text-xs font-light tracking-widest uppercase mb-2"
						style={{ color: "var(--color-text-muted)" }}
					>
						Habits
					</label>
					<div className="flex flex-wrap gap-2">
						{habits.map((h) => {
							const done = completions.get(h.id) ?? false;
							return (
								<button
									key={h.id}
									type="button"
									onClick={() => toggleHabit(h.id)}
									className="px-3 py-2 rounded-full text-sm font-medium transition-all duration-150"
									style={{
										backgroundColor: done
											? "var(--color-success)"
											: "var(--color-surface)",
										color: done ? "var(--color-bg)" : "var(--color-text-muted)",
										border: `1px solid ${done ? "var(--color-success)" : "var(--color-border)"}`,
									}}
								>
									{h.emoji} {h.name}
								</button>
							);
						})}
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => setShowOptional(!showOptional)}
				className="text-xs mb-4 transition-colors duration-150"
				style={{ color: "var(--color-text-muted)" }}
			>
				{showOptional ? "▾ Hide optional" : "▸ More (optional)"}
			</button>

			{showOptional && (
				<div>
					<LevelSelector
						label="Mood"
						value={mood ?? 3}
						onChange={setMood}
						color="var(--color-accent)"
					/>

					<div className="mb-5">
						<label
							className="block text-xs font-light tracking-widest uppercase mb-2"
							style={{ color: "var(--color-text-muted)" }}
						>
							Notes
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							placeholder="How was your day?"
							className="w-full rounded-lg p-3 text-sm resize-none"
							style={{
								backgroundColor: "var(--color-surface)",
								border: "1px solid var(--color-border)",
								color: "var(--color-text)",
							}}
						/>
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={handleSave}
				disabled={saving}
				className="w-full h-12 rounded-lg text-sm font-bold tracking-wide transition-all duration-150"
				style={{
					backgroundColor: saving
						? "var(--color-border)"
						: "var(--color-accent)",
					color: "var(--color-bg)",
				}}
			>
				{saving ? "Saving..." : isEditing ? "Update Check-in" : "Save Check-in"}
			</button>
		</div>
	);
}
