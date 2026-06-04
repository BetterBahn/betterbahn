"use client";

import { formatPriceDE } from "@/utils/priceUtils";
import { type SearchHistoryItem } from "./useSearchHistory";

interface SearchHistoryProps {
	history: SearchHistoryItem[];
	onRemove: (vbid: string) => void;
	onClear: () => void;
}

const buildUrl = (item: SearchHistoryItem) => {
	const params = new URLSearchParams({ vbid: item.vbid });
	if (item.travelClass !== undefined) params.set("travelClass", item.travelClass.toString());
	if (item.passengerAge !== undefined) params.set("passengerAge", item.passengerAge.toString());
	if (item.bahnCard !== null && item.bahnCard !== undefined) params.set("bahnCard", item.bahnCard.toString());
	if (item.hasDeutschlandTicket) params.set("hasDeutschlandTicket", "true");
	return `/discount?${params.toString()}`;
};

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};

const formatSavedDate = (timestamp: number) => {
	const date = new Date(timestamp);
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
	});
};

export const SearchHistory = ({
	history,
	onRemove,
	onClear,
}: SearchHistoryProps) => {

	return (
		<div className="mt-12 animate-in fade-in slide-in-from-top-2 duration-300">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-foreground">
					Letzte Suchen
				</h2>
				<button
					type="button"
					onClick={onClear}
					className="text-sm text-foreground/60 hover:text-red-500 transition-colors"
				>
					Alle löschen
				</button>
			</div>

			<div className="grid gap-3">
				{history.map((item, index) => (
					<a
						key={`${item.vbid}-${index}`}
						role="button"
						tabIndex={0}
						href={buildUrl(item)}
						className="group relative bg-background border border-foreground/20 rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer"
					>
						<div className="flex items-center justify-between">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 text-foreground">
									<span className="font-medium truncate">
										{item.origin}
									</span>
									<svg
										className="w-4 h-4 text-foreground/50 shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 8l4 4m0 0l-4 4m4-4H3"
										/>
									</svg>
									<span className="font-medium truncate">
										{item.destination}
									</span>
								</div>

								<div className="flex items-center gap-3 mt-1 text-sm text-foreground/60">
									<span>{formatDate(item.departureDate)}</span>
									{item.price !== null && (
										<span className="text-green-600 font-medium">
											{formatPriceDE(item.price)}
										</span>
									)}
									<span className="text-xs text-foreground/40">
										Preis vom {formatSavedDate(item.savedAt)}
									</span>
								</div>
							</div>

							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onRemove(item.vbid);
								}}
								className="ml-3 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
								aria-label="Suchergebnis löschen"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</a>
				))}
			</div>
		</div>
	);
};
