"use client";

import { useState } from "react";
import SearchMethodToggle from "./SearchMethodToggle";
import SearchForm from "./searchForm";
import ShareLinkInput from "./ShareLinkInput";

export default function SearchContainer() {
	// const [searchMethod, setSearchMethod] = useState<"form" | "link">("form");

	return (
		<div className="w-full">
			{/* <SearchMethodToggle
				activeMethod={searchMethod}
				onToggle={setSearchMethod}
			/>

			{searchMethod === "link" ? <ShareLinkInput /> : <SearchForm />} */}
			<ShareLinkInput />
		</div>
	);
}
