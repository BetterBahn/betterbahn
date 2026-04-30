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
 * Unterstützte Formate:
 *   Verbindung am Di. 02.12.2025
 *   • von Magdeburg Hbf, Abfahrt 15:01 Uhr Gl. 6 mit IC 2036
 *   • nach Oldenburg(Oldb)Hbf, Ankunft 18:23 Uhr Gl. 6 mit IC 2036
 *
 *   Magdeburg Hbf → Oldenburg(Oldb)Hbf
 *   18.04.2026
 *
 *   IC 2034
 *   Nach Norddeich
 *   Ab 17:01 Magdeburg Hbf, Gleis 7
 *   An 20:23 Oldenburg(Oldb)Hbf, Gleis 7
 */
export function parseShareText(text: string): ParsedShareText {
	// Datum aus "Verbindung am ... 02.12.2025" oder eigener Zeile "02.12.2025"
	const dateMatch =
		text.match(/Verbindung am(?:\s+[^\d\n]+)?\s+(\d{2})\.(\d{2})\.(\d{4})/) ||
		text.match(/(?:^|\n)\s*(\d{2})\.(\d{2})\.(\d{4})\s*(?:\n|$)/);

	// Legacy-Format mit Bullet-Points
	const legacyOriginMatch = text.match(
		/[•·]\s*von (.+?),\s*Abfahrt (\d{2}:\d{2}) Uhr(?:\s+Gl\.?\s*(\S+))?/,
	);
	const legacyDestMatch = text.match(
		/[•·]\s*nach (.+?),\s*Ankunft(?:\s+(\d{2}:\d{2})\s+Uhr)?(?:\s+Gl\.?\s*(\S+))?/,
	);

	// Neues Format mit Streckenzeile und Ab/An-Zeilen
	const routeLineMatch = text.match(
		/(?:^|\n)\s*(.+?)\s*(?:→|->)\s*(.+?)\s*(?:\n|$)/,
	);
	const departureLineMatch = text.match(
		/(?:^|\n)\s*Ab\s+(\d{2}:\d{2})\s+(.+?)(?:,\s*(?:Gleis|Gl\.?)\s*([^\n,]+))?\s*(?:\n|$)/i,
	);
	const arrivalLineMatch = text.match(
		/(?:^|\n)\s*An\s+(\d{2}:\d{2})\s+(.+?)(?:,\s*(?:Gleis|Gl\.?)\s*([^\n,]+))?\s*(?:\n|$)/i,
	);

	if (!dateMatch) {
		throw new Error(
			"Text konnte nicht geparst werden. Bitte stelle sicher, dass du den vollständigen DB-Teilen-Text eingefügt hast.",
		);
	}

	let originName: string | undefined;
	let destinationName: string | undefined;
	let departureTime: string | undefined;
	let arrivalTime: string | undefined;
	let departurePlatform: string | undefined;
	let arrivalPlatform: string | undefined;

	if (legacyOriginMatch && legacyDestMatch) {
		[, originName, departureTime, departurePlatform] = legacyOriginMatch;
		[, destinationName, arrivalTime, arrivalPlatform] = legacyDestMatch;
	} else if (departureLineMatch && arrivalLineMatch) {
		// Wenn vorhanden, hat die Kopfzeile mit Pfeil Vorrang für Start/Ziel.
		originName = routeLineMatch?.[1]?.trim() || departureLineMatch[2].trim();
		destinationName = routeLineMatch?.[2]?.trim() || arrivalLineMatch[2].trim();
		departureTime = departureLineMatch[1];
		arrivalTime = arrivalLineMatch[1];
		departurePlatform = departureLineMatch[3]?.trim();
		arrivalPlatform = arrivalLineMatch[3]?.trim();
	}

	if (!originName || !destinationName || !departureTime) {
		throw new Error(
			"Text konnte nicht geparst werden. Bitte stelle sicher, dass du den vollständigen DB-Teilen-Text eingefügt hast.",
		);
	}

	const [, day, month, year] = dateMatch;
	const [hours, minutes] = departureTime.split(":").map(Number);

	const departure = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		hours,
		minutes,
	);

	// Zugnamen aus Legacy-Bullets und Standalone-Zugzeilen extrahieren.
	const trainNames: string[] = [];
	const addTrainName = (value: string) => {
		const normalized = value.trim();
		if (normalized && !trainNames.includes(normalized)) {
			trainNames.push(normalized);
		}
	};

	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const legacyTrainMatch = trimmed.match(/\bmit\s+(.+?)\s*$/i);
		if (legacyTrainMatch) {
			addTrainName(legacyTrainMatch[1]);
			continue;
		}

		const standaloneTrainMatch = trimmed.match(
			/^(ICE|IC|EC|RE|RB|IRE|MEX|S|U|NJ|EN|FLX)\s*([0-9][0-9A-Z]*)$/i,
		);
		if (standaloneTrainMatch) {
			addTrainName(
				`${standaloneTrainMatch[1].toUpperCase()} ${standaloneTrainMatch[2]}`,
			);
		}
	}

	return {
		originName: originName.trim(),
		destinationName: destinationName.trim(),
		departure,
		departureTime,
		arrivalTime: arrivalTime || undefined,
		departurePlatform: departurePlatform || undefined,
		arrivalPlatform: arrivalPlatform || undefined,
		trainNames,
	};
}
