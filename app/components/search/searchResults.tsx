"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useJourneySearch } from "@/lib/hooks/useJourneySearch";
import { useJourneyInfo } from "@/lib/context/journeyInfoContext";
import JourneyDetail from "./JourneyDetail";
import SplitAnalysisLoading from "./SplitAnalysisLoading";
import type { Journey } from "@/lib/types";

/**
 * Score a journey against the matching params from the share-link URL.
 * Higher score = better match. Matches train names against both line.name
 * and line.fahrtNr to support plain train numbers (e.g. "11219").
 */
function scoreJourney(
	journey: Journey,
	matchTrains: string[],
	matchArrivalTime: string | null,
): number {
	let score = 0;

	if (matchTrains.length > 0) {
		const journeyTrainIds = journey.legs
			.filter((l) => l.line)
			.flatMap((l) =>
				[l.line!.name, l.line!.fahrtNr].filter((v): v is string => !!v),
			);

		for (const candidate of matchTrains) {
			if (
				journeyTrainIds.some(
					(id) =>
						id.includes(candidate) ||
						candidate.includes(id) ||
						id === candidate,
				)
			) {
				score += 10;
			}
		}
	}

	if (matchArrivalTime) {
		const lastLeg = journey.legs[journey.legs.length - 1];
		const arrival = lastLeg.arrival ?? lastLeg.plannedArrival;
		if (arrival) {
			const arrTime = new Date(arrival).toLocaleTimeString("de-DE", {
				hour: "2-digit",
				minute: "2-digit",
			});
			if (arrTime === matchArrivalTime) score += 5;
		}
	}

	return score;
}

export default function SearchResults() {
	const { data, loading, error, searchParams } = useJourneySearch();
	const { setPrice } = useJourneyInfo();
	const urlParams = useSearchParams();

	const matchTrains = useMemo(() => {
		const raw = urlParams.get("matchTrains");
		return raw ? raw.split(",").filter(Boolean) : [];
	}, [urlParams]);

	const matchArrivalTime = urlParams.get("matchArrivalTime");

	// Find the journey that best matches the share-link criteria
	const matchedJourney = useMemo<Journey | null>(() => {
		if (!data?.journeys?.length) return null;
		if (matchTrains.length === 0 && !matchArrivalTime) return data.journeys[0];

		let best: Journey | null = null;
		let bestScore = -1;

		for (const j of data.journeys) {
			const s = scoreJourney(j, matchTrains, matchArrivalTime);
			if (s > bestScore) {
				bestScore = s;
				best = j;
			}
		}

		return best ?? data.journeys[0];
	}, [data, matchTrains, matchArrivalTime]);

	// Sync the matched journey's price into the context so SearchContextBar can display it
	useEffect(() => {
		setPrice(matchedJourney?.price ?? null);
		return () => setPrice(null);
	}, [matchedJourney, setPrice]);

	if (loading) {
		return <SplitAnalysisLoading checkedStations={0} totalStations={0} />;
	}

	if (error) {
		return (
			<div
				role="alert"
				className="p-4 mt-6 bg-red-50 border-2 border-red-200 rounded-2xl font-mono text-sm text-red-700"
			>
				{error}
			</div>
		);
	}

	if (!data || data.journeys.length === 0) {
		return (
			<p className="py-8 text-center font-mono text-gray-500">
				Keine Verbindungen gefunden.
			</p>
		);
	}

	if (!matchedJourney) {
		return (
			<p className="py-8 text-center font-mono text-gray-500">
				Keine passende Verbindung gefunden.
			</p>
		);
	}

	return <JourneyDetail journey={matchedJourney} searchParams={searchParams} />;
}
