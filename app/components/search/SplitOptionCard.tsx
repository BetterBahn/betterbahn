"use client";

import type {
	Journey,
	JourneyLeg,
	JourneySearchParams,
	SplitOption,
} from "@/lib/types";
import {
	createDbBookingUrl,
	bahnCardCodeFromLoyaltyCard,
} from "@/lib/utils/createDbUrl";
import { formatTime } from "@/lib/utils/formatDate";
import PriceTag from "./PriceTag";
import SegmentLink from "./SegmentLink";

/**
 * Determines which train names belong to each ticket leg.
 * Prefers journey leg data from the resolved split; falls back to a positional
 * split of the original journey legs at the split station.
 */
function computeTrainNames(
	split: SplitOption,
	legsWithLine: JourneyLeg[],
): [string[], string[]] {
	if (split.firstLegJourney && split.secondLegJourney) {
		return [
			split.firstLegJourney.legs.filter((l) => l.line).map((l) => l.line!.name),
			split.secondLegJourney.legs
				.filter((l) => l.line)
				.map((l) => l.line!.name),
		];
	}

	// Fallback: walk the original legs and split at the split station
	const t1: string[] = [];
	const t2: string[] = [];
	let afterSplit = false;

	for (const leg of legsWithLine) {
		if (!afterSplit) {
			t1.push(leg.line!.name);
			const hitsDestination =
				leg.destination.id === split.splitStation.id ||
				leg.destination.name === split.splitStation.name;
			const hitsMidLeg = leg.stopovers?.some(
				(s) =>
					s.stop?.id === split.splitStation.id ||
					s.stop?.name === split.splitStation.name,
			);
			if (hitsDestination || hitsMidLeg) {
				afterSplit = true;
				if (hitsMidLeg && !hitsDestination) {
					t2.push(leg.line!.name);
				}
			}
		} else {
			t2.push(leg.line!.name);
		}
	}

	return [t1, t2];
}

interface SplitOptionCardProps {
	split: SplitOption;
	journey: Journey;
	searchParams: JourneySearchParams;
	originalPrice: number;
	isLast: boolean;
}

