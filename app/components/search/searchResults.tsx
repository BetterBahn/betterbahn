"use client";

import { useEffect, useRef, useState } from "react";
import { useJourneySearch } from "@/lib/hooks/useJourneySearch";
import type { Journey, JourneyResponse } from "@/lib/types";
import JourneyCard from "./JourneyCard";

interface ShareMatchData {
	departureTime: string;
	arrivalTime?: string;
	trainNames: string[];
	departurePlatform?: string;
	arrivalPlatform?: string;
}

/**
 * Prüft, ob eine Journey mit den geparsten Share-Daten übereinstimmt.
 * Kriterien: Abfahrtszeit, Ankunftszeit, Zugnamen, Gleise.
 */
function matchJourney(journey: Journey, matchData: ShareMatchData): boolean {
	const firstLeg = journey.legs[0];
	const lastLeg = journey.legs[journey.legs.length - 1];

	// 1. Abfahrtszeit (HH:MM)
	const depTime = firstLeg.plannedDeparture || firstLeg.departure;
	if (!depTime) return false;
	const depDate = new Date(depTime);
	const depHHMM = `${String(depDate.getHours()).padStart(2, "0")}:${String(depDate.getMinutes()).padStart(2, "0")}`;
	if (depHHMM !== matchData.departureTime) return false;

	// 2. Ankunftszeit (HH:MM)
	if (matchData.arrivalTime) {
		const arrTime = lastLeg.plannedArrival || lastLeg.arrival;
		if (arrTime) {
			const arrDate = new Date(arrTime);
			const arrHHMM = `${String(arrDate.getHours()).padStart(2, "0")}:${String(arrDate.getMinutes()).padStart(2, "0")}`;
			if (arrHHMM !== matchData.arrivalTime) return false;
		}
	}

	// 3. Zugnamen (alle aus dem Share-Text müssen in der Journey vorkommen)
	if (matchData.trainNames.length > 0) {
		const journeyTrainNames = journey.legs
			.filter((l) => l.line)
			.map((l) => l.line!.name);
		const allMatch = matchData.trainNames.every((tn) =>
			journeyTrainNames.some((jtn) => jtn === tn),
		);
		if (!allMatch) return false;
	}

	// 4. Abfahrtsgleis (nur ablehnen wenn API ein anderes Gleis meldet)
	if (matchData.departurePlatform) {
		const firstStopover = firstLeg.stopovers?.[0];
		const apiPlatform =
			firstStopover?.departurePlatform ??
			firstStopover?.plannedDeparturePlatform;
		if (apiPlatform && String(apiPlatform) !== matchData.departurePlatform) {
			return false;
		}
	}

	// 5. Ankunftsgleis
	if (matchData.arrivalPlatform) {
		const lastStopover = lastLeg.stopovers?.[lastLeg.stopovers.length - 1];
		const apiPlatform =
			lastStopover?.arrivalPlatform ?? lastStopover?.plannedArrivalPlatform;
		if (apiPlatform && String(apiPlatform) !== matchData.arrivalPlatform) {
			return false;
		}
	}

	return true;
}

export default function SearchResults() {
	const { data, loading, error, searchParams } = useJourneySearch();
	const [autoExpandIndex, setAutoExpandIndex] = useState<number | null>(null);
	const [matchedIndices, setMatchedIndices] = useState<number[] | null>(null);
	const lastProcessedData = useRef<JourneyResponse | null>(null);

	console.log("Journey Search Data:", data);

	// Nach dem Laden: Share-Match prüfen
	useEffect(() => {
		if (loading) {
			setMatchedIndices(null);
			setAutoExpandIndex(null);
			return;
		}

		if (!data?.journeys || data === lastProcessedData.current) return;
		lastProcessedData.current = data;

		const matchDataStr = sessionStorage.getItem("shareMatchData");
		if (!matchDataStr) {
			setMatchedIndices(null);
			setAutoExpandIndex(null);
			return;
		}

		sessionStorage.removeItem("shareMatchData");

		try {
			const matchData: ShareMatchData = JSON.parse(matchDataStr);
			const indices = data.journeys.reduce<number[]>((acc, journey, index) => {
				if (matchJourney(journey, matchData)) acc.push(index);
				return acc;
			}, []);

			if (indices.length === 1) {
				// Genau 1 Treffer → direkt Split-Analyse starten
				setMatchedIndices(indices);
				setAutoExpandIndex(indices[0]);
			} else if (indices.length > 1) {
				// Mehrere Treffer → nur diese anzeigen, Nutzer wählt
				setMatchedIndices(indices);
				setAutoExpandIndex(null);
			} else {
				// Kein Treffer → alle anzeigen (Fallback)
				setMatchedIndices(null);
				setAutoExpandIndex(null);
			}
		} catch {
			setMatchedIndices(null);
			setAutoExpandIndex(null);
		}
	}, [data, loading]);

	// Loading state
	if (loading) {
		return (
			<div className="flex justify-center items-center p-8">
				<div className="text-lg font-mono">Suche Verbindungen...</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
				<p className="text-red-700 font-mono">Fehler: {error}</p>
			</div>
		);
	}

	// No results yet
	if (!data || !data.journeys || data.journeys.length === 0) {
		return (
			<div className="p-4 text-center font-mono text-gray-600">
				Keine Verbindungen gefunden.
			</div>
		);
	}

	// Gefilterte oder alle Verbindungen anzeigen
	const journeysToShow = matchedIndices
		? matchedIndices.map((i) => ({
				journey: data.journeys[i],
				originalIndex: i,
			}))
		: data.journeys.map((journey, index) => ({
				journey,
				originalIndex: index,
			}));

	// Display results
	return (
		<div className="w-full ">
			<h2 className="text-xl mb-6 font-bold font-mono ">
				{matchedIndices?.length === 1
					? "Deine Verbindung"
					: `${journeysToShow.length} Verbindung${journeysToShow.length !== 1 ? "en" : ""} gefunden`}
			</h2>

			<div className="flex flex-col gap-4">
				{journeysToShow.map(({ journey, originalIndex }) => (
					<JourneyCard
						key={originalIndex}
						journey={journey}
						index={originalIndex}
						searchParams={searchParams}
						autoExpand={autoExpandIndex === originalIndex}
					/>
				))}
			</div>
		</div>
	);
}
