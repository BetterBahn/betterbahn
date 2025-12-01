"use client";

import { useState, useCallback } from "react";
import type {
	Journey,
	JourneyLeg,
	JourneySearchParams,
	SplitOption,
	SplitTicketingResult,
	Stopover,
} from "@/lib/types";
import { calculateLegPrice } from "@/lib/utils/deutschlandTicket";

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
					results: "3", // Get multiple results to find matching journey
					stopovers: "true", // Need stopovers for validation
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
					const originalPrice = journey.price?.amount;

					// Calculate effective price considering Deutschland-Ticket
					// If user has Deutschland-Ticket (deutschlandTicketDiscount = true),
					// check each leg and set price to 0 if eligible
					let effectivePrice = originalPrice;

					// Check if journey is Deutschland-Ticket eligible
					if (searchParams.deutschlandTicketDiscount) {
						// Check if all legs are Deutschland-Ticket eligible
						const allLegsEligible = journey.legs.every((leg: JourneyLeg) => {
							if (!leg.line) return true; // Walking legs don't count
							return calculateLegPrice(leg, 1, true) === 0;
						});

						if (allLegsEligible) {
							// Journey is covered by Deutschland-Ticket
							effectivePrice = 0;
							console.log(
								`   Deutschland-Ticket eligible: ${fromStationId} -> ${toStationId} (Price: 0 EUR)`
							);
						}
					}

					// If we still don't have a price and it's not Deutschland-Ticket eligible,
					// treat it as a failed price fetch
					if (effectivePrice === null || effectivePrice === undefined) {
						// Last check: is it Deutschland-Ticket eligible even without API price?
						if (searchParams.deutschlandTicketDiscount) {
							const allLegsEligible = journey.legs.every((leg: JourneyLeg) => {
								if (!leg.line) return true;
								return calculateLegPrice(leg, 1, true) === 0;
							});

							if (allLegsEligible) {
								console.log(
									`   No API price but Deutschland-Ticket eligible: ${fromStationId} -> ${toStationId} (Price: 0 EUR)`
								);
								return { price: 0, journey };
							}
						}
						return { price: null, journey: null };
					}

					return { price: effectivePrice, journey };
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
			console.log("=================================================");
			console.log("STARTING SPLIT TICKETING ANALYSIS");
			console.log("=================================================");

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

			console.log(
				`Original Journey: ${originalOrigin.name} -> ${originalDestination.name}`
			);
			console.log(`Original Price: ${(originalPrice / 100).toFixed(2)} EUR`);
			console.log(`Departure: ${originalDeparture}`);

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
			console.log(`\nFound ${stopovers.length} potential split points:`);
			stopovers.forEach((stopover, idx) => {
				console.log(`  ${idx + 1}. ${stopover.stop.name}`);
			});

			if (stopovers.length === 0) {
				console.log("No stopovers found - cannot check split options");
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

			console.log("\n-------------------------------------------------");
			console.log("Starting split point analysis...");
			console.log("-------------------------------------------------\n");

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

				console.log(
					`\nChecking split point ${checkedCount + 1}/${stopovers.length}: ${
						splitStation.name
					}`
				);
				console.log(
					`   First leg:  ${originalOrigin.name} -> ${splitStation.name}`
				);
				console.log(
					`   Second leg: ${splitStation.name} -> ${originalDestination.name}`
				);

				if (!splitStation.id || !originalOrigin.id || !originalDestination.id) {
					console.log("   Missing station ID - skipping");
					checkedCount++;
					setResult((prev) => ({
						...prev,
						checkedStations: checkedCount,
					}));
					continue;
				}

				try {
					console.log("   Fetching prices for both legs...");

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

					// Check if both legs have valid prices and journeys
					if (
						firstLegResult.price !== null &&
						secondLegResult.price !== null &&
						firstLegResult.journey &&
						secondLegResult.journey
					) {
						console.log(
							`   Got prices: ${(firstLegResult.price / 100).toFixed(
								2
							)} EUR + ${(secondLegResult.price / 100).toFixed(2)} EUR = ${(
								(firstLegResult.price + secondLegResult.price) /
								100
							).toFixed(2)} EUR`
						);

						const totalPrice = firstLegResult.price + secondLegResult.price;
						const savings = originalPrice - totalPrice;

						console.log(
							`   Split total: ${(totalPrice / 100).toFixed(2)} EUR`
						);
						console.log(
							`   Savings: ${(savings / 100).toFixed(2)} EUR (${(
								(savings / originalPrice) *
								100
							).toFixed(1)}%)`
						);

						// Only add if there are actual savings
						if (savings > 0) {
							console.log(`   VALID SPLIT FOUND! Adding to results.`);
							splitOptions.push({
								splitStation,
								firstLegPrice: firstLegResult.price,
								secondLegPrice: secondLegResult.price,
								totalPrice,
								savings,
								savingsPercentage: (savings / originalPrice) * 100,
								firstLegJourney: firstLegResult.journey,
								secondLegJourney: secondLegResult.journey,
							});
						} else {
							console.log(`   No savings with this split - skipping`);
						}
					} else {
						console.log(
							`   Could not fetch prices for one or both legs (First: ${
								firstLegResult.price !== null ? "OK" : "FAILED"
							}, Second: ${secondLegResult.price !== null ? "OK" : "FAILED"})`
						);
					}
				} catch (error) {
					console.error(
						`   Error checking split at ${splitStation.name}:`,
						error
					);
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

			console.log("\n=================================================");
			console.log("SPLIT TICKETING ANALYSIS COMPLETE");
			console.log("=================================================");
			console.log(`Checked: ${checkedCount} split points`);
			console.log(`Found: ${splitOptions.length} money-saving options`);
			if (splitOptions.length > 0) {
				console.log(
					`Best saving: ${(splitOptions[0].savings / 100).toFixed(
						2
					)} EUR at ${splitOptions[0].splitStation.name}`
				);
			}
			console.log("=================================================\n");

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
