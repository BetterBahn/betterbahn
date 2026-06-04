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

	const bahnCardParam = searchParams.get("bahnCard");
	const bahnCard = bahnCardParam !== null ? Number.parseInt(bahnCardParam, 10) : null;

	return {
		bahnCard,
		vbid,
		travelClass,
		hasDeutschlandTicket: searchParams.get("hasDeutschlandTicket") === "true",
		passengerAge,
	};
};
