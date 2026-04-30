"use client";

import { useCallback, useRef, useState } from "react";
import { useApiBaseUrl } from "./useApiBaseUrl";
import type {
	Journey,
	JourneyLeg,
	JourneySearchParams,
	SplitTicketingResult,
	SplitOption,
	StopoverStation,
} from "@/lib/types";
import { isFullJourneyDeutschlandTicketEligible } from "@/lib/utils/deutschlandTicket";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function departureOf(leg: JourneyLeg): string | undefined {
	return leg.departure ?? leg.plannedDeparture ?? undefined;
}

function arrivalOf(leg: JourneyLeg): string | undefined {
	return leg.arrival ?? leg.plannedArrival ?? undefined;
}

/** Returns b − a in minutes (positive = b is later). */
function diffMinutes(a: string, b: string): number {
	return (new Date(b).getTime() - new Date(a).getTime()) / 60_000;
}

/**
 * Extract unique non-transfer intermediate stopovers from the journey.
 * Deduplicates by station ID to handle walking-leg repeats.
 */
function extractSplitCandidates(
	journey: Journey,
	includeTransferStations: boolean,
): StopoverStation[] {
	const seen = new Set<string>();
	const candidates: StopoverStation[] = [];

	const originId = journey.legs[0].origin.id ?? "";
	const destId = journey.legs[journey.legs.length - 1].destination.id ?? "";

	// IDs of transfer stations (leg-destination = next leg-origin)
	const transferIds = new Set<string>();
	for (let i = 0; i < journey.legs.length - 1; i++) {
		const id = journey.legs[i].destination.id;
		if (id) transferIds.add(id);
	}

	for (const leg of journey.legs) {
		if (!leg.stopovers) continue;
		for (const stopover of leg.stopovers) {
			const stop = stopover.stop;
			if (!stop?.id) continue;
			if (stop.id === originId || stop.id === destId) continue;
			if (seen.has(stop.id)) continue;
			if (!includeTransferStations && transferIds.has(stop.id)) continue;
			seen.add(stop.id);
			candidates.push(stop);
		}
	}

	return candidates;
}

function findStopoverDeparture(
	journey: Journey,
	stationId: string,
): string | undefined {
	for (const leg of journey.legs) {
		if (!leg.stopovers) continue;
		for (const s of leg.stopovers) {
			if (s.stop?.id === stationId) {
				return s.departure ?? s.plannedDeparture ?? undefined;
			}
		}
	}
	return undefined;
}

function findStopoverArrival(
	journey: Journey,
	stationId: string,
): string | undefined {
	for (const leg of journey.legs) {
		if (!leg.stopovers) continue;
		for (const s of leg.stopovers) {
			if (s.stop?.id === stationId) {
				return s.arrival ?? s.plannedArrival ?? undefined;
			}
		}
	}
	return undefined;
}

/**
 * Returns the effective price of a journey in EUR, considering D-Ticket.
 * Returns null if no price data was provided by the API.
 */
function getEffectivePrice(
	journey: Journey,
	hasDTicket: boolean,
): number | null {
	if (!journey.price) return null;
	const amount = journey.price.amount;
	if (!hasDTicket) return amount;
	if (isFullJourneyDeutschlandTicketEligible(journey.legs)) return 0;
	return amount;
}

