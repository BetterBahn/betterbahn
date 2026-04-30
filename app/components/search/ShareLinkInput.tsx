"use client";

import { useEffect, useState } from "react";
import { useShareLinkSearch } from "@/lib/hooks/useShareLinkSearch";
import {
	setCookie,
	getCookie,
	deleteCookie,
	getInitialCookieValue,
} from "@/lib/utils/cookieUtils";

const PLACEHOLDER = `Füge hier den Text ein, den du von der Bahn kopiert hast. Er enthält alle Informationen zu deiner geplanten Verbindung, damit wir sie für dich suchen können.`;

const COOKIE_KEYS = {
	age: "shareLink_age",
	hasDTicket: "shareLink_hasDTicket",
	trainClass: "shareLink_trainClass",
	bahncard: "shareLink_bahncard",
	splitIncludeTransfer: "shareLink_splitIncludeTransfer",
	splitAllowOtherTrains: "shareLink_splitAllowOtherTrains",
	splitMaxArrivalDeviation: "shareLink_splitMaxArrivalDeviation",
} as const;

const LEGACY_COOKIE_KEYS = {
	age: "searchForm_age",
	hasDTicket: "searchForm_hasDTicket",
	trainClass: "searchForm_trainClass",
	bahncard: "searchForm_bahncard",
	splitIncludeTransfer: "split_includeTransfer",
	splitAllowOtherTrains: "split_allowOtherTrains",
	splitMaxArrivalDeviation: "split_maxArrivalDeviation",
} as const;

