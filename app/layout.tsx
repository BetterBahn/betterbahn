import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/layout/Header";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "BetterBahn",
	description:
		"Günstigere Zugverbindungen mit Split-Ticketing und Deutschland-Ticket",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "BetterBahn",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="de">
			<head>
				<meta name="theme-color" content="#4b6058" />
				<meta name="mobile-web-app-capable" content="yes" />
				<link rel="apple-touch-icon" href="/icons/icon-192.png" />
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased container mx-auto px-2 max-w-4xl pt-14`}
			>
				<Header />
				{children}
			</body>
		</html>
	);
}
