export interface ParsedShareText {
	originName: string;
	destinationName: string;
	departure: Date; // kombiniertes Datum + Uhrzeit
	departureTime: string; // "HH:MM"
	arrivalTime?: string; // "HH:MM"
	departurePlatform?: string;
	arrivalPlatform?: string;
	trainNames: string[]; // z.B. ["IC 2036", "ICE 771"]
}

/**
 * Parst den menschenlesbaren „Verbindung Teilen"-Text der DB-App und extrahiert
 * Startbahnhof, Zielbahnhof und Abfahrtszeitpunkt.
 *
 * Erwartetes Format:
 *   Verbindung am Di. 02.12.2025
 *   • von Magdeburg Hbf, Abfahrt 15:01 Uhr Gl. 6 mit IC 2036
 *   • nach Oldenburg(Oldb)Hbf, Ankunft 18:23 Uhr Gl. 6 mit IC 2036
 */
export function parseShareText(text: string): ParsedShareText {
	// Datum aus "Verbindung am Di. 02.12.2025" (Wochentag-Abkürzung optional)
	const dateMatch = text.match(
		/Verbindung am \w+\.?\s+(\d{2})\.(\d{2})\.(\d{4})/,
	);
	// Origin aus "• von Magdeburg Hbf, Abfahrt 15:01 Uhr Gl. 6 mit IC 2036"
	const originMatch = text.match(
		/[•·]\s*von (.+?),\s*Abfahrt (\d{2}:\d{2}) Uhr(?:\s+Gl\.?\s*(\S+))?/,
	);
	// Destination aus "• nach Oldenburg(Oldb)Hbf, Ankunft 18:23 Uhr Gl. 6"
	const destMatch = text.match(
		/[•·]\s*nach (.+?),\s*Ankunft(?:\s+(\d{2}:\d{2})\s+Uhr)?(?:\s+Gl\.?\s*(\S+))?/,
	);

	if (!dateMatch || !originMatch || !destMatch) {
		throw new Error(
			"Text konnte nicht geparst werden. Bitte stelle sicher, dass du den vollständigen DB-Teilen-Text eingefügt hast.",
		);
	}

	const [, day, month, year] = dateMatch;
	const [, originName, time, departurePlatform] = originMatch;
	const [, destinationName, arrivalTime, arrivalPlatform] = destMatch;
	const [hours, minutes] = time.split(":").map(Number);

	const departure = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		hours,
		minutes,
	);

	// Zugnamen aus allen Aufzählungszeilen extrahieren
	const trainNames: string[] = [];
	for (const line of text.split(/\r?\n/)) {
		if (!/[•·]/.test(line)) continue;
		const m = line.match(/\bmit\s+(.+?)\s*$/);
		if (m) {
			const name = m[1].trim();
			if (name && !trainNames.includes(name)) {
				trainNames.push(name);
			}
		}
	}

	return {
		originName: originName.trim(),
		destinationName: destinationName.trim(),
		departure,
		departureTime: time,
		arrivalTime: arrivalTime || undefined,
		departurePlatform: departurePlatform || undefined,
		arrivalPlatform: arrivalPlatform || undefined,
		trainNames,
	};
}
