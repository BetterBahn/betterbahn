"use client";

export function ShareLinkHelpSection() {
	return (
		<div className="text-sm text-gray-500 font-mono">
			<p className="font-semibold text-gray-600 mb-2">So geht&apos;s:</p>
			<ol className="list-decimal list-inside space-y-1">
				<li>
					Gehe auf <strong>bahn.de</strong> und plane deine Verbindung
				</li>
				<li>Wähle deine gewünschte Verbindung aus</li>
				<li>
					Klicke auf die <strong>drei kleinen Punkte</strong> oben in der Ecke
					der Verbindung
				</li>
				<li>
					Klicke auf <strong>&bdquo;Verbindung Teilen&ldquo;</strong>
				</li>
				<li>
					Klicke auf <strong>&bdquo;Infos Kopieren&ldquo;</strong>
				</li>
				<li>Füge den kompletten kopierten Text hier ein</li>
			</ol>
		</div>
	);
}
