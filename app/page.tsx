import { Suspense } from "react";
import SearchForm from "@/app/components/search/searchForm";
import SearchResults from "@/app/components/search/searchResults";
import Hero from "@/app/components/layout/heroImage";

export default function Home() {
	return (
		<main>
			<Hero />
			<SearchForm />

			{/* Journey Results displayed below search form */}
			<div className="mt-8">
				<Suspense
					fallback={
						<div className="flex justify-center items-center p-8">
							<div className="text-lg font-mono">Lade Ergebnisse...</div>
						</div>
					}
				>
					<SearchResults />
				</Suspense>
			</div>
		</main>
	);
}
