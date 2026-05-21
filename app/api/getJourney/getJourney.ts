import { fetchAndValidateJson } from "@/utils/fetchAndValidateJson";
import { parseHinfahrtReconWithAPI } from "@/utils/parseHinfahrtRecon";
import { vbidSchema, vendoJourneySchema } from "@/utils/schemas";
import { t } from "@/utils/trpc-init";
import { TRPCError } from "@trpc/server";
import { createClient, type SearchJourneysOptions } from "db-vendo-client";
import { data as loyaltyCards } from "db-vendo-client/format/loyalty-cards";
import { profile as dbProfile } from "db-vendo-client/p/db/index";
import { prettifyError, z } from "zod/v4";

const BROWSER_UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const dbClient = createClient(
	{
		...dbProfile,
		transformReq: (_ctx: unknown, reqOptions: Record<string, unknown>) => ({
			...reqOptions,
			headers: {
				...(reqOptions.headers as Record<string, string>),
				Referer: "https://www.bahn.de/",
				Origin: "https://www.bahn.de",
				"sec-ch-ua":
					'"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
				"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": '"macOS"',
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "cross-site",
			},
		}),
	},
	BROWSER_UA
);

export const getJourney = t.procedure
	.input(
		z.object({
			vbid: z.string(),
			travelClass: z.int(),
			bahnCard: z.int().nullable(),
			passengerAge: z.int().optional(),
			hasDeutschlandTicket: z.boolean(),
		})
	)
	.query(async ({ input }) => {
		const vbidRequest = await fetchAndValidateJson({
			url: `https://www.bahn.de/web/api/angebote/verbindung/${input.vbid}`,
			schema: vbidSchema,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
				Referer: "https://www.bahn.de/",
				Origin: "https://www.bahn.de",
				"Accept-Language": "de-DE,de;q=0.9",
			},
		});

		const cookies = vbidRequest.response.headers.getSetCookie();
		const { data } = await parseHinfahrtReconWithAPI(vbidRequest.data, cookies);

		// Find first segment with halte data for start station
		const firstSegmentWithHalte =
			data.verbindungen[0].verbindungsAbschnitte.find(
				(segment) => segment.halte.length > 0
			);

		const lastSegmentWithHalte =
			data.verbindungen[0].verbindungsAbschnitte.findLast(
				(segment) => segment.halte.length > 0
			);

		if (!firstSegmentWithHalte || !lastSegmentWithHalte) {
			throw new Error("No segments with station data found");
		}

		const soidValue = firstSegmentWithHalte.halte[0].id;
		const zoidValue = lastSegmentWithHalte.halte.at(-1)!.id;
		const fromStationId = soidValue.match(/@L=(\d+)/)?.[1];
		const toStationId = zoidValue.match(/@L=(\d+)/)?.[1];

		if (!fromStationId || !toStationId) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "missing soid or zoid",
			});
		}

		const options: SearchJourneysOptions = {
			results: 10,
			stopovers: true,
			// Bei genauer Abfahrtszeit wollen wir exakte Treffer, nicht verschiedene Alternativen
			notOnlyFastRoutes: true,
			remarks: true, // Verbindungshinweise einschließen
			transfers: -1, // System entscheidet über optimale Anzahl Umstiege
			// Reiseklasse-Präferenz setzen - verwende firstClass boolean Parameter
			firstClass: input.travelClass === 1, // true für erste Klasse, false für zweite Klasse
			age: input.passengerAge, // Passagieralter für angemessene Preisgestaltung hinzufügen
			departure: new Date(vbidRequest.data.hinfahrtDatum),
		};

		if (input.bahnCard !== null && [25, 50, 100].includes(input.bahnCard)) {
			options.loyaltyCard = {
				type: loyaltyCards.BAHNCARD,
				discount: input.bahnCard,
				class: input.travelClass,
			};
		}

		if (input.hasDeutschlandTicket) {
			options.deutschlandTicketDiscount = true;
			// Diese Option kann helfen, genauere Preise zurückzugeben wenn Deutschland-Ticket verfügbar ist
			options.deutschlandTicketConnectionsOnly = false; // Wir wollen alle Verbindungen, aber mit genauen Preisen
		}

		const journeys = await dbClient.journeys(
			fromStationId,
			toStationId,
			options
		);

		const parseResult = z
			.object({ journeys: z.array(vendoJourneySchema) })
			.safeParse(journeys);

		if (!parseResult.success) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Validation of 'journeys' response of DB-API failed: ${prettifyError(
					parseResult.error
				)}`,
				cause: parseResult.error,
			});
		}

		const uniqueJourneys = parseResult.data.journeys.filter(
			(journey, index, arr) => {
				if (journey.legs.length === 0) {
					return false;
				}

				const journeySignature = journey.legs
					.map(
						(leg) =>
							`${leg.line?.name || "walk"}-${leg.origin?.id}-${
								leg.destination?.id
							}-${leg.departure}`
					)
					.join("|");

				const key = `${journeySignature}-${
					journey.price?.amount || "no-price"
				}`;
				return (
					arr.findIndex((j) => {
						if (!j.legs || j.legs.length === 0) {
							return false;
						}

						const jSignature = j.legs
							.map(
								(leg) =>
									`${leg.line?.name || "walk"}-${leg.origin?.id}-${
										leg.destination?.id
									}-${leg.departure}`
							)
							.join("|");

						const jKey = `${jSignature}-${j.price?.amount || "no-price"}`;
						return jKey === key;
					}) === index
				);
			}
		);

		// Sort by departure time
		const sortedJourneys = uniqueJourneys.toSorted(
			(a, b) => a.legs[0].departure.getTime() - b.legs[0].departure.getTime()
		);

		// Only show journeys matching the original search time
		const originalDepartureTime = new Date(vbidRequest.data.hinfahrtDatum);

		// Find the journey that best matches the original departure time
		const closestJourney = sortedJourneys.reduce((closest, current) => {
			if (!closest) return current;
			const closestDiff = Math.abs(
				closest.legs[0].departure.getTime() - originalDepartureTime.getTime()
			);
			const currentDiff = Math.abs(
				current.legs[0].departure.getTime() - originalDepartureTime.getTime()
			);
			return currentDiff < closestDiff ? current : closest;
		}, sortedJourneys[0]);

		if (!closestJourney) {
			return [];
		}

		// Get the departure time of the closest journey
		const targetDepartureTime = closestJourney.legs[0].departure.getTime();

		// Return only journeys with the exact same departure time as the closest match
		return sortedJourneys.filter(
			(journey) => journey.legs[0].departure.getTime() === targetDepartureTime
		);
	});
