import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatDisplayDate } from "../../lib/dates";
import type { TrendPoint } from "../../types";

interface Props {
	data: TrendPoint[];
}

function formatTick(date: string): string {
	const d = new Date(date + "T00:00:00");
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function EnergyFocusTrend({ data }: Props) {
	return (
		<ResponsiveContainer width="100%" height={160}>
			<LineChart
				data={data}
				margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke="var(--color-border)"
					strokeOpacity={0.5}
				/>
				<XAxis
					dataKey="date"
					tickFormatter={formatTick}
					tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
					stroke="var(--color-border)"
					interval="preserveStartEnd"
				/>
				<YAxis
					domain={[1, 5]}
					ticks={[1, 2, 3, 4, 5]}
					tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
					stroke="var(--color-border)"
					width={24}
				/>
				<Tooltip
					content={({ payload, label }) => {
						if (!payload?.length) return null;
						return (
							<div
								className="rounded-lg px-3 py-2 text-xs"
								style={{
									backgroundColor: "var(--color-surface)",
									border: "1px solid var(--color-border)",
									color: "var(--color-text)",
								}}
							>
								<p className="font-bold mb-1">{formatDisplayDate(label)}</p>
								{payload.map((entry) => (
									<p
										key={entry.dataKey as string}
										style={{ color: entry.color }}
									>
										{entry.name}: {entry.value ?? "—"}
									</p>
								))}
							</div>
						);
					}}
				/>
				<Legend
					iconType="line"
					wrapperStyle={{ fontSize: 10, color: "var(--color-text-muted)" }}
				/>
				{/* Raw values — thin lines */}
				<Line
					dataKey="energy"
					name="Energy"
					stroke="var(--color-energy)"
					strokeWidth={1}
					dot={false}
					connectNulls={false}
					strokeOpacity={0.4}
				/>
				<Line
					dataKey="focus"
					name="Focus"
					stroke="var(--color-focus)"
					strokeWidth={1}
					dot={false}
					connectNulls={false}
					strokeOpacity={0.4}
				/>
				{/* 7-day rolling averages — thicker lines */}
				<Line
					dataKey="energyAvg7"
					name="Energy (7d avg)"
					stroke="var(--color-energy)"
					strokeWidth={2.5}
					dot={false}
					connectNulls={false}
				/>
				<Line
					dataKey="focusAvg7"
					name="Focus (7d avg)"
					stroke="var(--color-focus)"
					strokeWidth={2.5}
					dot={false}
					connectNulls={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
