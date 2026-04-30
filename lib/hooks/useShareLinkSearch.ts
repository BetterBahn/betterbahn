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
	splitIncludeTransferStations?: boolean;
	splitAllowOtherTrains?: boolean;
	splitMaxArrivalDeviation?: number;
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

				// 3. URL-Params setzen
				const params = new URLSearchParams();
				params.set("from", fromId);
				params.set("to", toId);
				params.set("fromName", parsed.originName);
				params.set("toName", parsed.destinationName);
				params.set("departure", parsed.departure.toISOString());

				if (options.age) params.set("age", options.age);
				if (options.hasDTicket) params.set("deutschlandTicketDiscount", "true");
				if (options.trainClass === "1") params.set("firstClass", "true");
				if (options.bahncard && options.bahncard !== "none") {
					params.set("loyaltyCard", `bahncard${options.bahncard}`);
				}

				// Split settings
				if (options.splitIncludeTransferStations)
					params.set("splitIncludeTransferStations", "true");
				if (options.splitAllowOtherTrains) {
					params.set("splitAllowOtherTrains", "true");
					params.set(
						"splitMaxArrivalDeviation",
						String(options.splitMaxArrivalDeviation ?? 60),
					);
				}

				// Always request tickets info
				params.set("tickets", "true");

				// Match-Daten als URL-Params kodieren, damit sie einen Refresh überleben
				if (parsed.arrivalTime)
					params.set("matchArrivalTime", parsed.arrivalTime);
				if (parsed.trainNames.length > 0)
					params.set("matchTrains", parsed.trainNames.join(","));

				// Status zurücksetzen bevor Navigation
				setStatus("idle");

				// useJourneySearch reagiert automatisch auf URL-Änderung
				router.push(`/journey/?${params.toString()}`);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unbekannter Fehler");
				setStatus("error");
			}
		},
		[baseUrl, router],
	);

	return { search, status, error };
}
