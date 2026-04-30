"use client";

import { createContext, useContext, useState } from "react";

interface JourneyPrice {
	amount: number;
	currency: string;
}

interface JourneyInfoContextValue {
	price: JourneyPrice | null;
	setPrice: (price: JourneyPrice | null) => void;
}

const JourneyInfoContext = createContext<JourneyInfoContextValue>({
	price: null,
	setPrice: () => {},
});

export function JourneyInfoProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [price, setPrice] = useState<JourneyPrice | null>(null);

	return (
		<JourneyInfoContext.Provider value={{ price, setPrice }}>
			{children}
		</JourneyInfoContext.Provider>
	);
}

export function useJourneyInfo() {
	return useContext(JourneyInfoContext);
}
