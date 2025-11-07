"use client";

import { useState, useRef, useEffect } from "react";
import { useStationSearch, Station } from "@/lib/hooks/useStationSearch";

interface StationInputProps {
	placeholder: string;
	value: string;
	onSelect: (station: Station) => void;
}

export default function StationInput({
	placeholder,
	value,
	onSelect,
}: StationInputProps) {
	const [inputValue, setInputValue] = useState(value);
	const [showDropdown, setShowDropdown] = useState(false);
	const [selectedStation, setSelectedStation] = useState<Station | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const { stations, loading, error } = useStationSearch(inputValue);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setShowDropdown(true);
		setSelectedStation(null);
	};

	const handleStationSelect = (station: Station) => {
		setSelectedStation(station);
		setInputValue(station.name);
		setShowDropdown(false);
		onSelect(station);
	};

	return (
		<div className="relative w-full" ref={dropdownRef}>
			<input
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onFocus={() => setShowDropdown(true)}
				placeholder={placeholder}
				className="w-full border-2 border-gray-800 rounded-xl p-4 text-lg font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
			/>

			{/* Dropdown */}
			{showDropdown && (inputValue.trim().length >= 2 || loading) && (
				<div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-800 rounded-xl shadow-lg max-h-60 overflow-y-auto">
					{loading && (
						<div className="p-4 text-center text-gray-600 font-mono">
							Suche...
						</div>
					)}

					{error && (
						<div className="p-4 text-center text-red-600 font-mono">
							{error}
						</div>
					)}

					{!loading &&
						!error &&
						stations.length === 0 &&
						inputValue.trim().length >= 2 && (
							<div className="p-4 text-center text-gray-600 font-mono">
								Keine Bahnhöfe gefunden
							</div>
						)}

					{!loading &&
						!error &&
						stations.map((station) => (
							<button
								key={station.id}
								type="button"
								onClick={() => handleStationSelect(station)}
								className="w-full text-left p-4 hover:bg-primary hover:text-white transition-colors font-mono border-b border-gray-200 last:border-b-0"
							>
								{station.name}
							</button>
						))}
				</div>
			)}
		</div>
	);
}
