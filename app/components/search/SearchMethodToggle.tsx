"use client";

interface SearchMethodToggleProps {
	activeMethod: "form" | "link";
	onToggle: (method: "form" | "link") => void;
}

export default function SearchMethodToggle({
	activeMethod,
	onToggle,
}: SearchMethodToggleProps) {
	return (
		<div className="flex items-center justify-center gap-2 mb-6">
			<button
				type="button"
				onClick={() => onToggle("form")}
				className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
					activeMethod === "form"
						? "bg-primary text-white shadow-md"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
				aria-pressed={activeMethod === "form"}
			>
				Suchmaske
			</button>
			<button
				type="button"
				onClick={() => onToggle("link")}
				className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
					activeMethod === "link"
						? "bg-primary text-white shadow-md"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
				aria-pressed={activeMethod === "link"}
			>
				Reise-Link
			</button>
		</div>
	);
}
