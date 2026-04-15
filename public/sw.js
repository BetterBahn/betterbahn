// Minimal service worker – required for PWA installability.
// No caching, no offline support – just fulfils the browser's SW requirement.

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

// No fetch handler → all requests go to the network as normal.
