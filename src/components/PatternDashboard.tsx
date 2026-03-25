import { useState } from "react";
import { usePatterns } from "../hooks/use-patterns";
import { DayOfWeekBar } from "./charts/DayOfWeekBar";
import { EnergyFocusTrend } from "./charts/EnergyFocusTrend";
import { HabitStreakGrid } from "./charts/HabitStreakGrid";
import { SleepEnergyScatter } from "./charts/SleepEnergyScatter";
import { WeeklySummary } from "./WeeklySummary";

interface Props {
	onNavigateToHistory: (date: string) => void;
}

type DateRange = 30 | 60 | 90;

function ChartPanel({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className="rounded-lg p-4"
			style={{
				backgroundColor: "var(--color-surface)",
				border: "1px solid var(--color-border)",
			}}
		>
			<div className="flex items-baseline justify-between mb-3">
				<h3
					className="text-xs font-bold tracking-wider uppercase"
					style={{ color: "var(--color-text)" }}
				>
					{title}
				</h3>
				{subtitle && (
					<span
						className="text-[9px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{subtitle}
					</span>
				)}
			</div>
			{children}
		</div>
	);
}

function EmptyState({
	threshold,
	current,
}: {
	threshold: number;
	current: number;
}) {
	const remaining = threshold - current;
	const pct = Math.min((current / threshold) * 100, 100);

	return (
		<div className="py-6 text-center">
			<p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
				Log {remaining} more check-in{remaining !== 1 ? "s" : ""} to unlock
			</p>
			<div
				className="w-full h-1.5 rounded-full overflow-hidden"
				style={{ backgroundColor: "var(--color-border)" }}
			>
				<div
					className="h-full rounded-full transition-all duration-300"
					style={{
						width: `${pct}%`,
						backgroundColor: "var(--color-accent)",
					}}
				/>
			</div>
			<p
				className="text-[9px] mt-1"
				style={{ color: "var(--color-text-muted)" }}
			>
				{current}/{threshold}
			</p>
		</div>
	);
}

const RANGES: DateRange[] = [30, 60, 90];

export function PatternDashboard({ onNavigateToHistory }: Props) {
	const [dateRange, setDateRange] = useState<DateRange>(30);
	const {
		trendPoints,
		habitStreaks,
		scatterPoints,
		dowAverages,
		weekSummary,
		checkinCount,
		isLoading,
	} = usePatterns(dateRange);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
					Loading patterns...
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
			{/* Date range selector */}
			<div className="flex gap-1.5">
				{RANGES.map((r) => (
					<button
						key={r}
						type="button"
						onClick={() => setDateRange(r)}
						className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all duration-150"
						style={{
							backgroundColor:
								dateRange === r
									? "var(--color-accent)"
									: "var(--color-surface)",
							color:
								dateRange === r ? "var(--color-bg)" : "var(--color-text-muted)",
							border: `1px solid ${dateRange === r ? "var(--color-accent)" : "var(--color-border)"}`,
						}}
					>
						{r}d
					</button>
				))}
			</div>

			{/* Weekly Summary */}
			<ChartPanel title="This Week">
				<WeeklySummary
					days={weekSummary}
					onNavigateToDate={onNavigateToHistory}
				/>
			</ChartPanel>

			{/* Energy & Focus Trend */}
			<ChartPanel title="Energy & Focus" subtitle={`${dateRange}-day trend`}>
				{checkinCount >= 14 ? (
					<EnergyFocusTrend data={trendPoints} />
				) : (
					<EmptyState threshold={14} current={checkinCount} />
				)}
			</ChartPanel>

			{/* Sleep vs Energy */}
			<ChartPanel title="Sleep vs Energy">
				{checkinCount >= 14 ? (
					<SleepEnergyScatter data={scatterPoints} />
				) : (
					<EmptyState threshold={14} current={checkinCount} />
				)}
			</ChartPanel>

			{/* Day of Week */}
			<ChartPanel title="Weekday Patterns">
				{checkinCount >= 8 ? (
					<DayOfWeekBar data={dowAverages} />
				) : (
					<EmptyState threshold={8} current={checkinCount} />
				)}
			</ChartPanel>

			{/* Habit Streaks */}
			<ChartPanel title="Habit Streaks" subtitle="90 days">
				<HabitStreakGrid data={habitStreaks} />
			</ChartPanel>
		</div>
	);
}
