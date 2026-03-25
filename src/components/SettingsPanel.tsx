import { useCallback, useEffect, useRef, useState } from "react";
import type { CsvImportResult } from "../lib/csv-import";
import { importCsvFromText } from "../lib/csv-import";
import { getSetting, setSetting } from "../lib/db";
import {
	cancelCheckinReminder,
	requestNotificationPermission,
	scheduleCheckinReminder,
} from "../lib/notifications";
import type { Habit } from "../types";
import { HabitManager } from "./HabitManager";

interface Props {
	habits: Habit[];
	onAddHabit: (name: string, emoji?: string) => Promise<void>;
	onArchiveHabit: (id: string) => Promise<void>;
	onImportComplete?: () => void;
}

export function SettingsPanel({
	habits,
	onAddHabit,
	onArchiveHabit,
	onImportComplete,
}: Props) {
	const [notificationTime, setNotificationTime] = useState("09:00");
	const [reminderEnabled, setReminderEnabled] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [importStatus, setImportStatus] = useState<
		"idle" | "importing" | "done" | "error"
	>("idle");
	const [importResult, setImportResult] = useState<CsvImportResult | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		async function load() {
			const time = await getSetting("notification_time");
			const enabled = await getSetting("reminder_enabled");
			if (time) setNotificationTime(time);
			if (enabled) setReminderEnabled(enabled === "1");
			setLoaded(true);
		}
		load();
	}, []);

	// Schedule/cancel when settings change
	useEffect(() => {
		if (!loaded) return;

		if (reminderEnabled) {
			scheduleCheckinReminder(notificationTime);
		} else {
			cancelCheckinReminder();
		}
	}, [reminderEnabled, notificationTime, loaded]);

	const handleToggleReminder = useCallback(async () => {
		const newEnabled = !reminderEnabled;

		if (newEnabled) {
			const granted = await requestNotificationPermission();
			if (!granted) {
				console.warn("Notification permission denied");
				return;
			}
		}

		setReminderEnabled(newEnabled);
		await setSetting("reminder_enabled", newEnabled ? "1" : "0");
	}, [reminderEnabled]);

	const handleTimeChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const time = e.target.value;
			setNotificationTime(time);
			await setSetting("notification_time", time);
		},
		[],
	);

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			setImportStatus("importing");
			try {
				const text = await file.text();
				const result = await importCsvFromText(text);
				setImportResult(result);
				setImportStatus(result.imported > 0 ? "done" : "error");
				if (result.imported > 0) {
					onImportComplete?.();
				}
				setTimeout(() => setImportStatus("idle"), 5000);
			} catch (err) {
				console.error("CSV import failed:", err);
				setImportStatus("error");
				setTimeout(() => setImportStatus("idle"), 5000);
			}
			e.target.value = "";
		},
		[onImportComplete],
	);

	return (
		<div className="flex-1 overflow-y-auto px-5 py-6">
			<h2
				className="text-xl font-bold mb-6"
				style={{ color: "var(--color-text)" }}
			>
				Settings
			</h2>

			<div className="mb-8">
				<h3
					className="text-xs font-light tracking-widest uppercase mb-3"
					style={{ color: "var(--color-text-muted)" }}
				>
					Daily Reminder
				</h3>

				<div
					className="flex items-center justify-between px-4 py-3 rounded-lg mb-3"
					style={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
					}}
				>
					<span className="text-sm" style={{ color: "var(--color-text)" }}>
						Enable reminder
					</span>
					<button
						type="button"
						onClick={handleToggleReminder}
						className="w-12 h-7 rounded-full transition-colors duration-200 relative"
						style={{
							backgroundColor: reminderEnabled
								? "var(--color-accent)"
								: "var(--color-border)",
						}}
					>
						<span
							className="block w-5 h-5 rounded-full absolute top-1 transition-transform duration-200"
							style={{
								backgroundColor: "var(--color-text)",
								transform: reminderEnabled
									? "translateX(24px)"
									: "translateX(4px)",
							}}
						/>
					</button>
				</div>

				{reminderEnabled && (
					<div
						className="flex items-center justify-between px-4 py-3 rounded-lg"
						style={{
							backgroundColor: "var(--color-surface)",
							border: "1px solid var(--color-border)",
						}}
					>
						<span className="text-sm" style={{ color: "var(--color-text)" }}>
							Reminder time
						</span>
						<input
							type="time"
							value={notificationTime}
							onChange={handleTimeChange}
							className="text-sm rounded px-2 py-1"
							style={{
								backgroundColor: "var(--color-bg)",
								border: "1px solid var(--color-border)",
								color: "var(--color-text)",
							}}
						/>
					</div>
				)}
			</div>

			<HabitManager
				habits={habits}
				onAdd={onAddHabit}
				onArchive={onArchiveHabit}
			/>

			<div className="mt-8">
				<h3
					className="text-xs font-light tracking-widest uppercase mb-3"
					style={{ color: "var(--color-text-muted)" }}
				>
					Data
				</h3>

				<div
					className="flex items-center justify-between px-4 py-3 rounded-lg"
					style={{
						backgroundColor: "var(--color-surface)",
						border: "1px solid var(--color-border)",
					}}
				>
					<div>
						<span className="text-sm" style={{ color: "var(--color-text)" }}>
							Import CSV
						</span>
						<p
							className="text-[9px]"
							style={{ color: "var(--color-text-muted)" }}
						>
							date, energy, focus, sleep_hours, notes
						</p>
					</div>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={importStatus === "importing"}
						className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
						style={{
							backgroundColor:
								importStatus === "importing"
									? "var(--color-border)"
									: "var(--color-accent)",
							color: "var(--color-bg)",
						}}
					>
						{importStatus === "importing" ? "Importing..." : "Import"}
					</button>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept=".csv"
					className="hidden"
					onChange={handleFileSelect}
				/>

				{importStatus === "done" && importResult && (
					<p
						className="text-xs mt-2 px-4"
						style={{ color: "var(--color-success)" }}
					>
						Imported {importResult.imported} rows.
						{importResult.skipped > 0 && ` ${importResult.skipped} skipped.`}
					</p>
				)}
				{importStatus === "error" && (
					<p
						className="text-xs mt-2 px-4"
						style={{ color: "var(--color-danger)" }}
					>
						No valid rows found. Check CSV format.
					</p>
				)}
			</div>
		</div>
	);
}
