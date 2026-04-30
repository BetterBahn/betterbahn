"use client";

import { useEffect, useMemo } from "react";
import { Journey, JourneySearchParams } from "@/lib/types";
import { useSplit } from "@/lib/hooks/useSplit";
import SplitAnalysisLoading from "./SplitAnalysisLoading";
import SplitOptionCard from "./SplitOptionCard";

interface JourneyDetailProps {
	journey: Journey;
	searchParams: JourneySearchParams;
}

export default function JourneyDetail({
	journey,
	searchParams,
}: JourneyDetailProps) {
	const { result, checkSplitOptions } = useSplit();
	const splitSearchParams = useMemo<JourneySearchParams>(
		() => ({
			from: searchParams.from,
			to: searchParams.to,
			departure: searchParams.departure,
			age: searchParams.age,
			deutschlandTicketDiscount: searchParams.deutschlandTicketDiscount,
			firstClass: searchParams.firstClass,
			loyaltyCard: searchParams.loyaltyCard,
			tickets: searchParams.tickets,
			splitIncludeTransferStations: searchParams.splitIncludeTransferStations,
			splitAllowOtherTrains: searchParams.splitAllowOtherTrains,
			splitMaxArrivalDeviation: searchParams.splitMaxArrivalDeviation,
		}),
		[
			searchParams.age,
			searchParams.deutschlandTicketDiscount,
			searchParams.departure,
			searchParams.firstClass,
			searchParams.from,
			searchParams.loyaltyCard,
			searchParams.splitAllowOtherTrains,
			searchParams.splitIncludeTransferStations,
			searchParams.splitMaxArrivalDeviation,
			searchParams.tickets,
			searchParams.to,
		],
	);

	useEffect(() => {
		checkSplitOptions(journey, splitSearchParams);
	}, [checkSplitOptions, journey, splitSearchParams]);

	const topSkipReasons = result.diagnostics.skipReasons.slice(0, 3);
	const missingFareStations = result.diagnostics.missingFareStations;

	return (
		<div className="w-full pt-6">
			{/* Remarks */}
			{journey.remarks && journey.remarks.length > 0 && (
				<div className="mb-4 p-3 bg-red-500 rounded-xl">
					{journey.remarks.map((remark, rIndex) => (
						<p key={rIndex} className="text-white font-mono text-sm">
							{typeof remark === "string"
								? remark
								: remark.text || remark.summary}
						</p>
					))}
				</div>
			)}

			{/* Split Ticketing Analyse */}
			<div className="pt-6">
				{/* Loading */}
				{result.loading && (
					<SplitAnalysisLoading
						checkedStations={result.checkedStations}
						totalStations={result.totalStations}
					/>
				)}

				{/* Error */}
				{result.error && !result.loading && (
					<div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
						<p className="text-red-700 font-mono">{result.error}</p>
					</div>
				)}

				{/* Keine Einsparungen */}
				{!result.loading &&
					!result.error &&
					result.splits.length === 0 &&
					result.checkedStations > 0 && (
						<div className="py-6 text-center">
							<p className="font-mono text-lg">
								Keine günstigeren Split-Optionen gefunden.
							</p>
							<p className="font-mono text-gray-600 mt-2">
								{result.checkedStations} Stationen geprüft
							</p>
							{missingFareStations.length > 0 && (
								<p className="font-mono text-sm text-amber-700 mt-2">
									Hinweis: Für einige Teilstrecken wurden keine Ticketpreise
									geliefert ({missingFareStations.slice(0, 3).join(", ")}
									{missingFareStations.length > 3 ? ", ..." : ""}).
								</p>
							)}
							{topSkipReasons.length > 0 && (
								<p className="font-mono text-xs text-gray-500 mt-2">
									Häufigste Ausschlussgründe:{" "}
									{topSkipReasons
										.map((r) => `${r.reason} (${r.count})`)
										.join(" • ")}
								</p>
							)}
						</div>
					)}

				{/* Split-Optionen */}
				{!result.loading && result.splits.length > 0 && (
					<div>
						<div className="flex items-center justify-between mb-4">
							<p className="font-mono text-sm text-gray-500">
								{result.splits.length} günstigere Option
								{result.splits.length !== 1 ? "en" : ""} gefunden
							</p>
						</div>
						<div className="space-y-8">
							{result.splits.map((split, idx) => (
								<SplitOptionCard
									key={idx}
									split={split}
									journey={journey}
									searchParams={searchParams}
									originalPrice={result.originalPrice}
									isLast={idx === result.splits.length - 1}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
