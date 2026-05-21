"use client";

import type { AppRouter } from "@/app/api/[trpc]/route";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	httpBatchLink,
	httpSubscriptionLink,
	loggerLink,
	splitLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			refetchInterval: false,
			refetchIntervalInBackground: false,
			retry: false,
		},
	},
});

export const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
	links: [
		loggerLink({
			enabled: (opts) =>
				process.env.NODE_ENV === "development" &&
				(opts.direction === "up" ||
					(opts.direction === "down" && opts.result instanceof Error)),
		}),
		splitLink({
			// uses the httpSubscriptionLink for subscriptions
			condition: (op) => op.type === "subscription",
			true: httpSubscriptionLink({
				transformer: SuperJSON,
				url: `/api`,
			}),
			false: httpBatchLink({
				transformer: SuperJSON,
				url: `/api`,
			}),
		}),
	],
});

export function TRPCReactProvider(
	props: Readonly<{
		children: React.ReactNode;
	}>
) {
	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{props.children}
			</QueryClientProvider>
		</trpc.Provider>
	);
}
