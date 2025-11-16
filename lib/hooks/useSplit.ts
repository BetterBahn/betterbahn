"use client";

import { useState, useCallback } from "react";
import type {
	Journey,
	JourneySearchParams,
	SplitOption,
	SplitTicketingResult,
	Stopover,
} from "@/lib/types";

/**
 * Hook to find cheaper ticket prices by splitting a journey at intermediate stopovers
 *
 * @param journey - The original journey to check for split options
 * @param searchParams - The original search parameters used to find the journey
 * @returns Object containing split options, loading state, and error
 */
export function useSplit() {
	const [result, setResult] = useState<SplitTicketingResult>({
		originalPrice: 0,
		splits: [],
		loading: false,
		error: null,
		checkedStations: 0,
		totalStations: 0,
	});

	/**
	 * Extract all stopovers from all legs of the journey
	 */
	const extractStopovers = useCallback((journey: Journey): Stopover[] => {
		const allStopovers: Stopover[] = [];

		journey.legs.forEach((leg) => {
			if (leg.stopovers && leg.stopovers.length > 0) {
				// Skip first and last stopover (origin and destination of the leg)
				// as they're already covered by leg boundaries
				const intermediateStops = leg.stopovers.slice(1, -1);
				allStopovers.push(...intermediateStops);
			}
		});

		// Also add transfer points between legs (where one leg ends and another begins)
		if (journey.legs.length > 1) {
			journey.legs.forEach((leg, index) => {
				if (index < journey.legs.length - 1) {
					// Add the destination of this leg as a potential split point
					allStopovers.push({
						stop: {
							id: leg.destination.id || "",
							name: leg.destination.name,
							type: leg.destination.type,
						},
						arrival: leg.arrival,
						plannedArrival: leg.plannedArrival,
						departure: journey.legs[index + 1].departure,
						plannedDeparture: journey.legs[index + 1].plannedDeparture,
					});
				}
			});
		}

		return allStopovers;
	}, []);

	/**
	 * Fetch journey price for a specific route
	 */
	const fetchJourneyPrice = useCallback(
		async (
			fromStationId: string,
			toStationId: string,
			departure: string,
			searchParams: JourneySearchParams
		): Promise<{ price: number | null; journey: Journey | null }> => {
			try {
				// Build API URL with search parameters
				const params = new URLSearchParams({
					from: fromStationId,
					to: toStationId,
					departure: departure,
					results: "1", // We only need the first/cheapest result
					stopovers: "false", // Don't need stopovers for price checks
					...(searchParams.age && { age: searchParams.age }),
					...(searchParams.deutschlandTicketDiscount && {
						"deutschlandTicket.discount": "true",
					}),
					...(searchParams.firstClass && { firstClass: "true" }),
					...(searchParams.loyaltyCard && {
						loyaltyCard: searchParams.loyaltyCard,
					}),
					tickets: "true", // Always get ticket prices
				});

				const apiUrl = `https://v6.db.transport.rest/journeys?${params.toString()}`;
				const response = await fetch(apiUrl);

				if (!response.ok) {
					console.error(`API error for ${fromStationId} -> ${toStationId}`);
					return { price: null, journey: null };
				}

				const data = await response.json();

				if (data.journeys && data.journeys.length > 0) {
					const journey = data.journeys[0];
					const price = journey.price?.amount;
					return { price: price || null, journey };
				}

				return { price: null, journey: null };
			} catch (error) {
				console.error(
					`Error fetching price for ${fromStationId} -> ${toStationId}:`,
					error
				);
				return { price: null, journey: null };
			}
		},
		[]
	);

	/**
	 * Main function to check for split ticket options
	 */
	const checkSplitOptions = useCallback(
		async (journey: Journey, searchParams: JourneySearchParams) => {
			// Validate input
			if (!journey.price?.amount) {
				setResult({
					originalPrice: 0,
					splits: [],
					loading: false,
					error: "Journey has no price information",
					checkedStations: 0,
					totalStations: 0,
				});
				return;
			}

			const originalPrice = journey.price.amount;
			const originalOrigin = journey.legs[0].origin;
			const originalDestination =
				journey.legs[journey.legs.length - 1].destination;
			const originalDeparture =
				journey.legs[0].departure || journey.legs[0].plannedDeparture;

			if (!originalDeparture) {
				setResult({
					originalPrice,
					splits: [],
					loading: false,
					error: "Journey has no departure time",
					checkedStations: 0,
					totalStations: 0,
				});
				return;
			}

			// Extract all stopovers
			const stopovers = extractStopovers(journey);

			if (stopovers.length === 0) {
				setResult({
					originalPrice,
					splits: [],
					loading: false,
					error: "No stopovers found in this journey",
					checkedStations: 0,
					totalStations: 0,
				});
				return;
			}

			// Set loading state
			setResult({
				originalPrice,
				splits: [],
				loading: true,
				error: null,
				checkedStations: 0,
				totalStations: stopovers.length,
			});

			const splitOptions: SplitOption[] = [];
			let checkedCount = 0;

			// Check each stopover as a potential split point
			for (const stopover of stopovers) {
				const splitStation = stopover.stop;

				if (!splitStation.id || !originalOrigin.id || !originalDestination.id) {
					checkedCount++;
					setResult((prev) => ({
						...prev,
						checkedStations: checkedCount,
					}));
					continue;
				}

				try {
					// Fetch prices for both legs in parallel
					const [firstLegResult, secondLegResult] = await Promise.all([
						fetchJourneyPrice(
							originalOrigin.id,
							splitStation.id,
							originalDeparture,
							searchParams
						),
						fetchJourneyPrice(
							splitStation.id,
							originalDestination.id,
							stopover.departure ||
								stopover.plannedDeparture ||
								originalDeparture,
							searchParams
						),
					]);

					// Check if both legs have valid prices
					if (firstLegResult.price !== null && secondLegResult.price !== null) {
						const totalPrice = firstLegResult.price + secondLegResult.price;
						const savings = originalPrice - totalPrice;

						// Only add if there are actual savings
						if (savings > 0) {
							splitOptions.push({
								splitStation,
								firstLegPrice: firstLegResult.price,
								secondLegPrice: secondLegResult.price,
								totalPrice,
								savings,
								savingsPercentage: (savings / originalPrice) * 100,
								firstLegJourney: firstLegResult.journey || undefined,
								secondLegJourney: secondLegResult.journey || undefined,
							});
						}
					}
				} catch (error) {
					console.error(`Error checking split at ${splitStation.name}:`, error);
				}

				checkedCount++;

				// Update progress
				setResult((prev) => ({
					...prev,
					checkedStations: checkedCount,
					splits: [...splitOptions].sort((a, b) => b.savings - a.savings),
				}));
			}

			// Sort by savings (highest first) and set final result
			splitOptions.sort((a, b) => b.savings - a.savings);

			setResult({
				originalPrice,
				splits: splitOptions,
				loading: false,
				error: null,
				checkedStations: checkedCount,
				totalStations: stopovers.length,
			});
		},
		[extractStopovers, fetchJourneyPrice]
	);

	return {
		result,
		checkSplitOptions,
	};
}
