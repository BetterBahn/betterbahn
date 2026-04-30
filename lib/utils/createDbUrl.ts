import type { Journey } from "@/lib/types";

/**
 * Formats a departure time string for use in DB URL parameters.
 * Strips timezone suffix and milliseconds; ensures seconds are present.
 */
function formatDate(dateStr: string): string {
	let formatted = dateStr
		.replace(/\+\d{2}:\d{2}$/, "")
		.replace(/Z$/, "")
		.replace(/\.\d{3}/, "");

	// Ensure seconds are present (e.g. "2026-02-27T14:30" → "2026-02-27T14:30:00")
	if (/T\d{2}:\d{2}$/.test(formatted)) formatted += ":00";
	if (!formatted.includes("T")) formatted += "T08:00:00";

	return formatted;
}

/**
 * Builds the encoded station identifier string used in DB URLs.
 * Format: A=1@O=<name>@X=<lon>@Y=<lat>@U=80@L=<id>@B=1@p=<ts>
 */
function createStationId(station: {
	name: string;
	id?: string;
	longitude?: number | null;
	latitude?: number | null;
}): string {
	const ts = Math.floor(Date.now() / 1000);
	const parts = Object.entries({
		A: "1",
		O: station.name,
		X: station.longitude ?? "",
		Y: station.latitude ?? "",
		U: "80",
		L: station.id ?? "",
		B: "1",
		p: String(ts),
	})
		.map(([k, v]) => `${k}=${v}`)
		.join("@");

	return encodeURIComponent(parts);
}

/**
 * Returns the `r=` BahnCard parameter value for the DB booking URL.
 * @param travelClass - 1 or 2
 * @param bahnCard    - "25", "50", or null
 */
function createBcParameter(
	travelClass: number,
	bahnCard: string | null,
): string {
	switch (bahnCard) {
		case "25":
			return `13:17:KLASSE_${travelClass}:1`;
		case "50":
			return `13:23:KLASSE_${travelClass}:1`;
		default:
			return "13:16:KLASSENLOS:1";
	}
}

/**
 * Extracts the BahnCard discount number ("25", "50", "100", or null) from
 * the loyaltyCard URL param. Handles both the legacy compact format
 * ("bahncard25") and the current class-aware format ("bahncard-2nd-25").
 */
export function bahnCardCodeFromLoyaltyCard(
	loyaltyCard: string | undefined,
): string | null {
	if (!loyaltyCard) return null;
	// Match the trailing digit sequence to support both "bahncard25" and
	// "bahncard-1st-25" / "bahncard-2nd-50" etc.
	const match = loyaltyCard.match(/(\d+)$/);
	return match ? match[1] : null;
}

/**
 * Generates a pre-filled Deutsche Bahn booking URL for a given journey.
 *
 * @param journey              - The journey (a single segment of a split or the full journey)
 * @param travelClass          - 1 (first class) or 2 (second class)
 * @param hasDeutschlandTicket - Whether the user holds a Deutschland-Ticket
 * @param bahnCard             - "25", "50", or null
 * @returns The DB booking URL string, or null if required data is missing
 */
export function createDbBookingUrl(
	journey: Journey,
	travelClass: number = 2,
	hasDeutschlandTicket: boolean = false,
	bahnCard: string | null = null,
): string | null {
	if (!journey?.legs?.length) return null;

	const legs = journey.legs;
	const firstLeg = legs[0];
	const lastLeg = legs[legs.length - 1];

	if (!firstLeg?.origin?.name || !lastLeg?.destination?.name) {
		return null;
	}

	const departure = firstLeg.departure || firstLeg.plannedDeparture;
	if (!departure) return null;

	const formattedDate = formatDate(departure);
	const bcParameter = createBcParameter(travelClass, bahnCard);

	const parts: string[] = [
		"sts=true",
		`so=${encodeURIComponent(firstLeg.origin.name)}`,
		`zo=${encodeURIComponent(lastLeg.destination.name)}`,
		`kl=${travelClass}`,
		`r=${bcParameter}`,
	];

	// Origin station ID
	if (firstLeg.origin.id) {
		const soid = createStationId({
			name: firstLeg.origin.name,
			id: firstLeg.origin.id,
		});
		parts.push(`soid=${soid}`);
	}

	// Destination station ID
	if (lastLeg.destination.id) {
		const zoid = createStationId({
			name: lastLeg.destination.name,
			id: lastLeg.destination.id,
		});
		parts.push(`zoid=${zoid}`);
	}

	parts.push("sot=ST", "zot=ST");

	if (firstLeg.origin.id) {
		parts.push(`soei=${firstLeg.origin.id}`);
	}
	if (lastLeg.destination.id) {
		parts.push(`zoei=${lastLeg.destination.id}`);
	}

	parts.push(
		`hd=${formattedDate}`,
		"hza=D",
		"hz=%5B%5D",
		"ar=false",
		"s=false",
		"d=false",
		"vm=00,01,02,03,04,05,06,07,08,09",
		"fm=false",
		"bp=false",
		"dlt=false",
		`dltv=${hasDeutschlandTicket}`,
	);

	return `https://www.bahn.de/buchung/fahrplan/suche#${parts.join("&")}`;
}
