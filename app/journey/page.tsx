import { Suspense } from "react";
import SearchResults from "@/app/components/search/searchResults";
import SplitAnalysisLoading from "@/app/components/search/SplitAnalysisLoading";
import SearchContextBar from "@/app/components/search/SearchContextBar";
import { JourneyInfoProvider } from "@/lib/context/journeyInfoContext";

export default function JourneyPage() {
	return (
		<JourneyInfoProvider>
			<div className="fixed inset-0 z-60 bg-white overflow-y-auto flex flex-col">
				<SearchContextBar />
				<main className="container mx-auto max-w-4xl px-4 flex-1">
					<Suspense
						fallback={
							<SplitAnalysisLoading checkedStations={0} totalStations={0} />
						}
					>
						<SearchResults />
					</Suspense>
				</main>
			</div>
		</JourneyInfoProvider>
	);
}
