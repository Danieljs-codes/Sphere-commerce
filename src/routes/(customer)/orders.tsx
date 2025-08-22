import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Card } from "@ui/card";
import { Heading } from "@ui/heading";
import z from "zod/v4";
import { getUserOrderHistoryQueryOptions } from "@/lib/query-options";
import { getBadgeIntentForOrderStatus } from "@/lib/utils";
import { setFlashCookie } from "@/types/utils";

const searchParamSchema = z.object({
	limit: z.number().min(1).max(100).default(10),
});

export const Route = createFileRoute("/(customer)/orders")({
	validateSearch: searchParamSchema,
	beforeLoad: ({ context }) => {
		if (!context.user) {
			setFlashCookie({
				intent: "error",
				message: "You must be logged in to have order history.",
			});

			throw redirect({
				to: "/",
				replace: true,
			});
		}
	},
	loaderDeps: ({ search }) => ({ ...search }),
	loader: async ({ context, deps }) => {
		context.queryClient.ensureInfiniteQueryData(
			getUserOrderHistoryQueryOptions({
				limit: deps.limit,
			}),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery(
		getUserOrderHistoryQueryOptions(search),
	);

	console.log(data.pages);

	return (
		<div>
			<Card.Header className="mx-auto mb-6 text-center">
				<Heading>Order History</Heading>
				<Card.Description>
					Track your recent orders, process returns, and download invoices
					effortlessly.
				</Card.Description>
			</Card.Header>
			<div className="mx-auto max-w-2xl">
				{data.pages.map((group, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: I know what I am doing!!!
					<div key={i}>
						{group.orders.map((order) => (
							<div className="mb-4 last:mb-0" key={order.id}>
								<MetricCard
									title={`Order #${order.orderNumber}`}
									classNames={{
										header: "p-2 block flex items-center justify-between",
										title:
											"pl-0 font-mono font-normal! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
										action: "w-fit",
										content: "mt-0 h-full",
									}}
									action={
										<Badge
											className="capitalize"
											intent={getBadgeIntentForOrderStatus(order.status)}
										>
											{order.status === "processing" && <IconPackageProcess />}
											{order.status === "shipped" && <IconPackageMoving />}
											{order.status === "delivered" && <IconPackageDelivered />}
											{order.status.toLowerCase()}
										</Badge>
									}
								>
									{/* <p className="text-2xl font-semibold">{data.counts.total}</p> */}
								</MetricCard>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
