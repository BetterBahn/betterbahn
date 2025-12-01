"use client";

import { useState } from "react";
import { Journey, JourneySearchParams } from "@/lib/types";
import { useSplit } from "@/lib/hooks/useSplit";
import {
	isFullJourneyDeutschlandTicketEligible,
	isDeutschlandTicketEligible,
} from "@/lib/utils/deutschlandTicket";

interface JourneyCardProps {
	journey: Journey;
	index: number;
	searchParams: JourneySearchParams;
}

export default function JourneyCard({
	journey,
	index,
	searchParams,
}: JourneyCardProps) {
	const [showSplitResults, setShowSplitResults] = useState(false);
	const { result, checkSplitOptions } = useSplit();

	const formatTime = (time: string | undefined) => {
		return time
			? new Date(time).toLocaleTimeString("de-DE", {
					hour: "2-digit",
					minute: "2-digit",
			  })
			: "??:??";
	};

	const isEligibleForDeutschlandTicket = () => {
		// Only check if Deutschland Ticket is enabled in search
		if (!searchParams.deutschlandTicketDiscount) {
			return false;
		}

		// Use centralized utility to check eligibility based on "9G" remark code
		return isFullJourneyDeutschlandTicketEligible(journey.legs);
	};

	const getFirstLegDeparture = () => {
		const firstLeg = journey.legs[0] as any;
		const time = firstLeg?.departure || firstLeg?.plannedDeparture;
		return formatTime(time);
	};

	const getLastLegArrival = () => {
		const lastLeg = journey.legs[journey.legs.length - 1] as any;
		const time = lastLeg?.arrival || lastLeg?.plannedArrival;
		return formatTime(time);
	};

	const handleCardClick = () => {
		if (!showSplitResults) {
			setShowSplitResults(true);
			checkSplitOptions(journey, searchParams);
		} else {
			setShowSplitResults(false);
		}
	};

	return (
		<div
			onClick={handleCardClick}
			className="border-2 border-gray-800 rounded-3xl p-4 hover:border-primary hover:shadow-lg transition-all cursor-pointer"
		>
			{/* Remarks Section */}
			{journey.remarks && journey.remarks.length > 0 && (
				<div className="mb-3 p-3 bg-red-500">
					{journey.remarks.map((remark, rIndex) => {
						const remarkObj = remark as any;
						return (
							<p key={rIndex} className="text-white font-mono text-sm">
								{typeof remark === "string"
									? remark
									: remarkObj.text || remarkObj.summary}
							</p>
						);
					})}
				</div>
			)}

			{/* Journey Overview */}
			<div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-300">
				<div className="flex items-center gap-3">
					<div className="font-mono">
						<span className="font-bold text-lg">{getFirstLegDeparture()}</span>
						<span className="text-gray-500 mx-2">→</span>
						<span className="font-bold text-lg">{getLastLegArrival()}</span>
					</div>
					<span
						className={`text-gray-400 transition-transform duration-300 ${
							showSplitResults ? "rotate-180" : ""
						}`}
					>
						▼
					</span>
				</div>
				<div className="flex items-center gap-3">
					{isEligibleForDeutschlandTicket() && (
						<span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold font-mono px-3 py-1 rounded-full border-2 border-green-300">
							<span>✓</span>
							<span>Deutschland-Ticket</span>
						</span>
					)}
					{journey.price && (
						<span className="font-mono font-bold text-primary text-lg">
							{journey.price.amount.toFixed(2)} {journey.price.currency}
						</span>
					)}
				</div>
			</div>

			{/* Journey Legs */}
			<div className="space-y-3">
				{journey.legs.map(
					(leg, legIndex) =>
						leg.line && (
							<div key={legIndex} className="font-mono text-sm">
								<div className="flex items-center gap-2 mb-1">
									<span className="inline-block bg-gray-200 px-2 py-1 rounded font-semibold">
										{leg.line.name}
									</span>
								</div>
								<div className="flex items-center gap-2 text-gray-700">
									<span className="font-bold">
										{formatTime(
											(leg as any).departure || (leg as any).plannedDeparture
										)}
									</span>
									<span>{leg.origin.name}</span>
									<span className="text-gray-400">→</span>
									<span className="font-bold">
										{formatTime(
											(leg as any).arrival || (leg as any).plannedArrival
										)}
									</span>
									<span>{leg.destination.name}</span>
								</div>
							</div>
						)
				)}
			</div>

			{/* Split Ticketing Results (Inline Expansion) */}
			{showSplitResults && (
				<div className="mt-6 border-t-2 border-gray-300 pt-6 animate-in slide-in-from-top duration-300">
					{/* Loading State */}
					{result.loading && (
						<div className="py-6">
							<p className="font-mono text-lg mb-2">
								Prüfe Preise für {result.totalStations} Stationen...
							</p>
							<p className="font-mono text-primary mb-3">
								{result.checkedStations} / {result.totalStations} geprüft
							</p>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-primary h-2 rounded-full transition-all duration-300"
									style={{
										width: `${
											(result.checkedStations / result.totalStations) * 100
										}%`,
									}}
								/>
							</div>
						</div>
					)}

					{/* Error State */}
					{result.error && !result.loading && (
						<div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
							<p className="text-red-700 font-mono">{result.error}</p>
						</div>
					)}

					{/* No Savings Found */}
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
							</div>
						)}

					{/* Split Options */}
					{!result.loading && result.splits.length > 0 && (
						<div>
							<div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
								<p className="font-mono font-bold text-green-800">
									{result.splits.length} günstigere Option
									{result.splits.length !== 1 ? "en" : ""} gefunden!
								</p>
								<p className="font-mono text-sm text-gray-600 mt-1">
									Originalpreis: {result.originalPrice.toFixed(2)} EUR
								</p>
							</div>

							<div className="space-y-3">
								{result.splits.map((split, idx) => (
									<div
										key={idx}
										className="border-2 border-gray-300 rounded-2xl p-4 hover:border-green-500 transition-colors bg-white"
									>
										<div className="flex justify-between items-start mb-3">
											<div>
												<p className="font-mono font-bold text-lg text-green-600">
													Spare {split.savings.toFixed(2)} EUR
												</p>
												<p className="font-mono text-sm text-gray-600">
													({split.savingsPercentage.toFixed(1)}% günstiger)
												</p>
											</div>
											<div className="text-right">
												<p className="font-mono font-bold text-lg">
													{split.totalPrice.toFixed(2)} EUR
												</p>
												<p className="font-mono text-xs text-gray-500 line-through">
													{result.originalPrice.toFixed(2)} EUR
												</p>
											</div>
										</div>

										<div className="border-t border-gray-200 pt-3">
											<p className="font-mono font-semibold mb-2 text-sm text-gray-700">
												Split-Punkt: {split.splitStation.name}
											</p>

											<div className="space-y-1 font-mono text-sm">
												<div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
													<span className="text-gray-700">
														{journey.legs[0].origin.name} →{" "}
														{split.splitStation.name}
													</span>
													<span className="font-semibold flex items-center gap-2">
														{split.firstLegPrice === 0 ? (
															<>
																<span className="text-green-600">0.00 EUR</span>
																<span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
																	D-Ticket
																</span>
															</>
														) : (
															`${split.firstLegPrice.toFixed(2)} EUR`
														)}
													</span>
												</div>
												<div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
													<span className="text-gray-700">
														{split.splitStation.name} →{" "}
														{
															journey.legs[journey.legs.length - 1].destination
																.name
														}
													</span>
													<span className="font-semibold flex items-center gap-2">
														{split.secondLegPrice === 0 ? (
															<>
																<span className="text-green-600">0.00 EUR</span>
																<span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
																	D-Ticket
																</span>
															</>
														) : (
															`${split.secondLegPrice.toFixed(2)} EUR`
														)}
													</span>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
