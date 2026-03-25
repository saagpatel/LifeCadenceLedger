import { generateDateRange } from "../../hooks/use-patterns";
import { daysAgo, todayAsISODate } from "../../lib/dates";
import type { HabitStreakEntry } from "../../types";

interface Props {
	data: HabitStreakEntry[];
}

export function HabitStreakGrid({ data }: Props) {
	const dates = generateDateRange(daysAgo(89), todayAsISODate());

	if (data.length === 0) {
		return (
			<p
				className="text-xs py-4 text-center"
				style={{ color: "var(--color-text-muted)" }}
			>
				Add habits in Settings to see streaks here.
			</p>
		);
	}

	return (
		<div className="space-y-2 overflow-x-auto">
			{data.map((entry) => (
				<div key={entry.habitId} className="flex items-center gap-2">
					<span
						className="w-14 text-[9px] truncate shrink-0"
						style={{ color: "var(--color-text-muted)" }}
						title={`${entry.habitEmoji} ${entry.habitName}`}
					>
						{entry.habitEmoji} {entry.habitName}
					</span>

					<div className="flex gap-[1px] flex-1 min-w-0">
						{dates.map((date) => {
							const completion = entry.completionsByDate.get(date);
							let bg: string;
							if (completion === true) {
								bg = "var(--color-accent)";
							} else if (completion === false) {
								bg = "var(--color-surface-hover)";
							} else {
								bg = "var(--color-surface)";
							}

							return (
								<div
									key={date}
									className="h-3 rounded-[1px]"
									style={{
										backgroundColor: bg,
										flex: "1 1 0",
										minWidth: "2px",
										maxWidth: "4px",
									}}
									title={`${date}: ${completion === true ? "done" : completion === false ? "not done" : "no checkin"}`}
								/>
							);
						})}
					</div>

					<span
						className="text-[9px] w-8 text-right shrink-0 tabular-nums"
						style={{
							color:
								entry.currentStreak > 0
									? "var(--color-energy)"
									: "var(--color-text-muted)",
						}}
					>
						{entry.currentStreak > 0 ? `🔥${entry.currentStreak}` : "—"}
					</span>
				</div>
			))}
		</div>
	);
}
