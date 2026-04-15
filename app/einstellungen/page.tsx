"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

export default function EinstellungenPage() {
	const [apiUrl, setApiUrl] = useState(DEFAULT_API_BASE_URL);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setApiUrl(getApiBaseUrl());
	}, []);

	const handleSave = () => {
		const trimmed = apiUrl.trim().replace(/\/$/, "");
		if (
			trimmed &&
			trimmed !== DEFAULT_API_BASE_URL &&
			!isValidBaseUrl(trimmed)
		) {
			setError(
				"Ungültige URL – kein Query-String, muss mit http(s):// beginnen",
			);
			return;
		}
		setError(null);
		setApiBaseUrl(trimmed);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	const handleReset = () => {
		setApiUrl(DEFAULT_API_BASE_URL);
		setError(null);
		setApiBaseUrl(DEFAULT_API_BASE_URL);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") handleSave();
	};

	const isCustomUrl = apiUrl.trim().replace(/\/$/, "") !== DEFAULT_API_BASE_URL;

	return (
		<main className="py-8 mx-auto">
			<Link
				href="/"
				className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline mb-6"
			>
				← Zurück
			</Link>

			<h1 className="text-2xl font-bold font-mono mb-8">Einstellungen</h1>

			{/* Datenendpunkt */}
			<section className="mb-8 border-2 rounded-3xl p-6">
				<h2 className="text-base font-bold font-mono mb-1">Datenendpunkt</h2>
				<p className="font-mono text-sm text-gray-500 mb-4">
					API-Adresse des transport.rest-kompatiblen Backends. Der
					Standard-Endpunkt ist die öffentliche DB-Instanz.
				</p>

				<div className="flex flex-col gap-2">
					<input
						ref={inputRef}
						type="url"
						value={apiUrl}
						onChange={(e) => {
							setApiUrl(e.target.value);
							setError(null);
							setSaved(false);
						}}
						onKeyDown={handleKeyDown}
						placeholder={DEFAULT_API_BASE_URL}
						className={`w-full font-mono text-sm px-3 py-2 border-2 rounded-xl outline-none transition-colors ${
							error
								? "border-red-400 focus:border-red-500"
								: "border-gray-200 focus:border-primary"
						}`}
						aria-label="API-Endpunkt URL"
					/>

					{error && <p className="font-mono text-xs text-red-500">{error}</p>}

					<div className="flex items-center gap-2 mt-1">
						<button
							type="button"
							onClick={handleSave}
							className="px-4 py-2 rounded-xl border-2 border-primary bg-primary text-white font-mono text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
						>
							Speichern
						</button>

						{isCustomUrl && (
							<button
								type="button"
								onClick={handleReset}
								className="px-4 py-2 rounded-xl border-2 border-gray-200 font-mono text-sm font-medium hover:border-primary transition-colors cursor-pointer"
							>
								Zurücksetzen
							</button>
						)}

						{saved && (
							<span className="font-mono text-sm text-green-600">
								✓ Gespeichert
							</span>
						)}
					</div>
				</div>

				{isCustomUrl && (
					<p className="font-mono text-xs text-gray-400 mt-3">
						Eigener Endpunkt aktiv
					</p>
				)}
			</section>
		</main>
	);
}
