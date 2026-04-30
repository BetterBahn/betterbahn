"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
	const [installPrompt, setInstallPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	// Lazy initializer: reads matchMedia synchronously on first render so there
	// is no false → true transition that would cause cascading renders.
	const [isInstalled, setIsInstalled] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia("(display-mode: standalone)").matches;
	});

	useEffect(() => {
		// Register service worker
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				// SW registration failed silently – app still works
			});
		}

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setInstallPrompt(e as BeforeInstallPromptEvent);
		};

		const handleAppInstalled = () => {
			setIsInstalled(true);
			setInstallPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	const triggerInstall = async () => {
		if (!installPrompt) return;
		await installPrompt.prompt();
		const { outcome } = await installPrompt.userChoice;
		if (outcome === "accepted") {
			setInstallPrompt(null);
		}
	};

	return {
		canInstall: !!installPrompt && !isInstalled,
		isInstalled,
		triggerInstall,
	};
}
