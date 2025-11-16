"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StationInput from "./StationInput";
import type { Station } from "@/lib/types";

export default function SearchForm() {
	const router = useRouter();
	const [origin, setOrigin] = useState<Station | null>(null);
	const [destination, setDestination] = useState<Station | null>(null);
	const [defaultDateTime, setDefaultDateTime] = useState<string>("");

	// Set default datetime to current time when component mounts
	useEffect(() => {
		const now = new Date();
		// Format as YYYY-MM-DDTHH:mm for datetime-local input
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
		setDefaultDateTime(formattedDateTime);
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

		// Date/Time - if provided, use departure, otherwise use current time
		const dateTime = formData.get("dateTime") as string;
		if (dateTime) {
			// Convert the datetime-local input to ISO 8601 format with timezone
			// datetime-local gives us "YYYY-MM-DDTHH:mm" in local time
			// We need to convert it to ISO 8601 with timezone info
			const localDate = new Date(dateTime);
			const isoDateTime = localDate.toISOString();
			params.append("departure", isoDateTime);
		}

		// Optional parameters
		const age = formData.get("age") as string;
		if (age) {
			params.append("age", age);
		}

		const hasDTicket = formData.get("hasDTicket") === "on";
		if (hasDTicket) {
			params.append("deutschlandTicketDiscount", "true");
		}

		const trainClass = formData.get("trainClass") as string;
		if (trainClass === "1") {
			params.append("firstClass", "true");
		}

		const bahncard = formData.get("bahncard") as string;
		if (bahncard !== "none") {
			params.append("loyaltyCard", `bahncard${bahncard}`);
		}

		// Always request tickets info
		params.append("tickets", "true");

		// Navigate to results page with search params
		router.push(`/results?${params.toString()}`);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-4 w-full"
			aria-label="Zugverbindung suchen"
		>
			{/* Origin Station */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="origin-station"
					className="text-sm font-medium text-gray-700"
				>
					Von (Startbahnhof)
				</label>
				<StationInput
					placeholder="z.B. Dresden Hbf"
					value=""
					onSelect={(station) => setOrigin(station)}
				/>
			</div>

			{/* Destination Station */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="destination-station"
					className="text-sm font-medium text-gray-700"
				>
					Nach (Zielbahnhof)
				</label>
				<StationInput
					placeholder="z.B. München Hbf"
					value=""
					onSelect={(station) => setDestination(station)}
				/>
			</div>

			{/* Date and Time */}
			<div className="flex flex-col gap-2">
				<label htmlFor="dateTime" className="text-sm font-medium text-gray-700">
					Datum und Uhrzeit (optional)
				</label>
				<input
					id="dateTime"
					type="datetime-local"
					name="dateTime"
					defaultValue={defaultDateTime}
					aria-label="Abfahrtsdatum und -zeit auswählen"
					className="w-full border-2 border-gray-300 rounded-3xl p-4 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
				/>
			</div>

			{/* Age and D-Ticket Row */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="flex flex-col gap-2 flex-1">
					<label htmlFor="age" className="text-sm font-medium text-gray-700">
						Alter
					</label>
					<input
						id="age"
						type="number"
						name="age"
						defaultValue="27"
						min="0"
						max="120"
						placeholder="z.B. 25"
						aria-label="Dein Alter eingeben"
						className="w-full border-2 border-gray-300 rounded-3xl p-4 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
					/>
				</div>
				<div className="flex flex-col gap-2 flex-1">
					<label
						htmlFor="hasDTicket"
						className="text-sm font-medium text-gray-700"
					>
						Deutschland-Ticket
					</label>
					<label className="flex items-center gap-3 border-2 border-gray-300 rounded-3xl p-4 text-base font-mono cursor-pointer hover:border-gray-400 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
						<span>D-Ticket vorhanden</span>
						<input
							id="hasDTicket"
							type="checkbox"
							name="hasDTicket"
							aria-label="Ich besitze ein Deutschland-Ticket"
							className="w-5 h-5 accent-primary cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
						/>
					</label>
				</div>
			</div>

			{/* Class and Bahncard Row */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="flex flex-col gap-2 flex-1">
					<label
						htmlFor="trainClass"
						className="text-sm font-medium text-gray-700"
					>
						Klasse
					</label>
					<select
						id="trainClass"
						name="trainClass"
						defaultValue="2"
						aria-label="Reiseklasse auswählen"
						className="w-full border-2 border-gray-300 rounded-3xl p-4 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors cursor-pointer bg-white"
					>
						<option value="2">2. Klasse</option>
						<option value="1">1. Klasse</option>
					</select>
				</div>
				<div className="flex flex-col gap-2 flex-1">
					<label
						htmlFor="bahncard"
						className="text-sm font-medium text-gray-700"
					>
						Bahncard
					</label>
					<select
						id="bahncard"
						name="bahncard"
						defaultValue="none"
						aria-label="Bahncard-Typ auswählen"
						className="w-full border-2 border-gray-300 rounded-3xl p-4 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors cursor-pointer bg-white"
					>
						<option value="none">Keine Bahncard</option>
						<option value="25">Bahncard 25</option>
						<option value="50">Bahncard 50</option>
						<option value="100">Bahncard 100</option>
					</select>
				</div>
			</div>

			{/* Search Button */}
			<button
				type="submit"
				aria-label="Zugverbindung jetzt suchen"
				className="w-full bg-primary text-white rounded-3xl p-4 text-lg font-mono font-bold hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 mt-2"
			>
				Verbindung suchen
			</button>
		</form>
	);
}
