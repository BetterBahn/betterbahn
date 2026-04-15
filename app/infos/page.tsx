import type { Metadata } from "next";
import Link from "next/link";
import { ShareLinkHelpSection } from "@/app/components/search/ShareLinkHelpSection";

export const metadata: Metadata = {
	title: "Infos – BetterBahn",
};

export default function InfosPage() {
	return (
		<main className="py-8 mx-auto">
			<Link
				href="/"
				className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline mb-6"
			>
				← Zurück
			</Link>

			<h1 className="text-2xl font-bold font-mono mb-3">Infos</h1>
			<p className="font-mono text-sm text-gray-600 mb-8 max-w-2xl">
				Hier findest du die Anleitung, wie du den Teilen-Text aus der
				DB-Verbindungsauskunft kopierst und in BetterBahn einfügst.
			</p>

			<section className="border-2 rounded-3xl p-6">
				<h2 className="text-base font-bold font-mono mb-4">
					Wie kopiere ich den Text?
				</h2>
				<ShareLinkHelpSection />
			</section>
		</main>
	);
}
