import { OverviewMetrics } from "@components/admin/overview-metrics";
import { SalesMetrics } from "@components/admin/sales-metrics";
import { createFileRoute } from "@tanstack/react-router";
import { Heading } from "@ui/heading";
import { Loader } from "@ui/loader";
import { Suspense } from "react";
import z from "zod/v4";
import {
	getOverviewStatsQueryOptions,
	getRecentSalesDataQueryOptions,
} from "@/lib/query-options";

const searchParamSchema = z.object({
	from: z.iso
		.datetime({ message: "Must be a valid ISO date string" })
		.default(
			new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
		)
		.catch(
			new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
		),
	to: z.iso
		.datetime({ message: "Must be a valid ISO date string" })
		.default(new Date().toISOString())
		.refine((date) => new Date(date) <= new Date(), {
			message: "End date cannot be in the future",
		})
		.catch(new Date().toISOString()),
});

export const Route = createFileRoute("/admin/dashboard")({
	validateSearch: searchParamSchema,
	loaderDeps: ({ search }) => ({ from: search.from, to: search.to }),
	loader: async ({ context, deps }) => {
		context.queryClient.ensureQueryData(getOverviewStatsQueryOptions());
		context.queryClient.ensureQueryData(
			getRecentSalesDataQueryOptions({ from: deps.from, to: deps.to }),
		);
		return {
			title: "Overview",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<Heading className="sm:text-xl mb-6">
				Metrics over the last 30 Days
			</Heading>
			<div className="flex flex-col gap-4">
				<Suspense
					fallback={
						// TODO: Implement the proper fallback
						<div className="flex justify-center">
							<Loader intent="primary" />
						</div>
					}
				>
					<OverviewMetrics />
				</Suspense>
				<Suspense>
					<SalesMetrics />
				</Suspense>
			</div>
		</div>
	);
}
