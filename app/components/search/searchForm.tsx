"use client";

import { useState } from "react";
import StationInput from "./StationInput";
import { Station } from "@/lib/hooks/useStationSearch";

export default function SearchForm() {
	const [origin, setOrigin] = useState<Station | null>(null);
	const [destination, setDestination] = useState<Station | null>(null);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);

		const data = {
			origin,
			destination,
			dateTime: formData.get("dateTime") as string,
			age: formData.get("age") ? parseInt(formData.get("age") as string) : null,
			hasDTicket: formData.get("hasDTicket") === "on",
			trainClass: formData.get("trainClass") as string,
			bahncard: formData.get("bahncard") as string,
		};

		console.log("Suche Verbindung:", data);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-3 w-full max-w-2xl p-4"
		>
			{/* Origin Station */}
			<StationInput
				placeholder="Dresden Hbf"
				value=""
				onSelect={(station) => setOrigin(station)}
			/>

			{/* Destination Station */}
			<StationInput
				placeholder="München Hbf."
				value=""
				onSelect={(station) => setDestination(station)}
			/>

			{/* Date and Time */}
			<input
				type="datetime-local"
				name="dateTime"
				className="w-full border-2 border-gray-800 rounded-lg p-3 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
			/>

			{/* Age and D-Ticket Row */}
			<div className="flex flex-col gap-3">
				<input
					type="number"
					name="age"
					placeholder="Dein Alter"
					className="w-full border-2 border-gray-800 rounded-lg p-3 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
				/>
				<label className="flex items-center gap-3 border-2 border-gray-800 rounded-lg p-3 text-base font-mono">
					<span>D-Ticket:</span>
					<input
						type="checkbox"
						name="hasDTicket"
						className="w-5 h-5 accent-primary"
					/>
				</label>
			</div>

			{/* Class and Bahncard Row */}
			<div className="flex flex-col gap-3">
				<select
					name="trainClass"
					defaultValue="2"
					className="w-full border-2 border-gray-800 rounded-lg p-3 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
				>
					<option value="2">2. Klasse</option>
					<option value="1">1. Klasse</option>
				</select>
				<select
					name="bahncard"
					defaultValue="none"
					className="w-full border-2 border-gray-800 rounded-lg p-3 text-base font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
				>
					<option value="none">Keine Bahncard</option>
					<option value="25">Bahncard 25</option>
					<option value="50">Bahncard 50</option>
					<option value="100">Bahncard 100</option>
				</select>
			</div>

			{/* Search Button */}
			<button
				type="submit"
				className="w-full bg-primary text-white rounded-lg p-3 text-lg font-mono font-bold hover:opacity-90 transition-opacity"
			>
				Verbindung suchen
			</button>
		</form>
	);
}
