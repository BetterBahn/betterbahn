"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { JourneyResponse, JourneySearchParams } from "@/lib/types";
import { useApiBaseUrl } from "@/lib/hooks/useApiBaseUrl";

export function useJourneySearch() {
	const urlSearchParams = useSearchParams();
	const baseUrl = useApiBaseUrl();
	const [data, setData] = useState<JourneyResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Convert URL params to typed object (single source of truth)
	const searchParams: JourneySearchParams = {
		from: urlSearchParams.get("from") || "",
		to: urlSearchParams.get("to") || "",
		departure: urlSearchParams.get("departure") || undefined,
		age: urlSearchParams.get("age") || undefined,
		deutschlandTicketDiscount:
			urlSearchParams.get("deutschlandTicketDiscount") === "true",
		firstClass: urlSearchParams.get("firstClass") === "true",
		loyaltyCard: urlSearchParams.get("loyaltyCard") || undefined,
		tickets: true,
		splitIncludeTransferStations:
			urlSearchParams.get("splitIncludeTransferStations") === "true",
		splitAllowOtherTrains:
			urlSearchParams.get("splitAllowOtherTrains") === "true",
		splitMaxArrivalDeviation: (() => {
			const raw = Number(urlSearchParams.get("splitMaxArrivalDeviation"));
			return isNaN(raw) || raw === 0 ? 60 : Math.max(1, Math.min(240, raw));
		})(),
	};

	useEffect(() => {
		const from = urlSearchParams.get("from");
		const to = urlSearchParams.get("to");

		// Don't fetch if we don't have required params
		if (!from || !to) {
			return;
		}

		const fetchJourneys = async () => {
			setLoading(true);
			setError(null);

			try {
				// Build the API URL with all search params, and add stopovers=true to get intermediate stations
				const params = new URLSearchParams(urlSearchParams.toString());
				params.set("stopovers", "true");
				params.set("tickets", "true"); // Always get ticket prices
				const apiUrl = `${baseUrl}/journeys?${params.toString()}`;

				const response = await fetch(apiUrl);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const result = await response.json();
				setData(result);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch journeys",
				);
				console.error("Error fetching journeys:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchJourneys();
	}, [urlSearchParams, baseUrl]);

	return { data, loading, error, searchParams };
}
