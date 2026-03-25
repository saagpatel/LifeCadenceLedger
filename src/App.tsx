import { useCallback, useEffect, useState } from "react";
import { CheckInForm } from "./components/CheckInForm";
import { CheckInHistory } from "./components/CheckInHistory";
import { Onboarding } from "./components/Onboarding";
import { PatternDashboard } from "./components/PatternDashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import { useCheckins } from "./hooks/use-checkins";
import { useHabits } from "./hooks/use-habits";
import { getSetting, initDatabase } from "./lib/db";
import { scheduleCheckinReminder } from "./lib/notifications";

type AppTab = "checkin" | "dashboard" | "history" | "settings";

const TABS: { id: AppTab; label: string; icon: string }[] = [
	{ id: "checkin", label: "Check-in", icon: "✏️" },
	{ id: "dashboard", label: "Patterns", icon: "📊" },
	{ id: "history", label: "History", icon: "📋" },
	{ id: "settings", label: "Settings", icon: "⚙️" },
];

function App() {
	const [dbReady, setDbReady] = useState(false);
	const [dbError, setDbError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<AppTab>("checkin");
	const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

	useEffect(() => {
		initDatabase()
			.then(async () => {
				setDbReady(true);
				// Check onboarding status
				const onboardingDone = await getSetting("onboarding_complete");
				setShowOnboarding(onboardingDone !== "1");
				// Restore notification schedule
				const enabled = await getSetting("reminder_enabled");
				if (enabled === "1") {
					const time = await getSetting("notification_time");
					if (time) scheduleCheckinReminder(time);
				}
			})
			.catch((err) => {
				const message =
					err instanceof Error ? err.message : "Database initialization failed";
				setDbError(message);
				console.error("DB init failed:", err);
			});
	}, []);

	if (dbError) {
		return (
			<div className="flex-1 flex items-center justify-center px-8">
				<div className="text-center">
					<p
						className="text-lg font-bold mb-2"
						style={{ color: "var(--color-danger)" }}
					>
						Failed to initialize database
					</p>
					<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
						{dbError}
					</p>
				</div>
			</div>
		);
	}

	if (!dbReady || showOnboarding === null) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
					Loading...
				</p>
			</div>
		);
	}

	if (showOnboarding) {
		return <Onboarding onComplete={() => setShowOnboarding(false)} />;
	}

	return <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function AppContent({
	activeTab,
	setActiveTab,
}: {
	activeTab: AppTab;
	setActiveTab: (tab: AppTab) => void;
}) {
	const { habits, addHabit, removeHabit } = useHabits();
	const { todayCheckin, recentCheckins, saveCheckin, reloadCheckins } =
		useCheckins();

	const handleNavigateToHistory = useCallback(
		(_date: string) => {
			setActiveTab("history");
		},
		[setActiveTab],
	);

	return (
		<div className="flex flex-col h-screen">
			<div className="flex-1 flex flex-col overflow-hidden">
				{activeTab === "checkin" && (
					<CheckInForm
						habits={habits}
						todayCheckin={todayCheckin}
						onSave={saveCheckin}
					/>
				)}
				{activeTab === "dashboard" && (
					<PatternDashboard onNavigateToHistory={handleNavigateToHistory} />
				)}
				{activeTab === "history" && (
					<CheckInHistory checkins={recentCheckins} />
				)}
				{activeTab === "settings" && (
					<SettingsPanel
						habits={habits}
						onAddHabit={addHabit}
						onArchiveHabit={removeHabit}
						onImportComplete={reloadCheckins}
					/>
				)}
			</div>

			{/* Tab bar */}
			<nav
				className="flex border-t"
				style={{
					backgroundColor: "var(--color-surface)",
					borderColor: "var(--color-border)",
				}}
			>
				{TABS.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className="flex-1 flex flex-col items-center py-2 transition-colors duration-150"
						style={{
							color:
								activeTab === tab.id
									? "var(--color-accent)"
									: "var(--color-text-muted)",
						}}
					>
						<span className="text-lg">{tab.icon}</span>
						<span className="text-[10px] font-bold tracking-wider uppercase">
							{tab.label}
						</span>
					</button>
				))}
			</nav>
		</div>
	);
}

export default App;
