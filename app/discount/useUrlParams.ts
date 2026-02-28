import { useSearchParams } from "next/navigation";

export const useUrlParams = () => {
	const searchParams = useSearchParams();

	const vbid = searchParams.get("vbid");

	if (!vbid) {
		throw new Error("Missing required parameter: vbid");
	}

	const travelClassParam = searchParams.get("travelClass");
	const travelClass = travelClassParam
		? Number.parseInt(travelClassParam, 10)
		: 2;

	const passengerAgeParam = searchParams.get("passengerAge");
	const passengerAge = passengerAgeParam
		? Number.parseInt(passengerAgeParam, 10)
		: undefined;

	return {
		bahnCard: searchParams.has("bahnCard")
			? Number.parseInt(searchParams.get("bahnCard")!, 10)
			: null,
		vbid,
		travelClass,
		hasDeutschlandTicket: searchParams.get("hasDeutschlandTicket") === "true",
		passengerAge,
	};
};
