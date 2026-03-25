import { formatDisplayDate } from "../lib/dates";
import type { CheckinWithHabits } from "../types";

interface Props {
	checkins: CheckinWithHabits[];
}

function CheckinRow({ checkin }: { checkin: CheckinWithHabits }) {
	const completedCount = checkin.habits.filter((h) => h.completed).length;
	const totalHabits = checkin.habits.length;

	return (
		<div
			className="px-4 py-3 rounded-lg mb-2 transition-colors duration-150"
			style={{
				backgroundColor: "var(--color-surface)",
				border: "1px solid var(--color-border)",
			}}
		>
			<div className="flex items-center justify-between mb-1">
				<span
					className="text-sm font-bold"
					style={{ color: "var(--color-text)" }}
				>
					{formatDisplayDate(checkin.checkinDate)}
				</span>
				{totalHabits > 0 && (
					<span
						className="text-xs"
						style={{ color: "var(--color-text-muted)" }}
					>
						{completedCount}/{totalHabits} habits
					</span>
				)}
			</div>
			<div
				className="flex gap-4 text-xs"
				style={{ color: "var(--color-text-muted)" }}
			>
				<span>
					<span style={{ color: "var(--color-energy)" }}>⚡</span>{" "}
					{checkin.energyLevel}
				</span>
				<span>
					<span style={{ color: "var(--color-focus)" }}>🎯</span>{" "}
					{checkin.focusQuality}
				</span>
				<span>
					<span style={{ color: "var(--color-sleep)" }}>💤</span>{" "}
					{checkin.sleepHours}h
				</span>
				{checkin.mood && (
					<span>
						<span style={{ color: "var(--color-accent)" }}>😊</span>{" "}
						{checkin.mood}
					</span>
				)}
			</div>
			{checkin.notes && (
				<p
					className="text-xs mt-2 truncate"
					style={{ color: "var(--color-text-muted)" }}
				>
					{checkin.notes}
				</p>
			)}
		</div>
	);
}

export function CheckInHistory({ checkins }: Props) {
	if (checkins.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center px-5">
				<div className="text-center">
					<p
						className="text-lg font-bold mb-2"
						style={{ color: "var(--color-text-muted)" }}
					>
						No check-ins yet
					</p>
					<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
						Complete your first check-in on the Check-in tab.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto px-5 py-6">
			<h2
				className="text-xl font-bold mb-4"
				style={{ color: "var(--color-text)" }}
			>
				History
			</h2>
			{checkins.map((c) => (
				<CheckinRow key={c.id} checkin={c} />
			))}
		</div>
	);
}
