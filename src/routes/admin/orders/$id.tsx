import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getOrderQueryOptions } from "@/lib/query-options";
import { formatMoney, wait } from "@/lib/utils";
import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { IconCircleChevronLeftFilled } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { buttonStyles } from "@ui/button";
import { Link } from "@ui/link";
import { SearchField } from "@ui/search-field";
import { Table } from "@ui/table";
import { useState } from "react";
import { Blurhash } from "react-blurhash";

export const Route = createFileRoute("/admin/orders/$id")({
	loader: async ({ params, context }) => {
		// We need the order number for instead of not awaiting it, I use fetchQuery instead of ensureQueryData since it seeds the cache and allows for immediate access to the data (Explanation for myself since I confuse them sometimes)
		const result = await context.queryClient.fetchQuery(
			getOrderQueryOptions(params.id),
		);

		return {
			title: `Order #${result.orderNumber}`,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [q, setQ] = useState("");
	const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
	const params = Route.useParams();
	const { data } = useSuspenseQueryDeferred(getOrderQueryOptions(params.id));

	return (
		<div>
			<div className="mb-8">
				<Link
					to="/admin/orders"
					className={buttonStyles({ intent: "outline" })}
				>
					<IconCircleChevronLeftFilled data-slot="icon" />
					Back to Orders
				</Link>
			</div>
			<div className="grid grid-cols-3 mb-6">
				<MetricCard
					title={`Order #${data.orderNumber}`}
					action={
						<Badge
							className="py-0.5 capitalize"
							intent={
								data.status === "processing"
									? "secondary"
									: data.status === "shipped"
										? "info"
										: "success"
							}
						>
							{data.status === "processing" && <IconPackageProcess />}
							{data.status === "shipped" && <IconPackageMoving />}
							{data.status === "delivered" && <IconPackageDelivered />}
							{data.status.toLowerCase()}
						</Badge>
					}
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0",
					}}
				></MetricCard>
			</div>
			<MetricCard
				title="Ordered Items"
				description="List of items in this order"
				classNames={{
					header: "block md:grid",
					action: "block mt-4 md:mt-0",
					content: "p-0 overflow-y-hidden has-[table]:border-t-0",
				}}
				action={
					<SearchField
						value={q}
						onChange={(value) => setQ(value)}
						inputClassName="pr-8!"
					/>
				}
			>
				<Table aria-label="Ordered items">
					<Table.Header>
						<Table.Column isRowHeader className="pr-3">
							Item
						</Table.Column>
						<Table.Column>Quantity</Table.Column>
						<Table.Column>Price</Table.Column>
						<Table.Column>Total</Table.Column>
					</Table.Header>
					<Table.Body items={data.items} dependencies={[imageLoaded]}>
						{(item) => (
							<Table.Row id={item.id}>
								<Table.Cell>
									<div className="flex items-center gap-2">
										<MetricCard
											classNames={{
												card: "size-12 flex",
												content:
													"p-0 overflow-hidden flex-1 flex isolate relative",
											}}
										>
											{!imageLoaded[item.id] && (
												<Blurhash
													className="absolute inset-0"
													hash={item.images?.[0].blurhash}
													height={100}
													width={100}
												/>
											)}
											<img
												src={item.images[0].url}
												alt={item.name}
												className="size-full object-cover object-center"
												loading="lazy"
												onLoad={async () => {
													console.log("Here Before");
													await wait(3000);
													console.log("Here After");
													setImageLoaded((prev) => ({
														...prev,
														[item.id]: true,
													}));
												}}
												onError={() =>
													setImageLoaded((prev) => ({
														...prev,
														[item.id]: false,
													}))
												}
											/>
										</MetricCard>
										{item.name}
									</div>
								</Table.Cell>
								<Table.Cell>{item.quantity}</Table.Cell>
								<Table.Cell>{formatMoney(item.pricePerItem)}</Table.Cell>
								<Table.Cell>{formatMoney(item.totalPrice)}</Table.Cell>
							</Table.Row>
						)}
					</Table.Body>
				</Table>
			</MetricCard>
		</div>
	);
}
