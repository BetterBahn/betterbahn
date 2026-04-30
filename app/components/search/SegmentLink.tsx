"use client";

import type { CSSProperties } from "react";

/**
 * Opens a booking URL externally. In iOS PWA standalone mode the native share
 * sheet is used so the user can open the link in Safari or the DB Navigator
 * app. In all other contexts a regular new-tab open is used.
 */
function handleBookingLink(e: React.MouseEvent, url: string): void {
	e.stopPropagation();
	e.preventDefault();
	const navigatorWithStandalone = window.navigator as Navigator & {
		standalone?: boolean;
	};
	const isStandalone =
		window.matchMedia("(display-mode: standalone)").matches ||
		navigatorWithStandalone.standalone === true;
	if (isStandalone && typeof navigator.share === "function") {
		navigator
			.share({ url })
			.catch(() => window.open(url, "_blank", "noopener,noreferrer"));
	} else {
		window.open(url, "_blank", "noopener,noreferrer");
	}
}

interface SegmentLinkProps {
	url: string | null;
	children: React.ReactNode;
	className?: string;
	style?: CSSProperties;
}

/**
 * Renders an <a> pointing to `url` when a URL is provided, otherwise a plain
 * <div>. Clicking the link opens the booking URL externally (PWA-aware).
 */
export default function SegmentLink({
	url,
	children,
	className,
	style,
}: SegmentLinkProps) {
	if (!url) {
		return (
			<div className={className} style={style}>
				{children}
			</div>
		);
	}
	return (
		<a
			href={url}
			rel="noopener noreferrer"
			onClick={(e) => handleBookingLink(e, url)}
			className={className}
			style={style}
		>
			{children}
		</a>
	);
}
