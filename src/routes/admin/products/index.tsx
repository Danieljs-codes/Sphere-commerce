import { MetricCard } from "@components/admin/metric-card";
import { IconArchive } from "@components/icons/archive";
import PlusSignSquareIcon from "@components/icons/plus-size-square-icon";
import {
	IconChevronLeft,
	IconChevronRight,
	IconClipboardFill,
	IconDotsVertical,
} from "@intentui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Button, buttonStyles } from "@ui/button";
import { Heading } from "@ui/heading";
import { Link } from "@ui/link";
import { Menu } from "@ui/menu";
import { Table } from "@ui/table";
import { format } from "date-fns";
import z from "zod/v4";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import {
	getProductPageQueryOptions,
	getProductStatsQueryOptions,
} from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";

const searchParamSchema = z.object({
	filter: z
		.union([z.literal("active"), z.literal("draft"), z.literal("scheduled")])
		.optional()
		.catch(undefined),
	page: z.number().int().positive().default(1).catch(1),
	numItems: z.number().int().positive().default(10).catch(10),
});

export const Route = createFileRoute("/admin/products/")({
	validateSearch: searchParamSchema,
	loaderDeps: ({ search }) => ({
		filter: search.filter,
		page: search.page,
		numItems: search.numItems,
	}),
	loader: async ({ context, deps }) => {
		context.queryClient.ensureQueryData(getProductStatsQueryOptions());
		context.queryClient.ensureQueryData(
			getProductPageQueryOptions({
				offset: deps.page * deps.numItems - deps.numItems,
				numItems: deps.numItems,
				filter: deps.filter,
			}),
		);
		return {
			title: "Products",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const { data } = useSuspenseQueryDeferred(getProductStatsQueryOptions());
	const { data: productsData } = useSuspenseQueryDeferred(
		getProductPageQueryOptions({
			offset: search.page * search.numItems - search.numItems,
			numItems: search.numItems,
			filter: search.filter,
		}),
	);

	console.log(data);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<Heading className="sm:text-xl">Products</Heading>
				<Link to="/admin/products/new" className={buttonStyles()}>
					<PlusSignSquareIcon data-slot="icon" />
					New
				</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					title="Total Product"
					description="All products in your store"
				>
					<p className="text-2xl font-semibold">{data.totalProducts}</p>
				</MetricCard>
				<MetricCard
					title="Active Product"
					description="Products currently available for sale"
				>
					<p className="text-2xl font-semibold">{data.activeProducts}</p>
				</MetricCard>
				<MetricCard
					title="Inactive Product"
					description="Products not visible to customers"
				>
					<p className="text-2xl font-semibold">{data.inactiveProducts}</p>
				</MetricCard>
				<MetricCard
					title="Scheduled Product"
					description="Products scheduled to be published"
				>
					<p className="text-2xl font-semibold">{data.scheduledProducts}</p>
				</MetricCard>
			</div>
			<div className="mt-8">
				<MetricCard
					title="Product Inventory"
					description="A complete list of all products in your store, including pricing, stock, and status."
					classNames={{
						content: "p-0 overflow-y-hidden has-[table]:border-t-0",
					}}
				>
					<Table aria-label="Products">
						<Table.Header>
							<Table.Column>#</Table.Column>
							<Table.Column isRowHeader>Name</Table.Column>
							<Table.Column>Price</Table.Column>
							<Table.Column>Stock</Table.Column>
							<Table.Column>Status</Table.Column>
							<Table.Column>Created at</Table.Column>
							<Table.Column>Publish Date</Table.Column>
							<Table.Column />
						</Table.Header>
						<Table.Body items={productsData.page}>
							{(item) => (
								<Table.Row id={String(item.id)}>
									<Table.Cell className="text-muted-fg">
										<div className="flex items-center gap-1">
											{String(item.id).slice(-4)}...
											<button
												onClick={() => {
													navigator.clipboard.writeText(String(item.id));
												}}
												title="Copy Product ID"
												className="p-1 rounded hover:bg-accent transition-colors"
												type="button"
											>
												<IconClipboardFill />
											</button>
										</div>
									</Table.Cell>
									<Table.Cell className="whitespace-nowrap">
										{item.name}
									</Table.Cell>
									<Table.Cell className="font-mono tabular-nums font-medium">
										{formatMoney(item.price)}
									</Table.Cell>
									<Table.Cell>{item.stock}</Table.Cell>
									<Table.Cell className="capitalize">
										<Badge
											intent={
												item.status === "active"
													? "success"
													: item.status === "scheduled"
														? "info"
														: item.status === "draft"
															? "secondary"
															: item.status === "archived"
																? "danger"
																: "outline"
											}
										>
											{item.status}
										</Badge>
									</Table.Cell>
									<Table.Cell>
										{format(new Date(item.createdAt), "do MMM, yyyy")}
									</Table.Cell>
									<Table.Cell>
										{item.status === "scheduled" && item.publishedAt
											? format(new Date(item.publishedAt), "do MMM, yyyy")
											: "Published"}
									</Table.Cell>
									<Table.Cell>
										<Menu>
											<Button size="sq-xs" intent="outline">
												<IconDotsVertical />
											</Button>
											<Menu.Content
												popover={{
													placement: "bottom right",
													className: "min-w-45",
												}}
											>
												{/* <Menu.Item onAction={() => setSelectedProduct(item)}>
                          <IconEdit />
                          <Menu.Label>Edit Product</Menu.Label>
                        </Menu.Item>
                        <Menu.Separator /> */}

												{item.status === "archived" && (
													<Menu.Item
													// isDisabled={isArchiving}
													// onAction={() =>
													// 	archiveProduct({ productId: item._id })
													// }
													>
														{/* {isArchiving ? <Loader /> : <IconRestore />} */}
														<Menu.Label>Restore Product</Menu.Label>
													</Menu.Item>
												)}
												{item.status === "active" && (
													<Menu.Item
														isDanger
														// onAction={() => setSelectedProduct(item)}
													>
														<IconArchive />
														<Menu.Label>Archive Product</Menu.Label>
													</Menu.Item>
												)}
											</Menu.Content>
										</Menu>
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table>
				</MetricCard>
				{data.totalProducts > 0 && (
					<div className="flex items-center justify-between py-4">
						<div className="text-sm text-muted-fg">
							Showing {productsData.page.length} of {data.totalProducts}{" "}
							products
						</div>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								intent="secondary"
								onPress={() => {}}
								isDisabled={search.page <= 1}
							>
								<IconChevronLeft />
								Previous
							</Button>
							<Button
								size="sm"
								intent="secondary"
								onPress={() => {}}
								isDisabled={!productsData.hasNextPage}
							>
								Next
								<IconChevronRight />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
