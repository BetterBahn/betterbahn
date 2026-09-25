import { Agent } from "node:https";
import fetch, { Headers, type RequestInit } from "node-fetch";

const [opensslMajor, opensslMinor] = process.versions.openssl.split(".").map(Number);
const supportsHybridGroup = opensslMajor > 3 || (opensslMajor === 3 && opensslMinor >= 5);

// Observed DB edge blocks depend on the default OpenSSL supported_groups fingerprint.
// Keep TLS 1.3, certificate validation and hybrid key exchange where supported.
// See docs/bahn-api-transport.md for controlled Windows/Linux reproductions.
export const bahnAgent = new Agent({
	keepAlive: true,
	ALPNProtocols: ["http/1.1"],
	ecdhCurve: supportsHybridGroup
		? "X25519MLKEM768:X25519:P-256:P-384"
		: "X25519:P-256:P-384",
});

export const selectBahnAgent = (url: URL) => {
	const isBahnApi = url.protocol === "https:" && (
		((url.hostname === "www.bahn.de" || url.hostname === "int.bahn.de") &&
			url.pathname.startsWith("/web/api/")) ||
		(url.hostname === "app.services-bahn.de" && url.pathname.startsWith("/mob/"))
	);
	return isBahnApi ? bahnAgent : undefined;
};

// Keep db-vendo-client's request formatting, logging, validation and errors.
export const withBahnAgent = <T extends object>(_context: unknown, options: T) => {
	// db-vendo-client supplies a proxy agent when either variable is configured.
	// Do not silently bypass the user's proxy with a direct connection.
	if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) return options;
	return { ...options, agent: selectBahnAgent };
};

export const fetchFromBahn = (url: string, init: RequestInit) => {
	const headers = new Headers(init.headers);
	// The web API separately rejects node-fetch's generic default User-Agent.
	if (!headers.has("User-Agent")) headers.set("User-Agent", "betterbahn/0.1.0");
	return fetch(url, { ...init, headers, agent: selectBahnAgent, timeout: 30_000 });
};
