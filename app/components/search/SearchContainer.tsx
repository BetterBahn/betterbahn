"use client";

import { useState } from "react";
import SearchMethodToggle from "./SearchMethodToggle";
import SearchForm from "./searchForm";

export default function SearchContainer() {
	const [searchMethod, setSearchMethod] = useState<"form" | "link">("form");

	return (
		<div className="w-full">
			<SearchMethodToggle
				activeMethod={searchMethod}
				onToggle={setSearchMethod}
			/>

			{searchMethod === "form" ? (
				<SearchForm />
			) : (
				<div className="flex flex-col gap-4 w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
					<label
						htmlFor="travel-link"
						className="text-sm font-medium text-gray-700"
					>
						Reise-Link einfügen
					</label>
					<textarea
						id="travel-link"
						placeholder="Link-Suche wird hier implementiert..."
						className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						rows={4}
						disabled
					/>
					<p className="text-sm text-gray-500 italic">
						Diese Funktion wird im nächsten Schritt implementiert.
					</p>
				</div>
			)}
		</div>
	);
}
