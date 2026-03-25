import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { DowAverage } from "../../types";

interface Props {
	data: DowAverage[];
}

export function DayOfWeekBar({ data }: Props) {
	return (
		<ResponsiveContainer width="100%" height={140}>
			<BarChart
				data={data}
				margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
				barGap={2}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke="var(--color-border)"
					strokeOpacity={0.5}
				/>
				<XAxis
					dataKey="dayLabel"
					tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
					stroke="var(--color-border)"
				/>
				<YAxis
					domain={[0, 5]}
					ticks={[0, 1, 2, 3, 4, 5]}
					tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
					stroke="var(--color-border)"
					width={24}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						color: "var(--color-text)",
						fontSize: 11,
						borderRadius: 8,
					}}
				/>
				<Legend
					iconType="square"
					wrapperStyle={{ fontSize: 10, color: "var(--color-text-muted)" }}
				/>
				<Bar
					dataKey="avgEnergy"
					name="Energy"
					fill="var(--color-energy)"
					fillOpacity={0.8}
					radius={[3, 3, 0, 0]}
					barSize={16}
				/>
				<Bar
					dataKey="avgFocus"
					name="Focus"
					fill="var(--color-focus)"
					fillOpacity={0.8}
					radius={[3, 3, 0, 0]}
					barSize={16}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}