/** Major hubs used for hub-aware second-leg search. */
function extractHubs(journey: Journey): { id: string; name: string }[] {
	const hubs: { id: string; name: string }[] = [];
	for (let i = 0; i < journey.legs.length - 1; i++) {
		const dest = journey.legs[i].destination;
		if (dest.id && !hubs.find((h) => h.id === dest.id)) {
			hubs.push({ id: dest.id, name: dest.name });
		}
	}
	return hubs;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_RESULT: SplitTicketingResult = {
	originalPrice: 0,
	splits: [],
	loading: false,
	error: null,
	checkedStations: 0,
	totalStations: 0,
	diagnostics: { missingFareStations: [], skipReasons: [] },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSplit() {
	const baseUrl = useApiBaseUrl();
	const [result, setResult] = useState<SplitTicketingResult>(INITIAL_RESULT);
	// Tracks the AbortController for any in-progress analysis so a new call can
	// cancel the previous one and stop stale setResult calls from interleaving.
	const abortRef = useRef<AbortController | null>(null);

	const checkSplitOptions = useCallback(
		async (journey: Journey, params: JourneySearchParams) => {
			// Cancel the previous run (aborts its fetch calls and marks it stale).
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			const { signal } = controller;
			const originalPrice = journey.price?.amount ?? null;
			if (originalPrice === null) {
				setResult({
					...INITIAL_RESULT,
					error: "Für diese Verbindung wurden keine Ticketpreise geliefert.",
				});
				return;
			}

			const hasDTicket = !!params.deutschlandTicketDiscount;
			const allowOtherTrains = !!params.splitAllowOtherTrains;
			const maxDev = params.splitMaxArrivalDeviation ?? 60;
			const STRICT_TOL = 3; // minutes

			const originId = journey.legs[0].origin.id ?? "";
			const destId = journey.legs[journey.legs.length - 1].destination.id ?? "";
			const originalArrival =
				arrivalOf(journey.legs[journey.legs.length - 1]) ?? "";

			if (!originId || !destId || !originalArrival) {
				setResult({
					...INITIAL_RESULT,
					error: "Verbindungsdaten unvollständig.",
				});
				return;
			}

			const candidates = extractSplitCandidates(
				journey,
				!!params.splitIncludeTransferStations,
			);

			if (candidates.length === 0) {
				setResult({
					...INITIAL_RESULT,
					originalPrice,
					checkedStations: 0,
					totalStations: 0,
				});
				return;
			}

			const hubs = extractHubs(journey);

			setResult({
				originalPrice,
				splits: [],
				loading: true,
				error: null,
				checkedStations: 0,
				totalStations: candidates.length,
				diagnostics: { missingFareStations: [], skipReasons: [] },
			});

			// Base query params shared across all fetch calls
			const baseQs = new URLSearchParams();
			if (params.age) baseQs.set("age", params.age);
			if (params.loyaltyCard) baseQs.set("loyaltyCard", params.loyaltyCard);
			if (params.firstClass) baseQs.set("firstClass", "true");
			baseQs.set("tickets", "true");
			baseQs.set("stopovers", "true");

			const foundSplits: SplitOption[] = [];
			const missingFareStations: string[] = [];
			const skipMap = new Map<string, number>();
			const skip = (reason: string) =>
				skipMap.set(reason, (skipMap.get(reason) ?? 0) + 1);

			const originalDeparture = departureOf(journey.legs[0]) ?? "";

			for (let i = 0; i < candidates.length; i++) {
				if (signal.aborted) return;
				const station = candidates[i];

				setResult((prev) => ({ ...prev, checkedStations: i }));

				const splitDeparture = findStopoverDeparture(journey, station.id);
				if (!splitDeparture) {
					skip("Keine Abfahrtszeit an Splitbahnhof");
					continue;
				}

				const splitArrivalAtStation = findStopoverArrival(journey, station.id);

				try {
					// First leg: origin → splitStation
					const qs1 = new URLSearchParams(baseQs);
					qs1.set("from", originId);
					qs1.set("to", station.id);
					if (originalDeparture) qs1.set("departure", originalDeparture);

					// Second leg: splitStation → destination (direct)
					const qs2 = new URLSearchParams(baseQs);
					qs2.set("from", station.id);
					qs2.set("to", destId);
					qs2.set("departure", splitDeparture);

					// Hub-aware second-leg queries
					const hubPromises = hubs
						.filter((h) => h.id !== station.id)
						.map((hub) => {
							const qsHub = new URLSearchParams(qs2);
							qsHub.set("via", hub.id);
							return fetch(`${baseUrl}/journeys?${qsHub.toString()}`, {
								signal,
							});
						});

					const [res1, res2, ...hubRes] = await Promise.all([
						fetch(`${baseUrl}/journeys?${qs1.toString()}`, { signal }),
						fetch(`${baseUrl}/journeys?${qs2.toString()}`, { signal }),
						...hubPromises,
					]);

					if (!res1.ok || !res2.ok) {
						skip("API-Fehler");
						continue;
					}

					const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

					// Collect all second-leg candidates (direct + hub-aware)
					const hubDataArray: Journey[][] = await Promise.all(
						hubRes.map((r) =>
							r.ok
								? r
										.json()
										.then((d: { journeys?: Journey[] }) => d.journeys ?? [])
								: Promise.resolve([]),
						),
					);

					const firstLegCandidates: Journey[] = data1.journeys ?? [];
					const secondLegCandidates: Journey[] = [
						...(data2.journeys ?? []),
						...hubDataArray.flat(),
					];

					if (!firstLegCandidates.length) {
						skip("Keine Verbindungen für erste Teilstrecke");
						continue;
					}
					if (!secondLegCandidates.length) {
						skip("Keine Verbindungen für zweite Teilstrecke");
						continue;
					}

					// ── Find best first leg ──────────────────────────────────────────
					let bestFirst: Journey | null = null;
					const refArrival = splitArrivalAtStation ?? splitDeparture;

					for (const j of firstLegCandidates) {
						const arr = arrivalOf(j.legs[j.legs.length - 1]);
						if (!arr) continue;
						if (allowOtherTrains) {
							// Must arrive before split departure; prefer latest arrival (min wait)
							if (new Date(arr) > new Date(splitDeparture)) continue;
							if (!bestFirst) {
								bestFirst = j;
								continue;
							}
							const prevArr = arrivalOf(
								bestFirst.legs[bestFirst.legs.length - 1],
							)!;
							if (new Date(arr) > new Date(prevArr)) bestFirst = j;
						} else {
							// Strict: must arrive within ±STRICT_TOL of original stopover arrival
							if (Math.abs(diffMinutes(refArrival, arr)) > STRICT_TOL) continue;
							if (!bestFirst) {
								bestFirst = j;
								continue;
							}
							const prevArr = arrivalOf(
								bestFirst.legs[bestFirst.legs.length - 1],
							)!;
							if (
								Math.abs(diffMinutes(refArrival, arr)) <
								Math.abs(diffMinutes(refArrival, prevArr))
							)
								bestFirst = j;
						}
					}

					if (!bestFirst) {
						skip("Kein passender Zug für erste Teilstrecke");
						continue;
					}

					const firstLegActualArrival = arrivalOf(
						bestFirst.legs[bestFirst.legs.length - 1],
					);
					const firstFullyDTicket =
						hasDTicket &&
						isFullJourneyDeutschlandTicketEligible(bestFirst.legs);

					// ── Find best second leg ─────────────────────────────────────────
					let bestSecond: Journey | null = null;

					for (const j of secondLegCandidates) {
						const dep = departureOf(j.legs[0]);
						const arr = arrivalOf(j.legs[j.legs.length - 1]);
						if (!dep || !arr) continue;

						// Must not depart before first leg arrives (transfer validity)
						if (
							firstLegActualArrival &&
							new Date(dep) < new Date(firstLegActualArrival)
						) {
							skip("Unmöglicher Umstieg");
							continue;
						}

						// Arrival check: one-directional – reject only if later than original beyond tolerance
						const arrDiff = diffMinutes(originalArrival, arr); // positive = later
						if (
							arrDiff >
							(allowOtherTrains || firstFullyDTicket ? maxDev : STRICT_TOL)
						)
							continue;

						if (!allowOtherTrains && !firstFullyDTicket) {
							// Strict: departure must also match within ±STRICT_TOL
							if (Math.abs(diffMinutes(splitDeparture, dep)) > STRICT_TOL)
								continue;
						}

						if (!bestSecond) {
							bestSecond = j;
							continue;
						}
						// Prefer cheapest
						const prevPrice = bestSecond.price?.amount ?? Infinity;
						const currPrice = j.price?.amount ?? Infinity;
						if (currPrice < prevPrice) bestSecond = j;
					}

					if (!bestSecond) {
						skip("Kein passender Zug für zweite Teilstrecke");
						continue;
					}

					// ── Prices ───────────────────────────────────────────────────────
					const firstPrice = getEffectivePrice(bestFirst, hasDTicket);
					const secondPrice = getEffectivePrice(bestSecond, hasDTicket);

					if (firstPrice === null || secondPrice === null) {
						missingFareStations.push(station.name);
						continue;
					}

					const totalSplitPrice = firstPrice + secondPrice;
					const effectiveOriginal = hasDTicket
						? (getEffectivePrice(journey, hasDTicket) ?? originalPrice)
						: originalPrice;
					const savings = effectiveOriginal - totalSplitPrice;

					if (savings <= 0) {
						skip("Keine Ersparnis");
						continue;
					}

					const savingsPercentage =
						effectiveOriginal > 0 ? (savings / effectiveOriginal) * 100 : 0;

					console.log(
						`[Split] ${station.name}: ${firstPrice.toFixed(2)} + ${secondPrice.toFixed(2)} = ${totalSplitPrice.toFixed(2)} € (−${savings.toFixed(2)} €, ${savingsPercentage.toFixed(1)}%)`,
					);

					foundSplits.push({
						splitStation: station,
						firstLegPrice: firstPrice,
						secondLegPrice: secondPrice,
						totalPrice: totalSplitPrice,
						savings,
						savingsPercentage,
						firstLegJourney: bestFirst,
						secondLegJourney: bestSecond,
					});
				} catch (err) {
					if ((err as Error).name === "AbortError") return;
					console.error(`[Split] Fehler bei ${station.name}:`, err);
					skip("Netzwerkfehler");
				}
			}

			foundSplits.sort((a, b) => b.savings - a.savings);

			const skipReasons = Array.from(skipMap.entries())
				.map(([reason, count]) => ({ reason, count }))
				.sort((a, b) => b.count - a.count);

			if (signal.aborted) return;

			console.log(
				`[Split] Abgeschlossen: ${foundSplits.length} Option(en), ${candidates.length} Stationen, ${missingFareStations.length} ohne Preis`,
			);

			setResult({
				originalPrice,
				splits: foundSplits,
				loading: false,
				error: null,
				checkedStations: candidates.length,
				totalStations: candidates.length,
				diagnostics: { missingFareStations, skipReasons },
			});
		},
		[baseUrl],
	);

	return { result, checkSplitOptions };
}
