// NOTE: This can/should later be replaced by db-hafas-stations or similar package for better performance and less api calls.

import { useEffect, useState } from "react";
import { useDebounce } from "./useDebounce";
import type { Station, StationSearchResult } from "@/lib/types";
import { useApiBaseUrl } from "@/lib/hooks/useApiBaseUrl";

export function useStationSearch(query: string): StationSearchResult {
	const [stations, setStations] = useState<Station[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const baseUrl = useApiBaseUrl();

	const debouncedQuery = useDebounce(query, 300);

	useEffect(() => {
		// Don't search if query is too short
		if (!debouncedQuery || debouncedQuery.trim().length < 2) {
			setStations([]);
			setLoading(false);
			return;
		}

		const fetchStations = async () => {
			setLoading(true);
			setError(null);

			try {
				const url = `${baseUrl}/locations?poi=false&addresses=false&query=${encodeURIComponent(
					debouncedQuery,
				)}`;

				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const data = await response.json();
				setStations(data || []);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch stations",
				);
				setStations([]);
			} finally {
				setLoading(false);
			}
		};

		fetchStations();
	}, [debouncedQuery, baseUrl]);

	return { stations, loading, error };
}
