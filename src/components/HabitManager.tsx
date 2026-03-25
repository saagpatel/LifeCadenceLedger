import { useState } from "react";
import type { Habit } from "../types";

interface Props {
	habits: Habit[];
	onAdd: (name: string, emoji?: string) => Promise<void>;
	onArchive: (id: string) => Promise<void>;
}

export function HabitManager({ habits, onAdd, onArchive }: Props) {
	const [newName, setNewName] = useState("");
	const [newEmoji, setNewEmoji] = useState("");
	const [adding, setAdding] = useState(false);

	const handleAdd = async () => {
		const name = newName.trim();
		if (!name) return;

		setAdding(true);
		try {
			await onAdd(name, newEmoji.trim() || undefined);
			setNewName("");
			setNewEmoji("");
		} finally {
			setAdding(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleAdd();
		}
	};

	return (
		<div>
			<h3
				className="text-xs font-light tracking-widest uppercase mb-3"
				style={{ color: "var(--color-text-muted)" }}
			>
				Habits
			</h3>

			{habits.length === 0 && (
				<p
					className="text-sm mb-4"
					style={{ color: "var(--color-text-muted)" }}
				>
					No habits yet. Add your first habit below.
				</p>
			)}

			<div className="space-y-2 mb-4">
				{habits.map((h) => (
					<div
						key={h.id}
						className="flex items-center justify-between px-3 py-2 rounded-lg"
						style={{
							backgroundColor: "var(--color-surface)",
							border: "1px solid var(--color-border)",
						}}
					>
						<span className="text-sm" style={{ color: "var(--color-text)" }}>
							{h.emoji} {h.name}
						</span>
						<button
							type="button"
							onClick={() => onArchive(h.id)}
							className="text-xs px-2 py-1 rounded transition-colors duration-150"
							style={{ color: "var(--color-danger)" }}
						>
							Archive
						</button>
					</div>
				))}
			</div>

			<div className="flex gap-2">
				<input
					type="text"
					value={newEmoji}
					onChange={(e) => setNewEmoji(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="🏃"
					className="w-12 h-10 rounded-lg text-center text-sm"
					style={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						color: "var(--color-text)",
					}}
					maxLength={4}
				/>
				<input
					type="text"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Habit name"
					className="flex-1 h-10 rounded-lg px-3 text-sm"
					style={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
						color: "var(--color-text)",
					}}
				/>
				<button
					type="button"
					onClick={handleAdd}
					disabled={adding || !newName.trim()}
					className="h-10 px-4 rounded-lg text-sm font-bold transition-all duration-150"
					style={{
						backgroundColor: !newName.trim()
							? "var(--color-border)"
							: "var(--color-accent)",
						color: "var(--color-bg)",
					}}
				>
					Add
				</button>
			</div>
		</div>
	);
}
