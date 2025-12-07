"use client";

import { useJourneySearch } from "@/lib/hooks/useJourneySearch";
import JourneyCard from "./JourneyCard";

export default function SearchResults() {
	// Now searchParams comes directly from the hook - single source of truth!
	const { data, loading, error, searchParams } = useJourneySearch();

	console.log("Journey Search Data:", data);

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

	// Display results
	return (
		<div className="w-full ">
			<h2 className="text-xl mb-6 font-bold font-mono ">
				{data.journeys.length} Verbindung
				{data.journeys.length !== 1 ? "en" : ""} gefunden
			</h2>

			<div className="flex flex-col gap-4">
				{data.journeys.map((journey, index) => (
					<JourneyCard
						key={index}
						journey={journey}
						index={index}
						searchParams={searchParams}
					/>
				))}
			</div>
		</div>
	);
}
