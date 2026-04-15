"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePwaInstall } from "@/lib/hooks/usePwaInstall";

const NAV_ITEMS = [
	{ label: "Infos", href: "/infos" },
	{ label: "Unterstützen", href: "/unterstuetzen" },
	{ label: "Einstellungen", href: "/einstellungen" },
	{ label: "Impressum", href: "/impressum" },
	{ label: "Datenschutz", href: "/datenschutz" },
];

export default function Header() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const drawerRef = useRef<HTMLDivElement>(null);
	const { canInstall, triggerInstall } = usePwaInstall();

	// Prevent body scroll when drawer is open
	useEffect(() => {
		if (drawerOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [drawerOpen]);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setDrawerOpen(false);
		};
		if (drawerOpen) document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [drawerOpen]);

	return (
		<>
			{/* Fixed Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
				<div className="container mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-0 select-none">
						<span className="text-xl font-bold tracking-tight text-foreground">
							Better
						</span>
						<span className="text-xl font-bold tracking-tight text-primary">
							Bahn
						</span>
					</Link>

					{/* Hamburger Button */}
					<button
						type="button"
						onClick={() => setDrawerOpen(true)}
						className="p-2 -mr-2 text-foreground hover:text-primary transition-colors cursor-pointer"
						aria-label="Menü öffnen"
						aria-expanded={drawerOpen}
						aria-controls="nav-drawer"
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
				</div>
			</header>

			{/* Overlay */}
			<div
				className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
					drawerOpen
						? "opacity-100 pointer-events-auto"
						: "opacity-0 pointer-events-none"
				}`}
				onClick={() => setDrawerOpen(false)}
				aria-hidden="true"
			/>

			{/* Drawer */}
			<nav
				id="nav-drawer"
				ref={drawerRef}
				className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
					drawerOpen ? "translate-x-0" : "translate-x-full"
				}`}
				aria-label="Hauptnavigation"
			>
				{/* Drawer Header */}
				<div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
					<span className="font-bold text-lg text-foreground">Menü</span>
					<button
						type="button"
						onClick={() => setDrawerOpen(false)}
						className="p-2 -mr-2 text-gray-400 hover:text-foreground transition-colors cursor-pointer"
						aria-label="Menü schließen"
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				{/* Nav Links */}
				<ul className="p-3 space-y-1">
					{NAV_ITEMS.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								onClick={() => setDrawerOpen(false)}
								className="block py-3 px-3 rounded-xl text-base font-medium text-foreground hover:bg-gray-50 hover:text-primary transition-colors"
							>
								{item.label}
							</Link>
						</li>
					))}
					{canInstall && (
						<li>
							<button
								type="button"
								onClick={() => {
									triggerInstall();
									setDrawerOpen(false);
								}}
								className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-base font-medium text-primary hover:bg-gray-50 transition-colors cursor-pointer"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M12 3v12" />
									<path d="M8 11l4 4 4-4" />
									<path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
								</svg>
								App installieren
							</button>
						</li>
					)}
				</ul>
			</nav>
		</>
	);
}
