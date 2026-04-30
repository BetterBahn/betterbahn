/**
 * Sets a cookie with the given name, value, and expiry in days.
 * The value is URI-encoded to prevent issues with special characters.
 */
export function setCookie(name: string, value: string, days = 365): void {
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

/**
 * Reads a cookie by name. Returns null if not found.
 * URI-decodes the value to match the encoding done by setCookie.
 */
export function getCookie(name: string): string | null {
	const prefix = name + "=";
	for (const part of document.cookie.split(";")) {
		const trimmed = part.trimStart();
		if (trimmed.startsWith(prefix)) {
			try {
				return decodeURIComponent(trimmed.slice(prefix.length));
			} catch {
				return trimmed.slice(prefix.length);
			}
		}
	}
	return null;
}

/**
 * Deletes a cookie by setting its expiry to the past.
 */
export function deleteCookie(name: string): void {
	document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Reads a cookie value, falling back to a legacy key name if the primary is
 * absent. Safe to call during SSR (returns null when window is unavailable).
 */
export function getInitialCookieValue(
	name: string,
	legacyName?: string,
): string | null {
	if (typeof window === "undefined") return null;
	const current = getCookie(name);
	if (current !== null) return current;
	if (legacyName) return getCookie(legacyName);
	return null;
}
