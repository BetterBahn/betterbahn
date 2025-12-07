"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StationInput from "./StationInput";
import type { Station } from "@/lib/types";

// Cookie utility functions
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

export default function SearchForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [origin, setOrigin] = useState<Station | null>(null);
	const [destination, setDestination] = useState<Station | null>(null);
	const [defaultDate, setDefaultDate] = useState<string>("");
	const [defaultTime, setDefaultTime] = useState<string>("");
	const [age, setAge] = useState<string>("");
	const [hasDTicket, setHasDTicket] = useState<boolean>(false);
	const [trainClass, setTrainClass] = useState<string>("2");
	const [bahncard, setBahncard] = useState<string>("none");

	// Load preferences from cookies on mount
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

	// Set default datetime to current time when component mounts
	useEffect(() => {
		const now = new Date();
		// Format date as YYYY-MM-DD
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const formattedDate = `${year}-${month}-${day}`;
		setDefaultDate(formattedDate);

		// Format time as HH:mm
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const formattedTime = `${hours}:${minutes}`;
		setDefaultTime(formattedTime);
	}, []);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!origin || !destination) {
			alert("Bitte wähle Start- und Zielbahnhof aus");
			return;
		}

		const formData = new FormData(e.currentTarget);

		// Build URL search params for the API call
		const params = new URLSearchParams();

		// Required: from and to station IDs
		params.append("from", origin.id);
		params.append("to", destination.id);

		// Date/Time - if provided, combine date and time, otherwise use current time
		const date = formData.get("date") as string;
		const time = formData.get("time") as string;
		if (date && time) {
			// Combine date and time into datetime-local format then convert to ISO
			const dateTimeString = `${date}T${time}`;
			const localDate = new Date(dateTimeString);
			const isoDateTime = localDate.toISOString();
			params.append("departure", isoDateTime);
		}

		// Optional parameters - use state values instead of formData
		// This ensures values work even when advanced options are collapsed
		if (age) {
			params.append("age", age);
		}

		if (hasDTicket) {
			params.append("deutschlandTicketDiscount", "true");
		}

		if (trainClass === "1") {
			params.append("firstClass", "true");
		}

		if (bahncard !== "none") {
			params.append("loyaltyCard", `bahncard${bahncard}`);
		}

		// Always request tickets info
		params.append("tickets", "true");

		// Update URL params on the same page to trigger results display
		router.push(`/?${params.toString()}`, { scroll: false });
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-4 w-full"
			aria-label="Zugverbindung suchen"
		>
			{/* Origin Station */}
			<div className="flex flex-col gap-2">
				<StationInput
					placeholder="Startbahnhof"
					value=""
					onSelect={(station) => setOrigin(station)}
				/>
			</div>

			{/* Destination Station */}
			<div className="flex flex-col gap-2">
				<StationInput
					placeholder="Zielbahnhof"
					value=""
					onSelect={(station) => setDestination(station)}
				/>
			</div>

			{/* Information Fields - Horizontal Layout */}
			<div className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden">
				{/* Date */}
				<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
					<label
						htmlFor="date"
						className="text-base font-medium text-gray-700 font-mono"
					>
						Datum
					</label>
					<input
						id="date"
						type="date"
						name="date"
						defaultValue={defaultDate}
						aria-label="Abfahrtsdatum auswählen"
						className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
					/>
				</div>

				{/* Time */}
				<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
					<label
						htmlFor="time"
						className="text-base font-medium text-gray-700 font-mono"
					>
						Uhrzeit
					</label>
					<input
						id="time"
						type="time"
						name="time"
						defaultValue={defaultTime}
						aria-label="Abfahrtszeit auswählen"
						className="text-right text-base font-bold font-mono bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
					/>
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
						htmlFor="bahncard"
						className="text-base font-medium text-gray-700 font-mono"
					>
						Bahncard
					</label>
					<select
						id="bahncard"
						name="bahncard"
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

				{/* Class */}
				<div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
					<label
						htmlFor="trainClass"
						className="text-base font-medium text-gray-700 font-mono"
					>
						Klasse
					</label>
					<select
						id="trainClass"
						name="trainClass"
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

				{/* Age */}
				<div className="flex items-center justify-between px-4 py-4">
					<label
						htmlFor="age"
						className="text-base font-medium text-gray-700 font-mono"
					>
						Alter
					</label>
					<input
						id="age"
						type="number"
						name="age"
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
			</div>

			{/* Search Button */}
			<button
				type="submit"
				aria-label="Zugverbindung jetzt suchen"
				className="w-full bg-primary text-white rounded-3xl p-3 text-lg font-mono font-bold hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 mt-2"
			>
				Verbindung suchen
			</button>
		</form>
	);
}
