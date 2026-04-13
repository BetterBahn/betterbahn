"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useApiBaseUrl } from "@/lib/hooks/useApiBaseUrl";
import { parseShareText } from "@/lib/utils/parseShareText";

export interface ShareSearchOptions {
	age?: string;
	hasDTicket?: boolean;
	trainClass?: string;
	bahncard?: string;
}

export type ShareSearchStatus = "idle" | "resolving" | "error";

export function useShareLinkSearch() {
	const router = useRouter();
	const baseUrl = useApiBaseUrl();
	const [status, setStatus] = useState<ShareSearchStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	const search = useCallback(
		async (rawText: string, options: ShareSearchOptions) => {
			setStatus("resolving");
			setError(null);

			try {
				// 1. Text parsen
				const parsed = parseShareText(rawText);

				// 2. Stationsnamen zu IDs auflösen (parallel)
				const [originRes, destRes] = await Promise.all([
					fetch(
						`${baseUrl}/locations?query=${encodeURIComponent(parsed.originName)}&results=1`,
					),
					fetch(
						`${baseUrl}/locations?query=${encodeURIComponent(parsed.destinationName)}&results=1`,
					),
				]);

				if (!originRes.ok || !destRes.ok) {
					throw new Error(
						"Verbindung zur API fehlgeschlagen. Bitte prüfe deine Internetverbindung.",
					);
				}

				const [originData, destData] = await Promise.all([
					originRes.json(),
					destRes.json(),
				]);

				const fromId = originData[0]?.id;
				const toId = destData[0]?.id;

				if (!fromId) {
					throw new Error(
						`Startbahnhof „${parsed.originName}" konnte nicht gefunden werden.`,
					);
				}
				if (!toId) {
					throw new Error(
						`Zielbahnhof „${parsed.destinationName}" konnte nicht gefunden werden.`,
					);
				}

				// 3. URL-Params setzen (gleiche Logik wie searchForm.tsx)
				const params = new URLSearchParams();
				params.set("from", fromId);
				params.set("to", toId);
				params.set("departure", parsed.departure.toISOString());

				if (options.age) params.set("age", options.age);
				if (options.hasDTicket) params.set("deutschlandTicketDiscount", "true");
				if (options.trainClass === "1") params.set("firstClass", "true");
				if (options.bahncard && options.bahncard !== "none") {
					params.set("loyaltyCard", `bahncard${options.bahncard}`);
				}

				// Always request tickets info
				params.set("tickets", "true");

				// Match-Daten für automatische Erkennung in den Ergebnissen speichern
				if (typeof window !== "undefined") {
					sessionStorage.setItem(
						"shareMatchData",
						JSON.stringify({
							departureTime: parsed.departureTime,
							arrivalTime: parsed.arrivalTime,
							trainNames: parsed.trainNames,
							departurePlatform: parsed.departurePlatform,
							arrivalPlatform: parsed.arrivalPlatform,
						}),
					);
				}

				// Status zurücksetzen bevor Navigation
				setStatus("idle");

				// useJourneySearch reagiert automatisch auf URL-Änderung
				router.push(`/?${params.toString()}`, { scroll: false });
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unbekannter Fehler");
				setStatus("error");
			}
		},
		[baseUrl, router],
	);

	return { search, status, error };
}
