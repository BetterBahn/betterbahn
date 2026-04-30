/**
 * Formats an ISO timestamp as "HH:MM" (de-DE locale).
 * Returns "??:??" when the input is null or undefined.
 */
export function formatTime(iso: string | null | undefined): string {
	if (!iso) return "??:??";
	return new Date(iso).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Formats an ISO timestamp into a short German date + time pair.
 * Example: { dateStr: "Mo, 27.01.", timeStr: "14:30" }
 */
export function formatShortDeparture(iso: string): {
	dateStr: string;
	timeStr: string;
} {
	const d = new Date(iso);
	return {
		dateStr: d.toLocaleDateString("de-DE", {
			weekday: "short",
			day: "2-digit",
			month: "2-digit",
		}),
		timeStr: d.toLocaleTimeString("de-DE", {
			hour: "2-digit",
			minute: "2-digit",
		}),
	};
}
