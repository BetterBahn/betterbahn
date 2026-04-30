"use client";

interface SplitAnalysisLoadingProps {
	checkedStations: number;
	totalStations: number;
}

export default function SplitAnalysisLoading({
	checkedStations,
	totalStations,
}: SplitAnalysisLoadingProps) {
	const safeTotal = Math.max(totalStations, 0);
	const safeChecked = Math.max(
		0,
		safeTotal > 0 ? Math.min(checkedStations, safeTotal) : checkedStations,
	);
	const progress =
		safeTotal > 0
			? Math.min(100, Math.max(0, (safeChecked / safeTotal) * 100))
			: 0;

	return (
		<div className="min-h-[60vh] flex items-center justify-center">
			<div className="loader-wrap">
				<div className="loader-container" aria-hidden="true">
					<div className="loader-track" />
					<div className="loader-train" />
				</div>

				<div className="mt-3 text-center font-mono">
					<p className="text-xl font-semibold text-primary">
						{safeChecked} von {safeTotal} Stationen geprüft
					</p>
					<div
						className="progress-bar-track"
						role="progressbar"
						aria-valuenow={Math.round(progress)}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<div
							className="progress-bar-fill"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			<style jsx>{`
				.loader-wrap {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
				}

				.loader-container {
					--s: 2;
					position: relative;
					margin-left: calc(13px * var(--s));
				}

				.loader-track {
					position: relative;
					overflow: hidden;
					width: calc(50px * var(--s));
					height: calc(100px * var(--s));
					border-left: calc(3px * var(--s)) solid #333;
					transform: skew(-10deg) rotateX(45deg);
				}

				.loader-track:before {
					content: "";
					position: absolute;
					height: calc(3px * var(--s));
					width: calc(50px * var(--s));
					background-color: #333;
					top: calc(90px * var(--s));
					box-shadow:
						0 0 #333,
						0 calc(-10px * var(--s)) #333,
						0 calc(-20px * var(--s)) #333,
						0 calc(-30px * var(--s)) #333,
						0 calc(-40px * var(--s)) #333,
						0 calc(-50px * var(--s)) #333,
						0 calc(-60px * var(--s)) #333,
						0 calc(-70px * var(--s)) #333,
						0 calc(-80px * var(--s)) #333,
						0 calc(-90px * var(--s)) #333,
						0 calc(-100px * var(--s)) #333,
						0 calc(-110px * var(--s)) #333,
						0 calc(-120px * var(--s)) #333,
						0 calc(-130px * var(--s)) #333,
						0 calc(-140px * var(--s)) #333;
					animation: track 1s linear infinite;
				}

				@keyframes track {
					0% {
						transform: translateY(calc(70px * var(--s))) rotateX(45deg);
					}
					100% {
						transform: translateY(0px) rotateX(45deg);
					}
				}

				.loader-track:after {
					content: "";
					position: absolute;
					transform: rotate(-15deg);
					width: calc(50px * var(--s));
					height: calc(120px * var(--s));
					background-color: #fff;
					border-left: calc(3px * var(--s)) solid #333;
					left: calc(30px * var(--s));
					top: calc(-10px * var(--s));
				}

				.loader-train {
					position: absolute;
					width: calc(60px * var(--s));
					height: calc(60px * var(--s));
					background-color: #333;
					border-radius: calc(15px * var(--s));
					top: 0;
					left: calc(-13px * var(--s));
					transform-origin: bottom;
					animation: rotate 1s linear infinite;
				}

				.loader-train:before {
					content: "";
					position: absolute;
					background-color: #ced4da;
					width: calc(20px * var(--s));
					height: calc(15px * var(--s));
					left: calc(9px * var(--s));
					top: calc(15px * var(--s));
					box-shadow: calc(22px * var(--s)) 0 #ced4da;
				}

				.loader-train:after {
					content: "";
					position: absolute;
					background-color: #ced4da;
					border-radius: 50%;
					height: calc(10px * var(--s));
					width: calc(10px * var(--s));
					top: calc(45px * var(--s));
					left: calc(10px * var(--s));
					box-shadow: calc(30px * var(--s)) 0 #ced4da;
				}

				@keyframes rotate {
					0% {
						transform: rotate(0);
					}
					25% {
						transform: rotate(2deg);
					}
					50% {
						transform: rotate(0);
					}
					75% {
						transform: rotate(-2deg);
					}
					100% {
						transform: rotate(0);
					}
				}

				@media (max-width: 640px) {
					.loader-container {
						--s: 1.7;
					}
				}

				.progress-bar-track {
					margin-top: 10px;
					margin-left: auto;
					margin-right: auto;
					width: 180px;
					height: 6px;
					background-color: #e5e7eb;
					border-radius: 9999px;
					overflow: hidden;
				}

				.progress-bar-fill {
					height: 100%;
					background-color: #4b6058;
					border-radius: 9999px;
					transition: width 0.3s ease;
				}

				@media (max-width: 640px) {
					.progress-bar-track {
						width: 150px;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.loader-track:before,
					.loader-train {
						animation: none;
					}
					.progress-bar-fill {
						transition: none;
					}
				}
			`}</style>
		</div>
	);
}
