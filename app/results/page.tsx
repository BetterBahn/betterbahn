import { Suspense } from "react";
import SearchResults from "@/app/components/search/searchResults";
import Link from "next/link";

export default function ResultsPage() {
	return (
		<main className="flex min-h-screen flex-col items-center p-8">
			{/* Back to search link */}
			<div className="w-full max-w-2xl mb-4">
				<Link href="/" className="text-primary font-mono hover:underline">
					← Neue Suche
				</Link>
			</div>

			{/* Search Results */}
			<Suspense
				fallback={
					<div className="flex justify-center items-center p-8">
						<div className="text-lg font-mono">Lade Ergebnisse...</div>
					</div>
				}
			>
				<SearchResults />
			</Suspense>
		</main>
	);
}
