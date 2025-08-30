import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { OrdersSkeleton } from "@components/skeletons/orders";
import { SummaryItem } from "@components/summary-item";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Card } from "@ui/card";
import { Heading } from "@ui/heading";
import { Loader } from "@ui/loader";
import { Table } from "@ui/table";
import { format } from "date-fns";
import { useEffect } from "react";
import z from "zod/v4";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { getUserOrderHistoryQueryOptions } from "@/lib/query-options";
import { formatMoney, getBadgeIntentForOrderStatus } from "@/lib/utils";
import { setFlashCookie } from "@/types/utils";

const searchParamSchema = z.object({
	limit: z.number().min(1).max(100).default(10),
});

export const Route = createFileRoute("/(customer)/orders")({
	validateSearch: searchParamSchema,
	pendingComponent: OrdersSkeleton,
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
	const { isIntersecting, ref } = useIntersectionObserver({
		threshold: 0.5,
	});
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useSuspenseInfiniteQuery(getUserOrderHistoryQueryOptions(search));

	// biome-ignore lint/correctness/useExhaustiveDependencies: Shut up
	useEffect(() => {
		if (isIntersecting && hasNextPage) {
			fetchNextPage();
		}
	}, [isIntersecting, hasNextPage]);

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
							<div
								className="mb-4 last:mb-0"
								key={order.id}
								ref={i === data.pages.length - 2 ? ref : undefined}
							>
								<MetricCard
									title={`Order #${order.orderNumber}`}
									classNames={{
										header: "p-2 block flex items-center justify-between",
										title:
											"pl-0 font-mono font-normal! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
										action: "w-fit block",
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
									<div className="flex flex-col gap-y-3 pb-(--card-spacing)">
										<SummaryItem
											label="Ordered at"
											value={format(
												new Date(order.createdAt),
												"d/M/yyyy, h:mm:ss a",
											)}
										/>
										<SummaryItem
											label="Subtotal"
											value={formatMoney(order.subtotal)}
										/>
										<SummaryItem
											label="Subtotal"
											value={formatMoney(order.discountAmount)}
										/>
										<SummaryItem
											label="Total"
											value={formatMoney(order.total)}
										/>
										<SummaryItem
											label="Shipping Address"
											value={`${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}, ${order.shippingAddress.country}`}
											classNames={{
												value: "truncate",
											}}
										/>
										<SummaryItem
											label="Shipped at"
											value={
												order.shippedAt
													? format(
															new Date(order.shippedAt),
															"d/M/yyyy, h:mm:ss a",
														)
													: "Pending"
											}
										/>
										<SummaryItem
											label="Delivered at"
											value={
												order.deliveredAt
													? format(
															new Date(order.deliveredAt),
															"d/M/yyyy, h:mm:ss a",
														)
													: "Pending"
											}
										/>
									</div>
									<Table className="-mx-(--card-spacing) border-t -mb-(--card-spacing)">
										<Table.Header>
											<Table.Column isRowHeader>Name</Table.Column>
											<Table.Column>Quantity</Table.Column>
											<Table.Column>Price</Table.Column>
											<Table.Column>Total Price</Table.Column>
										</Table.Header>
										<Table.Body
											items={order.items}
											dependencies={[Math.random()]}
										>
											{(item) => (
												<Table.Row key={item.id}>
													<Table.Cell>{item.productName}</Table.Cell>
													<Table.Cell>{item.quantity}</Table.Cell>
													<Table.Cell className="font-medium">
														{formatMoney(item.pricePerItem)}
													</Table.Cell>
													<Table.Cell className="font-medium">
														{formatMoney(item.totalPrice)}
													</Table.Cell>
												</Table.Row>
											)}
										</Table.Body>
									</Table>
								</MetricCard>
							</div>
						))}
					</div>
				))}
			</div>
			{hasNextPage && isFetchingNextPage && (
				<div className="flex justify-center mt-6">
					<Button intent="secondary">
						<Loader />
						Loading More Order History
					</Button>
				</div>
			)}
			{!hasNextPage && (
				<div className="flex justify-center mt-6">
					<Button intent="secondary">No More Order History</Button>
				</div>
			)}
		</div>
	);
}