/** Renders a single split-ticketing option including the train bar and prices. */
export default function SplitOptionCard({
	split,
	journey,
	searchParams,
	originalPrice,
	isLast,
}: SplitOptionCardProps) {
	const travelClass = searchParams.firstClass ? 1 : 2;
	const bahnCard = bahnCardCodeFromLoyaltyCard(searchParams.loyaltyCard);
	const hasDTicket = !!searchParams.deutschlandTicketDiscount;

	const firstLegUrl = split.firstLegJourney
		? createDbBookingUrl(
				split.firstLegJourney,
				travelClass,
				hasDTicket,
				bahnCard,
			)
		: null;
	const secondLegUrl = split.secondLegJourney
		? createDbBookingUrl(
				split.secondLegJourney,
				travelClass,
				hasDTicket,
				bahnCard,
			)
		: null;

	const originName = journey.legs[0].origin.name;
	const destName = journey.legs[journey.legs.length - 1].destination.name;
	const firstLeg = journey.legs[0];
	const lastLeg = journey.legs[journey.legs.length - 1];
	const departureTime = firstLeg?.departure ?? firstLeg?.plannedDeparture;
	const arrivalTime = lastLeg?.arrival ?? lastLeg?.plannedArrival;

	const legsWithLine = journey.legs.filter((l) => l.line);
	const [t1Trains, t2Trains] = computeTrainNames(split, legsWithLine);

	return (
		<div className="font-mono">
			{/* Savings Header */}
			<div className="flex items-center justify-between mb-3">
				<div>
					<div className="flex items-center gap-2">
						<span className="font-bold text-lg text-green-700">
							−{split.savings.toFixed(2)} €
						</span>
						<span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-semibold">
							{split.savingsPercentage.toFixed(0)}% günstiger
						</span>
					</div>
					<p className="text-xs text-gray-600 mt-0.5">
						Split in {split.splitStation.name}
					</p>
				</div>
				<span className="font-bold text-lg">
					{split.totalPrice.toFixed(2)} €
				</span>
			</div>

			{/* Originalpreis durchgestrichen */}
			<div className="text-xs text-gray-400 mb-2">
				<span className="line-through">{originalPrice.toFixed(2)} €</span>
				<span className="ml-1">bisher</span>
			</div>

			{/* DB-Stil Zugbalken mit Split */}
			<div>
				{/* Ticket-Label + Preis – proportional zur Zuganzahl */}
				<div className="flex items-center gap-2 mb-1">
					<div
						className="flex items-center gap-1 min-w-0"
						style={{ flex: t1Trains.length }}
					>
						<span className="text-[10px] text-gray-600 font-semibold whitespace-nowrap">
							Ticket 1
						</span>
						<PriceTag price={split.firstLegPrice} />
					</div>
					<div
						className="flex items-center justify-end gap-1 min-w-0"
						style={{ flex: t2Trains.length }}
					>
						<PriceTag price={split.secondLegPrice} />
						<span className="text-[10px] text-gray-600 font-semibold whitespace-nowrap">
							Ticket 2
						</span>
					</div>
				</div>

				{/* Train bar – equal width per train */}
				<div className="flex w-full gap-0.5 items-stretch">
					{/* Ticket 1 segment */}
					<SegmentLink
						url={firstLegUrl}
						className="flex gap-0.5 min-w-0 group/t1"
						style={{ flex: t1Trains.length }}
					>
						{t1Trains.map((name, i) => (
							<div
								key={i}
								className="flex-1 min-w-0 overflow-hidden bg-gray-700 group-hover/t1:bg-gray-800 transition-colors text-white text-xs font-semibold text-center py-1 first:rounded-l last:rounded-r"
							>
								<span className="block truncate px-1">
									{name}
									{firstLegUrl && i === t1Trains.length - 1 && (
										<span className="ml-0.5 opacity-50 group-hover/t1:opacity-100">
											↗
										</span>
									)}
								</span>
							</div>
						))}
					</SegmentLink>

					{/* Split divider */}
					<div className="shrink-0 flex items-center" aria-hidden="true">
						<div className="w-0.5 h-5 bg-gray-300 rounded-full" />
					</div>

					{/* Ticket 2 segment */}
					<SegmentLink
						url={secondLegUrl}
						className="flex gap-0.5 min-w-0 group/t2"
						style={{ flex: t2Trains.length }}
					>
						{t2Trains.map((name, i) => (
							<div
								key={i}
								className="flex-1 min-w-0 overflow-hidden bg-gray-500 group-hover/t2:bg-gray-600 transition-colors text-white text-xs font-semibold text-center py-1 first:rounded-l last:rounded-r"
							>
								<span className="block truncate px-1">
									{name}
									{secondLegUrl && i === t2Trains.length - 1 && (
										<span className="ml-0.5 opacity-50 group-hover/t2:opacity-100">
											↗
										</span>
									)}
								</span>
							</div>
						))}
					</SegmentLink>
				</div>

				{/* Time + station labels row */}
				<div className="flex justify-between gap-2 mt-1.5">
					<div className="text-left min-w-0">
						<div className="text-[10px] font-semibold text-gray-700">
							{formatTime(departureTime)}
						</div>
						<div className="text-[10px] text-gray-500 leading-tight truncate">
							{originName}
						</div>
					</div>
					<div className="text-right min-w-0">
						<div className="text-[10px] font-semibold text-gray-700">
							{formatTime(arrivalTime)}
						</div>
						<div className="text-[10px] text-gray-500 leading-tight truncate">
							{destName}
						</div>
					</div>
				</div>
			</div>

			{!isLast && <div className="border-t border-gray-200 mt-6" />}
		</div>
	);
}
