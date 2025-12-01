import type { JourneyLeg } from "@/lib/types";

/**
 * Check if a journey leg is eligible for Deutschland-Ticket usage
 * Uses two methods:
 * 1. Primary: API's remark code "9G" (authoritative)
 * 2. Fallback: Product type checks (regional, suburban, Bus)
 *
 * @param leg - The journey leg to check
 * @returns true if the leg is eligible for Deutschland-Ticket
 */
export function isDeutschlandTicketEligible(leg: JourneyLeg): boolean {
	// Primary check: Look for "9G" remark code (most reliable)
	if (leg.remarks && leg.remarks.length > 0) {
		const has9GRemark = leg.remarks.some((remark) => {
			// Handle both string and object remarks
			if (typeof remark === "string") {
				return false;
			}
			// Type guard: at this point we know it's not a string
			const remarkObj = remark as { code?: string };
			return remarkObj.code === "9G";
		});

		if (has9GRemark) {
			return true;
		}
	}

	// Fallback check: Product type validation
	// If no line info, it's likely a walking leg (eligible)
	if (!leg.line) {
		return true;
	}

	// Check if product is regional, suburban, or Bus
	return (
		leg.line.product === "regional" ||
		leg.line.product === "suburban" ||
		leg.line.productName === "Bus"
	);
}

/**
 * Calculate the effective price for a journey leg considering Deutschland-Ticket
 *
 * @param leg - The journey leg
 * @param price - The original price in cents
 * @param hasDeutschlandTicket - Whether the user has a Deutschland-Ticket
 * @returns The effective price (0 if eligible and user has ticket, otherwise original price)
 */
export function calculateLegPrice(
	leg: JourneyLeg,
	price: number,
	hasDeutschlandTicket: boolean
): number {
	// If user doesn't have Deutschland-Ticket, return full price
	if (!hasDeutschlandTicket) {
		return price;
	}

	// If leg is eligible for Deutschland-Ticket, price is 0
	if (isDeutschlandTicketEligible(leg)) {
		return 0;
	}

	// Otherwise return full price
	return price;
}

/**
 * Check if ALL legs in a journey are eligible for Deutschland-Ticket
 *
 * @param legs - Array of journey legs
 * @returns true if all legs with a line are Deutschland-Ticket eligible
 */
export function isFullJourneyDeutschlandTicketEligible(
	legs: JourneyLeg[]
): boolean {
	return legs.every((leg) => {
		// Skip walking legs (they don't have a line)
		if (!leg.line) {
			return true;
		}
		return isDeutschlandTicketEligible(leg);
	});
}
