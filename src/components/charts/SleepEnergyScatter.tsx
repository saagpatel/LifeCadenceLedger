import {
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatDisplayDate } from "../../lib/dates";
import type { DailyAggregateRow } from "../../types";

interface Props {
	data: DailyAggregateRow[];
}

function ScatterTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: Array<{ payload: DailyAggregateRow }>;
}) {
	if (!active || !payload?.length) return null;
	const row = payload[0].payload;
	return (
		<div
			className="rounded-lg px-3 py-2 text-xs"
			style={{
				backgroundColor: "var(--color-surface)",
				border: "1px solid var(--color-border)",
				color: "var(--color-text)",
			}}
		>
			<p className="font-bold mb-1">{formatDisplayDate(row.checkinDate)}</p>
			<p>
				<span style={{ color: "var(--color-sleep)" }}>Sleep:</span>{" "}
				{row.sleepHours}h
			</p>
			<p>
				<span style={{ color: "var(--color-energy)" }}>Energy:</span>{" "}
				{row.energyLevel}/5
			</p>
		</div>
	);
}

export function SleepEnergyScatter({ data }: Props) {
	const avgEnergy =
		data.length > 0
			? Math.round(
					(data.reduce((s, d) => s + d.energyLevel, 0) / data.length) * 100,
				) / 100
			: 0;

	return (
		<ResponsiveContainer width="100%" height={180}>
			<ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke="var(--color-border)"
					strokeOpacity={0.5}
				/>
				<XAxis
					type="number"
					dataKey="sleepHours"
					domain={[4, 10]}
					name="Sleep"
					unit="h"
					tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
					stroke="var(--color-border)"
				/>
				<YAxis
					type="number"
					dataKey="energyLevel"
					domain={[1, 5]}
					name="Energy"
					ticks={[1, 2, 3, 4, 5]}
					tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
					stroke="var(--color-border)"
					width={24}
				/>
				<Tooltip content={<ScatterTooltip />} />
				<ReferenceLine
					y={avgEnergy}
					stroke="var(--color-text-muted)"
					strokeDasharray="4 4"
					strokeOpacity={0.5}
				/>
				<Scatter data={data} fill="var(--color-accent)" fillOpacity={0.7} />
			</ScatterChart>
		</ResponsiveContainer>
	);
}
