import { useCallback, useState } from "react";
import { useHabits } from "../hooks/use-habits";
import { setSetting } from "../lib/db";
import {
	cancelCheckinReminder,
	requestNotificationPermission,
	scheduleCheckinReminder,
} from "../lib/notifications";
import { HabitManager } from "./HabitManager";

interface Props {
	onComplete: () => void;
}

export function Onboarding({ onComplete }: Props) {
	const [step, setStep] = useState(0);
	const [notificationTime, setNotificationTime] = useState("09:00");
	const [reminderEnabled, setReminderEnabled] = useState(false);
	const { habits, addHabit, removeHabit } = useHabits();

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
	}, [reminderEnabled]);

	const handleNotificationContinue = useCallback(async () => {
		if (reminderEnabled) {
			await setSetting("reminder_enabled", "1");
			await setSetting("notification_time", notificationTime);
			scheduleCheckinReminder(notificationTime);
		} else {
			await setSetting("reminder_enabled", "0");
			cancelCheckinReminder();
		}
		setStep(3);
	}, [reminderEnabled, notificationTime]);

	const handleFinish = useCallback(async () => {
		await setSetting("onboarding_complete", "1");
		onComplete();
	}, [onComplete]);

	return (
		<div className="flex flex-col h-screen px-8 py-10 justify-center items-center">
			{/* Step indicator (steps 1-3 only) */}
			{step > 0 && (
				<div className="flex gap-1.5 justify-center mb-8">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className="w-2 h-2 rounded-full transition-colors duration-200"
							style={{
								backgroundColor:
									s === step ? "var(--color-accent)" : "var(--color-border)",
							}}
						/>
					))}
				</div>
			)}

			{/* Step 0: Welcome */}
			{step === 0 && (
				<div className="text-center max-w-xs">
					<p className="text-5xl mb-6">🌱</p>
					<h1
						className="text-2xl font-bold mb-2"
						style={{ color: "var(--color-text)" }}
					>
						Life Cadence Ledger
					</h1>
					<p
						className="text-sm mb-6"
						style={{ color: "var(--color-text-muted)" }}
					>
						Understand when you're at your best.
					</p>
					<p
						className="text-xs mb-10 leading-relaxed"
						style={{ color: "var(--color-text-muted)" }}
					>
						Track energy, focus, sleep, and habits daily. See patterns over
						time. All data stays on your device.
					</p>
					<button
						type="button"
						onClick={() => setStep(1)}
						className="w-full h-12 rounded-lg text-sm font-bold tracking-wide transition-all duration-150"
						style={{
							backgroundColor: "var(--color-accent)",
							color: "var(--color-bg)",
						}}
					>
						Get Started
					</button>
				</div>
			)}

			{/* Step 1: Habits */}
			{step === 1 && (
				<div className="w-full max-w-xs">
					<h2
						className="text-lg font-bold mb-4"
						style={{ color: "var(--color-text)" }}
					>
						What habits do you want to track?
					</h2>

					<HabitManager
						habits={habits}
						onAdd={addHabit}
						onArchive={removeHabit}
					/>

					<p
						className="text-xs mt-4 mb-6"
						style={{ color: "var(--color-text-muted)" }}
					>
						You can always add more in Settings.
					</p>

					<button
						type="button"
						onClick={() => setStep(2)}
						className="w-full h-12 rounded-lg text-sm font-bold tracking-wide transition-all duration-150"
						style={{
							backgroundColor: "var(--color-accent)",
							color: "var(--color-bg)",
						}}
					>
						Continue
					</button>
					<button
						type="button"
						onClick={() => setStep(2)}
						className="w-full mt-2 py-2 text-xs transition-colors duration-150"
						style={{ color: "var(--color-text-muted)" }}
					>
						Skip for now
					</button>
				</div>
			)}

			{/* Step 2: Notifications */}
			{step === 2 && (
				<div className="w-full max-w-xs">
					<h2
						className="text-lg font-bold mb-4"
						style={{ color: "var(--color-text)" }}
					>
						Set a daily reminder
					</h2>

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
							className="flex items-center justify-between px-4 py-3 rounded-lg mb-3"
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
								onChange={(e) => setNotificationTime(e.target.value)}
								className="text-sm rounded px-2 py-1"
								style={{
									backgroundColor: "var(--color-bg)",
									border: "1px solid var(--color-border)",
									color: "var(--color-text)",
								}}
							/>
						</div>
					)}

					<p
						className="text-xs mb-6"
						style={{ color: "var(--color-text-muted)" }}
					>
						The app will remind you to check in each day.
					</p>

					<button
						type="button"
						onClick={handleNotificationContinue}
						className="w-full h-12 rounded-lg text-sm font-bold tracking-wide transition-all duration-150"
						style={{
							backgroundColor: "var(--color-accent)",
							color: "var(--color-bg)",
						}}
					>
						Continue
					</button>
				</div>
			)}

			{/* Step 3: Done */}
			{step === 3 && (
				<div className="text-center max-w-xs">
					<p
						className="text-6xl mb-6"
						style={{ color: "var(--color-success)" }}
					>
						✓
					</p>
					<h2
						className="text-xl font-bold mb-2"
						style={{ color: "var(--color-text)" }}
					>
						You're all set!
					</h2>
					<p
						className="text-sm mb-10"
						style={{ color: "var(--color-text-muted)" }}
					>
						Check in daily — it takes less than 60 seconds.
					</p>
					<button
						type="button"
						onClick={handleFinish}
						className="w-full h-12 rounded-lg text-sm font-bold tracking-wide transition-all duration-150"
						style={{
							backgroundColor: "var(--color-accent)",
							color: "var(--color-bg)",
						}}
					>
						Start Tracking
					</button>
				</div>
			)}
		</div>
	);
}
