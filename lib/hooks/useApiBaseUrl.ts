"use client";

import { useEffect, useState } from "react";
import {
	API_BASE_URL_STORAGE_KEY,
	DEFAULT_API_BASE_URL,
	getApiBaseUrl,
} from "@/lib/utils/apiBaseUrl";

/**
 * Reactive hook that returns the current API base URL.
 * Re-renders whenever the user changes the URL via ApiProviderSetting.
 */
export function useApiBaseUrl(): string {
	// Lazy initializer: reads localStorage synchronously on first render so the
	// value is correct immediately and never transitions DEFAULT → stored, which
	// would otherwise re-trigger useJourneySearch on every re-mount.
	const [baseUrl, setBaseUrl] = useState<string>(() => {
		if (typeof window === "undefined") return DEFAULT_API_BASE_URL;
		const stored = localStorage.getItem(API_BASE_URL_STORAGE_KEY);
		return (stored || DEFAULT_API_BASE_URL).replace(/\/$/, "");
	});

	useEffect(() => {
		const refresh = () => setBaseUrl(getApiBaseUrl());

		// Same-tab updates dispatched by setApiBaseUrl()
		window.addEventListener("apiBaseUrlChanged", refresh);
		// Cross-tab updates from the native storage event
		window.addEventListener("storage", refresh);
		return () => {
			window.removeEventListener("apiBaseUrlChanged", refresh);
			window.removeEventListener("storage", refresh);
		};
	}, []);

	return baseUrl;
}
