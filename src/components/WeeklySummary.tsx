import type { WeekSummaryDay } from "../types";

interface Props {
	days: WeekSummaryDay[];
	onNavigateToDate: (date: string) => void;
}

function energyColor(level: number | null): string {
	if (level === null) return "var(--color-surface)";
	const opacity = 0.2 + (level / 5) * 0.8;
	return `rgba(251, 191, 36, ${opacity})`; // energy yellow
}

function focusColor(level: number | null): string {
	if (level === null) return "var(--color-surface)";
	const opacity = 0.2 + (level / 5) * 0.8;
	return `rgba(129, 140, 248, ${opacity})`; // focus purple
}

export function WeeklySummary({ days, onNavigateToDate }: Props) {
	// Compute best/worst day (only among days with checkins)
	const daysWithCheckins = days.filter((d) => d.hasCheckin);
	let bestDay: WeekSummaryDay | null = null;
	let worstDay: WeekSummaryDay | null = null;

	if (daysWithCheckins.length >= 3) {
		for (const d of daysWithCheckins) {
			const avg = ((d.energyLevel ?? 0) + (d.focusQuality ?? 0)) / 2;
			const bestAvg = bestDay
				? ((bestDay.energyLevel ?? 0) + (bestDay.focusQuality ?? 0)) / 2
				: -1;
			const worstAvg = worstDay
				? ((worstDay.energyLevel ?? 0) + (worstDay.focusQuality ?? 0)) / 2
				: 6;
			if (avg > bestAvg) bestDay = d;
			if (avg < worstAvg) worstDay = d;
		}
	}

	return (
		<div>
			<div className="flex gap-1">
				{days.map((day) => (
					<button
						key={day.date}
						type="button"
						onClick={() => day.hasCheckin && onNavigateToDate(day.date)}
						className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors duration-150"
						style={{
							backgroundColor: day.hasCheckin
								? "var(--color-surface)"
								: "transparent",
							border: `1px solid ${day.hasCheckin ? "var(--color-border)" : "transparent"}`,
							cursor: day.hasCheckin ? "pointer" : "default",
							opacity: day.hasCheckin ? 1 : 0.4,
						}}
					>
						<span
							className="text-[8px] font-bold tracking-wider uppercase"
							style={{ color: "var(--color-text-muted)" }}
						>
							{day.dayLabel}
						</span>
						<div className="flex gap-[3px]">
							<div
								className="w-2.5 h-2.5 rounded-full"
								style={{ backgroundColor: energyColor(day.energyLevel) }}
								title={`Energy: ${day.energyLevel ?? "—"}`}
							/>
							<div
								className="w-2.5 h-2.5 rounded-full"
								style={{ backgroundColor: focusColor(day.focusQuality) }}
								title={`Focus: ${day.focusQuality ?? "—"}`}
							/>
						</div>
						{day.hasCheckin && day.totalHabits > 0 && (
							<span
								className="text-[7px] tabular-nums"
								style={{ color: "var(--color-text-muted)" }}
							>
								{day.completedHabits}/{day.totalHabits}
							</span>
						)}
					</button>
				))}
			</div>

			{bestDay && worstDay && (
				<div
					className="flex justify-between mt-2 text-[9px]"
					style={{ color: "var(--color-text-muted)" }}
				>
					<span>
						Best:{" "}
						<span style={{ color: "var(--color-success)" }}>
							{bestDay.dayLabel}
						</span>{" "}
						(
						{(
							((bestDay.energyLevel ?? 0) + (bestDay.focusQuality ?? 0)) /
							2
						).toFixed(1)}{" "}
						avg)
					</span>
					<span>
						Worst:{" "}
						<span style={{ color: "var(--color-danger)" }}>
							{worstDay.dayLabel}
						</span>{" "}
						(
						{(
							((worstDay.energyLevel ?? 0) + (worstDay.focusQuality ?? 0)) /
							2
						).toFixed(1)}{" "}
						avg)
					</span>
				</div>
			)}
		</div>
	);
}
