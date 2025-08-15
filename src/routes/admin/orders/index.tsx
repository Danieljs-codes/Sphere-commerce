import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Label } from "@ui/field";
import { Heading } from "@ui/heading";
import { Link } from "@ui/link";
import { Select } from "@ui/select";
import { Table } from "@ui/table";
import { format } from "date-fns";
import z from "zod/v4";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getOrdersQueryOptions } from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";

const searchParamSchema = z.object({
	page: z.number().min(1).default(1).catch(1),
	limit: z
		.union([
			z.literal(10),
			z.literal(20),
			z.literal(30),
			z.literal(40),
			z.literal(50),
		])
		.default(10)
		.catch(10),
	status: z
		.enum(["processing", "shipped", "delivered"])
		.optional()
		.catch(undefined),
});

export const Route = createFileRoute("/admin/orders/")({
	validateSearch: searchParamSchema,
	loaderDeps: ({ search }) => ({ ...search }),
	loader: ({ deps, context }) => {
		context.queryClient.ensureQueryData(getOrdersQueryOptions(deps));
		return {
			title: "Orders",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data } = useSuspenseQueryDeferred(getOrdersQueryOptions(search));

	return (
		<div>
			<div className="mb-6">
				<Heading className="sm:text-xl mb-6">Orders</Heading>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					title="Total Orders"
					description="Total number of orders placed"
				>
					<p className="text-2xl font-semibold">{data.counts.totalOrders}</p>
				</MetricCard>
				<MetricCard
					title="Processing Orders"
					description="Orders currently being processed"
				>
					<p className="text-2xl font-semibold">
						{data.counts.processingOrders}
					</p>
				</MetricCard>
				<MetricCard
					title="Shipped Orders"
					description="Orders that have been shipped"
				>
					<p className="text-2xl font-semibold">{data.counts.shippedOrders}</p>
				</MetricCard>
				<MetricCard
					title="Delivered Orders"
					description="Orders that have been delivered"
				>
					<p className="text-2xl font-semibold">
						{data.counts.deliveredOrders}
					</p>
				</MetricCard>
			</div>

			<div className="mt-8">
				<MetricCard
					title="Order Insights"
					description="Overview and analytics of recent order activity"
					classNames={{
						content: "p-0 overflow-y-hidden has-[table]:border-t-0",
						action: "block",
					}}
					action={
						<Select
							placeholder="Select Filter"
							selectedKey={search.status}
							onSelectionChange={(key) => {
								navigate({
									search: (prev) => ({
										...prev,
										status: key as "processing" | "shipped" | "delivered",
									}),
								});
							}}
						>
							<Select.Trigger />
							<Select.List
								popover={{ placement: "bottom right", className: "min-w-40" }}
							>
								<Select.Option id={"processing"}>
									<IconPackageProcess />
									<Select.Label>Processing</Select.Label>
								</Select.Option>
								<Select.Option id={"shipped"}>
									<IconPackageMoving />
									<Select.Label>Shipped</Select.Label>
								</Select.Option>
								<Select.Option id={"delivered"}>
									<IconPackageDelivered />
									<Select.Label>Delivered</Select.Label>
								</Select.Option>
							</Select.List>
						</Select>
					}
				>
					<Table>
						<Table.Header>
							<Table.Column isRowHeader>Order #</Table.Column>
							<Table.Column>Customer</Table.Column>
							<Table.Column>Total</Table.Column>
							<Table.Column>Status</Table.Column>
							<Table.Column>Date Placed</Table.Column>
							<Table.Column>Products Ordered</Table.Column>
							<Table.Column>Shipped</Table.Column>
							<Table.Column>Delivered</Table.Column>
							<Table.Column>Actions</Table.Column>
						</Table.Header>
						<Table.Body>
							{data.orders?.map((order) => (
								<Table.Row key={order.id}>
									<Table.Cell>{order.orderNumber}</Table.Cell>
									<Table.Cell className="capitalize">
										{order.userName.toLowerCase()}
									</Table.Cell>
									<Table.Cell className="tabular-nums font-mono font-medium">
										{formatMoney(order.total)}
									</Table.Cell>
									<Table.Cell>
										<Badge
											className="capitalize"
											intent={
												order.status === "delivered"
													? "success"
													: order.status === "shipped"
														? "info"
														: "secondary"
											}
										>
											{order.status === "processing" && <IconPackageProcess />}
											{order.status === "shipped" && <IconPackageMoving />}
											{order.status === "delivered" && <IconPackageDelivered />}
											{order.status.toLowerCase()}
										</Badge>
									</Table.Cell>
									<Table.Cell>
										{format(new Date(order.createdAt), "do MMM, yyyy, h:mm a")}
									</Table.Cell>
									<Table.Cell>{`${order.itemCount} ${order.itemCount === 1 ? "item" : "items"}`}</Table.Cell>
									<Table.Cell>
										{order.shippedAt
											? format(
													new Date(order.shippedAt),
													"do MMM, yyyy, h:mm a",
												)
											: "Not Shipped"}
									</Table.Cell>
									<Table.Cell>
										{order.deliveredAt
											? format(
													new Date(order.deliveredAt),
													"do MMM, yyyy, h:mm a",
												)
											: "Not Delivered"}
									</Table.Cell>
									<Table.Cell>
										<Link
											to="/admin/orders/$id"
											params={{ id: order.id }}
											className="font-medium cursor-pointer text-primary-subtle-fg hover:underline"
										>
											View Details
										</Link>
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table>
				</MetricCard>
				{/* Pagination Controls */}
				<div className="flex items-center justify-between mt-4 mb-8 gap-2">
					<div className="text-sm text-muted-foreground text-muted-fg">
						Page {data.pagination.currentPage} of {data.pagination.totalPages} ·{" "}
						<span className="text-fg font-medium">
							{data.pagination.totalItems} orders
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Label className="text-sm">Rows per page</Label>
						<Select
							className="w-fit"
							selectedKey={search.limit}
							onSelectionChange={(key) => {
								navigate({
									search: (prev) => ({
										...prev,
										limit: key as 10 | 20 | 30 | 40 | 50,
									}),
								});
							}}
						>
							<Select.Trigger className="w-20" />
							<Select.List
								items={[10, 20, 30, 40, 50].map((num) => ({
									id: num,
									value: num,
								}))}
								popover={{ className: "min-w-(--trigger-width)" }}
							>
								{(item) => (
									<Select.Option
										key={item.id}
										textValue={item.value.toString()}
									>
										{item.value}
									</Select.Option>
								)}
							</Select.List>
						</Select>
					</div>
					<div className="flex gap-2">
						<Button
							intent="outline"
							size="sm"
							isDisabled={!data.pagination.hasPreviousPage}
							onPress={() => {
								if (data.pagination.hasPreviousPage) {
									navigate({
										search: (prev) => ({
											...prev,
											page: data.pagination.currentPage - 1,
										}),
									});
								}
							}}
						>
							Previous
						</Button>
						<Button
							intent="outline"
							size="sm"
							isDisabled={!data.pagination.hasNextPage}
							onPress={() => {
								if (data.pagination.hasNextPage) {
									navigate({
										search: (prev) => ({
											...prev,
											page: data.pagination.currentPage + 1,
										}),
									});
								}
							}}
						>
							Next
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
