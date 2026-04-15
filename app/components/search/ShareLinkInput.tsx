"use client";

import { useState, useEffect } from "react";
import { useShareLinkSearch } from "@/lib/hooks/useShareLinkSearch";

// Cookie utility functions (identisch zu searchForm.tsx)
const setCookie = (name: string, value: string, days: number = 365) => {
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

const PLACEHOLDER = `Füge hier den Text ein, den du von der Bahn kopiert hast. Er enthält alle Informationen zu deiner geplanten Verbindung, damit wir sie für dich suchen können.`;

export default function ShareLinkInput() {
	const [text, setText] = useState("");
	const { search, status, error } = useShareLinkSearch();

	// Präferenzen aus Cookies (identisch zu searchForm.tsx)
	const [age, setAge] = useState<string>("");
	const [hasDTicket, setHasDTicket] = useState<boolean>(false);
	const [trainClass, setTrainClass] = useState<string>("2");
	const [bahncard, setBahncard] = useState<string>("none");
	const [showOptions, setShowOptions] = useState<boolean>(false);

	// Präferenzen aus Cookies laden
	useEffect(() => {
		const savedAge = getCookie("searchForm_age");
		const savedDTicket = getCookie("searchForm_hasDTicket");
		const savedTrainClass = getCookie("searchForm_trainClass");
		const savedBahncard = getCookie("searchForm_bahncard");

		if (savedAge) setAge(savedAge);
		if (savedDTicket) setHasDTicket(savedDTicket === "true");
		if (savedTrainClass) setTrainClass(savedTrainClass);
		if (savedBahncard) setBahncard(savedBahncard);
	}, []);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!text.trim()) return;
		search(text, { age, hasDTicket, trainClass, bahncard });
	};

	const isResolving = status === "resolving";

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-4 w-full"
			aria-label="Verbindung per Teilen-Text suchen"
		>
			{/* Textarea für den DB-Teilen-Text */}
			<div className="flex flex-col gap-2">
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={PLACEHOLDER}
					rows={4}
					disabled={isResolving}
					aria-label="DB-Teilen-Text einfügen"
					className="w-full p-4 border-2 border-gray-200 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				/>
			</div>

			{/* Optionen */}
			<div className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden">
				{/* Options toggle */}
				{!showOptions && (
					<div className="flex items-center justify-center px-4 py-3">
						<button
							type="button"
							onClick={() => setShowOptions(true)}
							className="text-sm font-medium text-gray-600 hover:text-gray-800 font-mono flex items-center gap-1"
							aria-label="Optionen anzeigen"
						>
							<span>▼</span> Optionen
						</button>
					</div>
				)}

				{showOptions && (
					<>
						{/* Hide options button */}
						<div className="flex items-center justify-center px-4 py-3 bg-gray-100 border-b border-gray-200">
							<button
								type="button"
								onClick={() => setShowOptions(false)}
								className="text-sm font-medium text-gray-600 hover:text-gray-800 font-mono flex items-center gap-1"
								aria-label="Optionen ausblenden"
							>
								<span>▲</span> Optionen ausblenden
							</button>
						</div>

						{/* Deutschlandticket */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
							<label className="text-base font-medium text-gray-700 font-mono">
								Deutschlandticket
							</label>
							<button
								type="button"
								onClick={() => {
									const newValue = !hasDTicket;
									setHasDTicket(newValue);
									setCookie("searchForm_hasDTicket", newValue.toString());
								}}
								className="text-right text-base font-bold font-mono bg-transparent hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
								aria-label="Deutschland-Ticket umschalten"
							>
								{hasDTicket ? "Ja!" : "Nein"}
							</button>
						</div>

						{/* Bahncard */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
							<label
								htmlFor="share-bahncard"
								className="text-base font-medium text-gray-700 font-mono"
							>
								Bahncard
							</label>
							<select
								id="share-bahncard"
								value={bahncard}
								onChange={(e) => {
									const value = e.target.value;
									setBahncard(value);
									setCookie("searchForm_bahncard", value);
								}}
								aria-label="Bahncard-Typ auswählen"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 cursor-pointer"
							>
								<option value="none">Keine</option>
								<option value="-1st-25">BC-25 (1. Klasse)</option>
								<option value="-2nd-25">BC-25 (2. Klasse)</option>
								<option value="-1st-50">BC-50 (1. Klasse)</option>
								<option value="-2nd-50">BC-50 (2. Klasse)</option>
								<option value="-1st-100">BC-100 (1. Klasse)</option>
								<option value="-2nd-100">BC-100 (2. Klasse)</option>
							</select>
						</div>

						{/* Klasse */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
							<label
								htmlFor="share-trainClass"
								className="text-base font-medium text-gray-700 font-mono"
							>
								Klasse
							</label>
							<select
								id="share-trainClass"
								value={trainClass}
								onChange={(e) => {
									const value = e.target.value;
									setTrainClass(value);
									setCookie("searchForm_trainClass", value);
								}}
								aria-label="Reiseklasse auswählen"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 cursor-pointer"
							>
								<option value="2">2</option>
								<option value="1">1</option>
							</select>
						</div>

						{/* Alter */}
						<div className="flex items-center justify-between px-4 py-4">
							<label
								htmlFor="share-age"
								className="text-base font-medium text-gray-700 font-mono"
							>
								Alter
							</label>
							<input
								id="share-age"
								type="number"
								value={age}
								onChange={(e) => {
									const value = e.target.value;
									setAge(value);
									setCookie("searchForm_age", value);
								}}
								min="0"
								max="120"
								placeholder="27"
								aria-label="Dein Alter eingeben"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 w-20"
							/>
						</div>
					</>
				)}
			</div>

			{/* Fehlermeldung */}
			{error && (
				<div
					role="alert"
					className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-700 font-mono"
				>
					{error}
				</div>
			)}

			{/* Suchen-Button */}
			<button
				type="submit"
				disabled={!text.trim() || isResolving}
				aria-label="Verbindung per Teilen-Text suchen"
				className="w-full bg-primary text-white rounded-3xl p-3 text-lg font-mono font-bold hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isResolving ? "Bahnhöfe werden aufgelöst…" : "Verbindung suchen"}
			</button>
		</form>
	);
}
