"use client";

interface PriceTagProps {
	price: number;
}

/** Displays a price in Euro. Shows a D-Ticket badge when price is 0. */
export default function PriceTag({ price }: PriceTagProps) {
	if (price === 0) {
		return (
			<span className="font-mono text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
				<span className="text-green-600">0,00 €</span>
				<span className="text-green-600 bg-green-100 px-1 py-0.5 rounded">
					D-Ticket
				</span>
			</span>
		);
	}
	return (
		<span className="font-mono text-xs font-semibold whitespace-nowrap">
			{price.toFixed(2)} €
		</span>
	);
}
