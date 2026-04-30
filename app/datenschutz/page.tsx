import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Datenschutz – BetterBahn",
};

export default function DatenschutzPage() {
	return (
		<main className="py-8 mx-auto">
			<Link
				href="/"
				className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline mb-6"
			>
				← Zurück
			</Link>

			<h1 className="text-2xl font-bold font-mono mb-8">Datenschutzerklärung</h1>

			{/* Verantwortlicher */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">1. Verantwortlicher</h2>
				<p className="font-mono text-sm leading-relaxed">
					Softwareentwicklung Lukas Weihrauch
					<br />
					inh. Lukas Weihrauch
					<br />
					c/o Postflex #9347
					<br />
					Emsdettener Str. 10
					<br />
					48268 Greven
					<br />
					<br />
					E-Mail:{" "}
					<a href="mailto:mail@lukasweihrauch.de" className="text-primary hover:underline">
						mail@lukasweihrauch.de
					</a>
				</p>
			</section>

			{/* Hosting */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">2. Hosting</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					Diese Website wird bei <strong>netcup GmbH</strong>, Daimlerstraße 25, 76185 Karlsruhe,
					gehostet. Beim Aufruf der Website werden durch den Hosting-Anbieter technisch
					notwendige Verbindungsdaten (z. B. IP-Adresse, Datum und Uhrzeit des Abrufs,
					aufgerufene Seite) in Server-Logfiles verarbeitet. Dies erfolgt auf Grundlage
					von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und
					stabilen Betrieb des Angebots).
				</p>
				<p className="font-mono text-sm leading-relaxed text-gray-700 mt-2">
					Weitere Informationen zum Datenschutz bei netcup finden Sie unter{" "}
					<a
						href="https://www.netcup.de/kontakt/datenschutzerklaerung.php"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						netcup.de/kontakt/datenschutzerklaerung.php
					</a>
					.
				</p>
			</section>

			{/* Cookies */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">3. Cookies</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					BetterBahn verwendet ausschließlich technisch notwendige Cookies sowie den
					lokalen Browserspeicher (<code>localStorage</code>), um Ihre Reiseoptionen
					(z. B. bevorzugte Verbindungseinstellungen) für Ihren nächsten Besuch zu
					speichern. Diese Speicherung dient allein dem Komfort und ist für die
					Grundfunktion der Anwendung erforderlich.
				</p>
				<p className="font-mono text-sm leading-relaxed text-gray-700 mt-2">
					Es werden keine Tracking-Cookies, Analyse-Cookies oder Cookies von
					Drittanbietern zu Werbezwecken eingesetzt. Da ausschließlich technisch
					notwendige Cookies genutzt werden, ist nach § 25 Abs. 2 TTDSG keine
					gesonderte Einwilligung erforderlich.
				</p>
			</section>

			{/* Externe Dienste / API */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">4. Externe Dienste und Fahrplandaten</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					BetterBahn ist ein reines Frontend. Die Anwendung beschafft selbst keine
					Fahrplandaten, sondern stellt lediglich eine Benutzeroberfläche bereit, über
					die Anfragen an externe Fahrplan-APIs gestellt werden. Standardmäßig wird die
					öffentliche Instanz von{" "}
					<a
						href="https://v6.db.transport.rest"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						transport.rest
					</a>{" "}
					genutzt.
				</p>
				<p className="font-mono text-sm leading-relaxed text-gray-700 mt-2">
					Nutzerinnen und Nutzer können in den Einstellungen eine eigene API-URL
					hinterlegen. Durch die Nutzung eines externen Dienstes werden Anfragen
					(einschließlich technischer Verbindungsdaten wie der IP-Adresse) direkt von
					Ihrem Gerät an den jeweiligen Drittanbieter übermittelt. Für dessen
					Datenverarbeitung ist der jeweilige Anbieter verantwortlich. Die Nutzung
					externer Dienste erfolgt auf eigenes Risiko.
				</p>
				<p className="font-mono text-sm leading-relaxed text-gray-700 mt-2">
					BetterBahn speichert, verarbeitet oder protokolliert keine der über die
					API abgerufenen Reisedaten.
				</p>
			</section>

			{/* Betroffenenrechte */}
			<section className="mb-6">
				<h2 className="text-base font-bold font-mono mb-3">5. Ihre Rechte</h2>
				<p className="font-mono text-sm leading-relaxed text-gray-700">
					Sie haben gegenüber dem Verantwortlichen folgende Rechte hinsichtlich der
					Sie betreffenden personenbezogenen Daten:
				</p>
				<ul className="font-mono text-sm leading-relaxed text-gray-700 mt-2 ml-4 list-disc space-y-1">
					<li>Recht auf Auskunft (Art. 15 DSGVO)</li>
					<li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
					<li>Recht auf Löschung (Art. 17 DSGVO)</li>
					<li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
					<li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
					<li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
				</ul>
				<p className="font-mono text-sm leading-relaxed text-gray-700 mt-2">
					Zur Ausübung Ihrer Rechte wenden Sie sich bitte per E-Mail an{" "}
					<a href="mailto:mail@lukasweihrauch.de" className="text-primary hover:underline">
						mail@lukasweihrauch.de
					</a>
					. Außerdem steht Ihnen ein Beschwerderecht bei der zuständigen
					Datenschutz-Aufsichtsbehörde zu.
				</p>
			</section>

			<p className="font-mono text-xs text-gray-400 mt-8">Stand: April 2026</p>
		</main>
	);
}
