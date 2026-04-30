"use client";

import { useEffect, useRef, useState } from "react";
import {
	DEFAULT_API_BASE_URL,
	getApiBaseUrl,
	setApiBaseUrl,
} from "@/lib/utils/apiBaseUrl";

/** A valid base URL: http(s)://<host> with no query string or fragment. */
function isValidBaseUrl(url: string): boolean {
	try {
		const parsed = new URL(url.trim());
		return (
			(parsed.protocol === "http:" || parsed.protocol === "https:") &&
			parsed.search === "" &&
			parsed.hash === ""
		);
	} catch {
		return false;
	}
}

export default function ApiProviderSetting() {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(DEFAULT_API_BASE_URL);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [checking, setChecking] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	// Load persisted value on mount (client-only)
	useEffect(() => {
		setValue(getApiBaseUrl());
	}, []);

	// Focus input when panel opens
	useEffect(() => {
		if (open) {
			setError(null);
			inputRef.current?.focus();
		}
	}, [open]);

	const commit = async (url: string): Promise<boolean> => {
		const trimmed = url.trim().replace(/\/$/, "");
		if (
			trimmed &&
			trimmed !== DEFAULT_API_BASE_URL &&
			!isValidBaseUrl(trimmed)
		) {
			setError(
				"Ungültige URL – kein Query-String, muss mit http(s):// beginnen",
			);
			return false;
		}
		if (trimmed && trimmed !== DEFAULT_API_BASE_URL) {
			setChecking(true);
			try {
				const res = await fetch(`${trimmed}/locations?query=Berlin&results=1`, {
					signal: AbortSignal.timeout(5000),
				});
				if (!res.ok) throw new Error("not ok");
				const data = await res.json();
				if (!Array.isArray(data)) throw new Error("unexpected response");
			} catch {
				setError("Endpunkt nicht erreichbar oder ungültig");
				setChecking(false);
				return false;
			}
			setChecking(false);
		}
		setError(null);
		setApiBaseUrl(trimmed);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
		return true;
	};

	const closePanel = async () => {
		if (await commit(value)) setOpen(false);
	};

	// Close panel (and save) when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				void closePanel();
			}
		};
		if (open) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, value]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") void closePanel();
		else if (e.key === "Escape") setOpen(false);
	};

	const handleReset = () => {
		setValue(DEFAULT_API_BASE_URL);
		setError(null);
		void commit(DEFAULT_API_BASE_URL);
	};

	const isCustomUrl = value !== DEFAULT_API_BASE_URL;

	return (
		<div ref={panelRef} className="relative font-mono text-sm">
			{!open ? (
				<button
					type="button"
					onClick={() => setOpen(true)}
					title="API-Anbieter ändern"
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 bg-white shadow-sm transition-all hover:shadow-md hover:border-primary cursor-pointer ${
						isCustomUrl
							? "border-primary text-primary"
							: "border-gray-300 text-gray-500"
					}`}
				>
					<ServerIcon />
					<span className="hidden sm:inline">
						{isCustomUrl ? "Eigener Anbieter" : "API"}
					</span>
					{isCustomUrl && (
						<span className="w-2 h-2 rounded-full bg-primary inline-block" />
					)}
				</button>
			) : (
				<div className="bg-white border-2 border-primary rounded-3xl shadow-lg p-4 w-80">
					<div className="flex items-center justify-between mb-3">
						<span className="font-semibold text-gray-800 flex items-center gap-1.5">
							<ServerIcon className="text-primary" />
							API-Anbieter
						</span>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="text-gray-400 hover:text-gray-600 cursor-pointer"
							aria-label="Schließen"
						>
							✕
						</button>
					</div>

					<p className="text-xs text-gray-500 mb-2">
						Basis-URL des transport.rest-kompatiblen Endpunkts
					</p>

					<input
						ref={inputRef}
						type="url"
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							setError(null);
						}}
						onKeyDown={handleKeyDown}
						placeholder={DEFAULT_API_BASE_URL}
						className={`w-full border-2 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
							error
								? "border-red-400 focus:border-red-500"
								: "border-gray-200 focus:border-primary"
						}`}
					/>

					{checking && (
						<p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
							<span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
							Endpunkt wird geprüft…
						</p>
					)}
					{!checking && error && (
						<p className="text-xs text-red-500 mt-1">{error}</p>
					)}

					<div className="flex items-center justify-between mt-3">
						{isCustomUrl ? (
							<button
								type="button"
								onClick={handleReset}
								className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
							>
								Zurücksetzen
							</button>
						) : (
							<span className="text-xs text-gray-400">Standard-Anbieter</span>
						)}

						{saved && (
							<span className="text-xs text-green-600 font-medium">
								✓ Gespeichert
							</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function ServerIcon({ className = "" }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`w-4 h-4 ${className}`}
			aria-hidden="true"
		>
			<rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
			<rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
			<line x1="6" y1="6" x2="6.01" y2="6" />
			<line x1="6" y1="18" x2="6.01" y2="18" />
		</svg>
	);
}
