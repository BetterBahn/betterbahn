import { useCallback, useEffect, useState } from "react";

export interface SearchHistoryItem {
	vbid: string;
	origin: string;
	destination: string;
	departureDate: string;
	price: number | null;
	savedAt: number;
	travelClass?: number;
	passengerAge?: number;
	bahnCard?: number | null;
	hasDeutschlandTicket?: boolean;
}

const MAX_HISTORY_ITEMS = 5;
const STORAGE_KEY = "searchHistory";

export const useSearchHistory = () => {
	const [history, setHistory] = useState<SearchHistoryItem[]>([]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				setHistory(JSON.parse(stored));
			} catch {
				setHistory([]);
			}
		}
	}, []);

	const addToHistory = useCallback((item: Omit<SearchHistoryItem, "savedAt">) => {
		const newItem: SearchHistoryItem = {
			...item,
			savedAt: Date.now(),
		};

		setHistory((prev) => {
			const filtered = prev.filter((h) => h.vbid !== item.vbid);
			const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			return updated;
		});
	}, []);

	const removeFromHistory = useCallback((vbid: string) => {
		setHistory((prev) => {
			const updated = prev.filter((h) => h.vbid !== vbid);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			return updated;
		});
	}, []);

	const clearHistory = useCallback(() => {
		setHistory([]);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	return {
		history,
		addToHistory,
		removeFromHistory,
		clearHistory,
	};
};