export default function ShareLinkInput() {
	const [text, setText] = useState("");
	const { search, status, error } = useShareLinkSearch();

	// Präferenzen aus Cookies
	const [age, setAge] = useState<string>(
		() => getInitialCookieValue(COOKIE_KEYS.age, LEGACY_COOKIE_KEYS.age) || "",
	);
	const [hasDTicket, setHasDTicket] = useState<boolean>(
		() =>
			getInitialCookieValue(
				COOKIE_KEYS.hasDTicket,
				LEGACY_COOKIE_KEYS.hasDTicket,
			) === "true",
	);
	const [trainClass, setTrainClass] = useState<string>(
		() =>
			getInitialCookieValue(
				COOKIE_KEYS.trainClass,
				LEGACY_COOKIE_KEYS.trainClass,
			) || "2",
	);
	const [bahncard, setBahncard] = useState<string>(
		() =>
			getInitialCookieValue(
				COOKIE_KEYS.bahncard,
				LEGACY_COOKIE_KEYS.bahncard,
			) || "none",
	);
	const [showOptions, setShowOptions] = useState<boolean>(false);
	const [splitIncludeTransferStations, setSplitIncludeTransferStations] =
		useState<boolean>(
			() =>
				getInitialCookieValue(
					COOKIE_KEYS.splitIncludeTransfer,
					LEGACY_COOKIE_KEYS.splitIncludeTransfer,
				) === "true",
		);
	const [splitAllowOtherTrains, setSplitAllowOtherTrains] = useState<boolean>(
		() =>
			getInitialCookieValue(
				COOKIE_KEYS.splitAllowOtherTrains,
				LEGACY_COOKIE_KEYS.splitAllowOtherTrains,
			) === "true",
	);
	const [splitMaxArrivalDeviation, setSplitMaxArrivalDeviation] =
		useState<number>(() =>
			Number(
				getInitialCookieValue(
					COOKIE_KEYS.splitMaxArrivalDeviation,
					LEGACY_COOKIE_KEYS.splitMaxArrivalDeviation,
				) || "60",
			),
		);

	useEffect(() => {
		const migrateKey = (key: string, legacyKey: string) => {
			if (getCookie(key) !== null) return;
			const legacyValue = getCookie(legacyKey);
			if (legacyValue !== null) {
				setCookie(key, legacyValue);
			}
		};

		migrateKey(COOKIE_KEYS.age, LEGACY_COOKIE_KEYS.age);
		migrateKey(COOKIE_KEYS.hasDTicket, LEGACY_COOKIE_KEYS.hasDTicket);
		migrateKey(COOKIE_KEYS.trainClass, LEGACY_COOKIE_KEYS.trainClass);
		migrateKey(COOKIE_KEYS.bahncard, LEGACY_COOKIE_KEYS.bahncard);
		migrateKey(
			COOKIE_KEYS.splitIncludeTransfer,
			LEGACY_COOKIE_KEYS.splitIncludeTransfer,
		);
		migrateKey(
			COOKIE_KEYS.splitAllowOtherTrains,
			LEGACY_COOKIE_KEYS.splitAllowOtherTrains,
		);
		migrateKey(
			COOKIE_KEYS.splitMaxArrivalDeviation,
			LEGACY_COOKIE_KEYS.splitMaxArrivalDeviation,
		);

		// Cleanup: legacy cookie names are no longer used after migration.
		Object.values(LEGACY_COOKIE_KEYS).forEach((legacyKey) => {
			deleteCookie(legacyKey);
		});
	}, []);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!text.trim()) return;
		search(text, {
			age,
			hasDTicket,
			trainClass,
			bahncard,
			splitIncludeTransferStations,
			splitAllowOtherTrains,
			splitMaxArrivalDeviation,
		});
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
					<button
						type="button"
						onClick={() => setShowOptions(true)}
						className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 font-mono gap-1 transition-colors"
						aria-label="Optionen anzeigen"
					>
						<span>▼</span> Optionen
					</button>
				)}

				{showOptions && (
					<>
						{/* Hide options button */}
						<button
							type="button"
							onClick={() => setShowOptions(false)}
							className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 border-b border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 font-mono gap-1 transition-colors"
							aria-label="Optionen ausblenden"
						>
							<span>▲</span> Optionen ausblenden
						</button>

						{/* Deutschlandticket */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
							<label
								htmlFor="share-hasDTicket"
								className="text-base font-medium text-gray-700 font-mono"
							>
								Deutschlandticket
							</label>
							<select
								id="share-hasDTicket"
								value={hasDTicket ? "true" : "false"}
								onChange={(e) => {
									const val = e.target.value === "true";
									setHasDTicket(val);
									setCookie(COOKIE_KEYS.hasDTicket, val.toString());
								}}
								aria-label="Deutschland-Ticket auswählen"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 cursor-pointer"
							>
								<option value="false">Nein</option>
								<option value="true">Ja</option>
							</select>
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
									setCookie(COOKIE_KEYS.bahncard, value);
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
									setCookie(COOKIE_KEYS.trainClass, value);
								}}
								aria-label="Reiseklasse auswählen"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 cursor-pointer"
							>
								<option value="2">2</option>
								<option value="1">1</option>
							</select>
						</div>

						{/* Alter */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
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
									setCookie(COOKIE_KEYS.age, value);
								}}
								min="0"
								max="120"
								placeholder="27"
								aria-label="Dein Alter eingeben"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 w-20"
							/>
						</div>

						{/* Umstiegsbahnhöfe einbeziehen */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
							<label
								htmlFor="share-splitIncludeTransfer"
								className="text-base font-medium text-gray-700 font-mono"
							>
								Auch an Umstiegsbahnhöfen teilen
							</label>
							<select
								id="share-splitIncludeTransfer"
								value={splitIncludeTransferStations ? "true" : "false"}
								onChange={(e) => {
									const val = e.target.value === "true";
									setSplitIncludeTransferStations(val);
									setCookie(COOKIE_KEYS.splitIncludeTransfer, val.toString());
								}}
								aria-label="Auch an Umstiegsbahnhöfen splitten"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 cursor-pointer"
							>
								<option value="false">Nein</option>
								<option value="true">Ja</option>
							</select>
						</div>

						{/* Andere Züge erlauben */}
						<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
							<label
								htmlFor="share-splitAllowOtherTrains"
								className="text-base font-medium text-gray-700 font-mono"
							>
								Andere Züge erlauben
							</label>
							<select
								id="share-splitAllowOtherTrains"
								value={splitAllowOtherTrains ? "true" : "false"}
								onChange={(e) => {
									const val = e.target.value === "true";
									setSplitAllowOtherTrains(val);
									setCookie(COOKIE_KEYS.splitAllowOtherTrains, val.toString());
								}}
								aria-label="Andere Züge für geteiltes Ticket erlauben"
								className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 cursor-pointer"
							>
								<option value="false">Nein</option>
								<option value="true">Ja</option>
							</select>
						</div>

						{/* Max. Abweichung (nur wenn andere Züge erlaubt) */}
						{splitAllowOtherTrains && (
							<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
								<label
									htmlFor="share-splitMaxArrivalDeviation"
									className="text-base font-medium text-gray-700 font-mono"
								>
									Max. Ankunftsabweichung
								</label>
								<div className="flex items-center gap-1">
									<input
										id="share-splitMaxArrivalDeviation"
										type="number"
										value={splitMaxArrivalDeviation}
										onChange={(e) => {
											const val = Math.max(1, Number(e.target.value));
											setSplitMaxArrivalDeviation(val);
											setCookie(
												COOKIE_KEYS.splitMaxArrivalDeviation,
												String(val),
											);
										}}
										min="1"
										max="240"
										aria-label="Maximale Ankunftsabweichung in Minuten"
										className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 w-16"
									/>
									<span className="text-sm font-mono text-gray-500">Min.</span>
								</div>
							</div>
						)}
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
