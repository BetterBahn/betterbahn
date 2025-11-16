"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { JourneyResponse, JourneySearchParams } from "@/lib/types";

export function useJourneySearch() {
	const urlSearchParams = useSearchParams();
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
			urlSearchParams.get("deutschlandTicket.discount") === "true",
		firstClass: urlSearchParams.get("firstClass") === "true",
		loyaltyCard: urlSearchParams.get("loyaltyCard") || undefined,
		tickets: true,
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
				const apiUrl = `https://v6.db.transport.rest/journeys?${params.toString()}`;

				const response = await fetch(apiUrl);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const result = await response.json();
				setData(result);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch journeys"
				);
				console.error("Error fetching journeys:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchJourneys();
	}, [urlSearchParams]);

	return { data, loading, error, searchParams };
}
