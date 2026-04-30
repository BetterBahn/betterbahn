"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useJourneyInfo } from "@/lib/context/journeyInfoContext";
import { formatShortDeparture } from "@/lib/utils/formatDate";

function JourneyContextInfo() {
	const params = useSearchParams();
	const { price } = useJourneyInfo();

	const fromName = params.get("fromName");
	const toName = params.get("toName");
	const departure = params.get("departure");
	const matchArrivalTime = params.get("matchArrivalTime");

	if (!fromName || !toName || !departure) {
		return (
			<span className="text-sm font-mono text-gray-500">Verbindungssuche</span>
		);
	}

	const { dateStr, timeStr: depTime } = formatShortDeparture(departure);

	return (
		<div className="flex flex-col min-w-0 gap-0.5">
			<span className="text-sm font-mono text-gray-700 font-semibold truncate">
				{fromName}
				<span className="text-gray-400 mx-1.5">→</span>
				{toName}
			</span>
			<span className="text-xs font-mono text-gray-500">
				{dateStr}
				<span className="text-gray-300 mx-1.5">·</span>
				{depTime}
				{matchArrivalTime && <> – {matchArrivalTime}</>}
				{price && (
					<>
						<span className="text-gray-300 mx-1.5">·</span>
						<span className="text-primary font-semibold">
							{price.amount.toFixed(2)} {price.currency}
						</span>
					</>
				)}
			</span>
		</div>
	);
}

export default function SearchContextBar() {
	return (
		<div
			className="sticky top-0 z-10 bg-white border-b border-gray-200"
			style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
		>
			<div className="container mx-auto max-w-4xl px-4 py-2 min-h-11 flex items-start gap-3">
				<div className="flex-1 min-w-0">
					<Suspense
						fallback={
							<span className="text-sm font-mono text-gray-500">
								Verbindungssuche
							</span>
						}
					>
						<JourneyContextInfo />
					</Suspense>
				</div>
				<Link
					href="/"
					className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900 font-mono text-lg leading-none"
					aria-label="Schließen"
				>
					<span aria-hidden="true">✕</span>
				</Link>
			</div>
		</div>
	);
}
