// Remark Types

export interface Remark {
	code?: string;
	summary?: string;
	text?: string;
	type?: string;
	priority?: number;
}

// Station Types

export interface Station {
	type: string;
	id: string;
	name: string;
	location?: {
		type: string;
		latitude: number;
		longitude: number;
	};
}

// Stopover Types

export interface StopoverStation {
	id: string;
	name: string;
	type: string;
	location?: {
		type: string;
		id: string;
		latitude: number;
		longitude: number;
	};
	priceCategory?: number;
	[key: string]: any; // For additional properties
}

export interface Stopover {
	stop: StopoverStation;
	arrival?: string | null;
	plannedArrival?: string | null;
	arrivalDelay?: number | null;
	departure?: string | null;
	plannedDeparture?: string | null;
	departureDelay?: number | null;
	[key: string]: any; // For additional properties
}

// Journey Types

export interface JourneyLeg {
	origin: {
		name: string;
		type: string;
		id?: string;
	};
	destination: {
		name: string;
		type: string;
		id?: string;
	};
	departure?: string;
	arrival?: string;
	plannedDeparture?: string;
	plannedArrival?: string;
	line?: {
		name: string;
		type: string;
		product?: string;
		productName?: string;
	};
	stopovers?: Stopover[];
	remarks?: (string | Remark)[];
	tripId?: string;
}

export interface Journey {
	type: string;
	legs: JourneyLeg[];
	price?: {
		amount: number;
		currency: string;
	};
	refreshToken?: string;
	remarks?: (string | Remark)[];
}

export interface JourneyResponse {
	journeys: Journey[];
	earlierRef?: string;
	laterRef?: string;
}

// Search Types
export interface StationSearchResult {
	stations: Station[];
	loading: boolean;
	error: string | null;
}

export interface JourneySearchResult {
	data: JourneyResponse | null;
	loading: boolean;
	error: string | null;
}

// Search Paramet

export interface JourneySearchParams {
	from: string;
	to: string;
	departure?: string;
	age?: string;
	deutschlandTicketDiscount?: boolean;
	firstClass?: boolean;
	loyaltyCard?: string;
	tickets?: boolean;
}

// Split Ticketing Types

export interface SplitOption {
	splitStation: StopoverStation;
	firstLegPrice: number;
	secondLegPrice: number;
	totalPrice: number;
	savings: number;
	savingsPercentage: number;
	firstLegJourney?: Journey;
	secondLegJourney?: Journey;
}

export interface SplitTicketingResult {
	originalPrice: number;
	splits: SplitOption[];
	loading: boolean;
	error: string | null;
	checkedStations: number;
	totalStations: number;
}
