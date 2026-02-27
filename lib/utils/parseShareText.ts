export interface ParsedShareText {
	originName: string;
	destinationName: string;
	departure: Date; // kombiniertes Datum + Uhrzeit
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
	// Origin aus "• von Magdeburg Hbf, Abfahrt 15:01 Uhr"
	const originMatch = text.match(
		/[•·]\s*von (.+?),\s*Abfahrt (\d{2}:\d{2}) Uhr/,
	);
	// Destination aus "• nach Oldenburg(Oldb)Hbf, Ankunft"
	const destMatch = text.match(/[•·]\s*nach (.+?),\s*Ankunft/);

	if (!dateMatch || !originMatch || !destMatch) {
		throw new Error(
			"Text konnte nicht geparst werden. Bitte stelle sicher, dass du den vollständigen DB-Teilen-Text eingefügt hast.",
		);
	}

	const [, day, month, year] = dateMatch;
	const [, originName, time] = originMatch;
	const [, destinationName] = destMatch;
	const [hours, minutes] = time.split(":").map(Number);

	const departure = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		hours,
		minutes,
	);

	return {
		originName: originName.trim(),
		destinationName: destinationName.trim(),
		departure,
	};
}
