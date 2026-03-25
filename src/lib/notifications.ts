import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from "@tauri-apps/plugin-notification";

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

/** Request macOS notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
	const granted = await isPermissionGranted();
	if (granted) return true;

	const permission = await requestPermission();
	return permission === "granted";
}

/**
 * Schedule a daily check-in reminder at the given HH:MM time.
 *
 * Implementation note: Uses setTimeout since tauri-plugin-notification v2
 * doesn't support scheduled notifications. The timer does NOT survive app quit —
 * the app re-schedules on each launch by reading the stored notification_time setting.
 */
export function scheduleCheckinReminder(timeHHMM: string): void {
	cancelCheckinReminder();

	const [hours, minutes] = timeHHMM.split(":").map(Number);
	const now = new Date();
	const target = new Date();
	target.setHours(hours, minutes, 0, 0);

	// If the time has already passed today, schedule for tomorrow
	if (target.getTime() <= now.getTime()) {
		target.setDate(target.getDate() + 1);
	}

	const delayMs = target.getTime() - now.getTime();

	scheduledTimer = setTimeout(async () => {
		try {
			const granted = await isPermissionGranted();
			if (granted) {
				sendNotification({
					title: "Life Cadence Ledger",
					body: "Time for your daily check-in",
				});
			}
		} catch (err) {
			console.error("Failed to send notification:", err);
		}

		// Reschedule for the next day
		scheduleCheckinReminder(timeHHMM);
	}, delayMs);
}

/** Cancel any pending notification timer. */
export function cancelCheckinReminder(): void {
	if (scheduledTimer !== null) {
		clearTimeout(scheduledTimer);
		scheduledTimer = null;
	}
}
