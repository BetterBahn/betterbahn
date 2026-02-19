export const DEFAULT_API_BASE_URL = "https://v6.db.transport.rest";

export const API_BASE_URL_STORAGE_KEY = "apiBaseUrl";

/**
 * Returns the configured API base URL, falling back to the default DB transport.rest instance.
 * Safe to call during SSR (returns default when window is unavailable).
 */
export function getApiBaseUrl(): string {
	if (typeof window === "undefined") return DEFAULT_API_BASE_URL;
	const stored = localStorage.getItem(API_BASE_URL_STORAGE_KEY);
	// Strip trailing slash so callers can always append a path directly
	return (stored || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

/**
 * Persists a custom API base URL to localStorage and notifies same-tab listeners.
 * Passing an empty string or the default URL removes the custom value.
 */
export function setApiBaseUrl(url: string): void {
	if (typeof window === "undefined") return;
	const trimmed = url.trim().replace(/\/$/, "");
	if (!trimmed || trimmed === DEFAULT_API_BASE_URL) {
		localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
	} else {
		localStorage.setItem(API_BASE_URL_STORAGE_KEY, trimmed);
	}
	// The native "storage" event only fires in OTHER tabs; dispatch manually for the current tab.
	window.dispatchEvent(new CustomEvent("apiBaseUrlChanged"));
}
