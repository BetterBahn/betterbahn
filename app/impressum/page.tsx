import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Impressum – BetterBahn",
};

export default function ImpressumPage() {
	return (
		<main className="py-8  mx-auto">
			<Link
				href="/"
				className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline mb-6"
			>
				← Zurück
			</Link>

			<h1 className="text-2xl font-bold font-mono mb-8">Impressum</h1>

			{/* Angaben gemäß § 5 TMG */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">
					Angaben gemäß § 5 TMG
				</h2>
				<p className="font-mono text-sm leading-relaxed">
					Softwareentwicklung Lukas Weihrauch
					<br />
					inh. Lukas Weihrauch
					<br />
					c/o Postflex ##9347
					<br />
					Emsdettener Str. 10
					<br />
					48268 Greven
				</p>
				<p className="font-mono text-sm  ">
					Keine Pakete oder Päckchen – Annahme wird verweigert!
				</p>
			</section>

			{/* Kontakt */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">Kontakt</h2>
				<dl className="font-mono text-sm space-y-1">
					<div className="flex gap-2">
						<dt className="text-gray-500">E-Mail:</dt>
						<dd>
							<a
								href="mailto:mail@lukasweihrauch.de"
								className="text-primary hover:underline"
							>
								mail@lukasweihrauch.de
							</a>
						</dd>
					</div>
					<div className="flex gap-2">
						<dt className="text-gray-500">Telefon:</dt>
						<dd>
							<a
								href="tel:+4915207511013"
								className="text-primary hover:underline"
							>
								01520 7511013
							</a>
						</dd>
					</div>
				</dl>
			</section>

			{/* Haftung für Inhalte */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">
					Haftung für Inhalte
				</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte
					auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
					§§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
					verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
					überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
					Tätigkeit hinweisen.
				</p>
			</section>

			{/* Haftung für Links */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">
					Haftung für Links
				</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					Unser Angebot enthält Links zu externen Websites Dritter, auf deren
					Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
					fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
					verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
					Seiten verantwortlich.
				</p>
			</section>

			{/* Urheberrecht */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">Urheberrecht</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
					Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
					Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
					Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
					jeweiligen Autors bzw. Erstellers.
				</p>
			</section>
		</main>
	);
}
