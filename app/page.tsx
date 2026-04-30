import { Suspense } from "react";
import ShareLinkInput from "@/app/components/search/ShareLinkInput";
import Hero from "@/app/components/layout/heroImage";

export default function Home() {
	return (
		<main>
			<Hero />
			<Suspense
				fallback={
					<div className="flex justify-center items-center p-8">
						<div className="text-lg font-mono">Lade Suchformular...</div>
					</div>
				}
			>
				<ShareLinkInput />
			</Suspense>
		</main>
	);
}
