import { ArchiveProductModal } from "@components/admin/archive-product-modal";
import { MetricCard } from "@components/admin/metric-card";
import { IconArchive } from "@components/icons/archive";
import PlusSignSquareIcon from "@components/icons/plus-size-square-icon";
import { IconRestore } from "@components/icons/restore";
import { ProductsSkeleton } from "@components/skeletons/products";
import {
	IconChevronLeft,
	IconChevronRight,
	IconClipboardFill,
	IconDotsVertical,
} from "@intentui/icons";
import type { Product } from "@server/db/schema";
import { $restoreProduct } from "@server/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Button, buttonStyles } from "@ui/button";
import { Heading } from "@ui/heading";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { Menu } from "@ui/menu";
import { Table } from "@ui/table";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
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
	numItems: z
		.union([
			z.literal(10),
			z.literal(20),
			z.literal(30),
			z.literal(40),
			z.literal(50),
		])
		.default(10)
		.catch(10),
});

export const Route = createFileRoute("/admin/products/")({
	pendingComponent: ProductsSkeleton,
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
	const queryClient = useQueryClient();
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data } = useSuspenseQueryDeferred(getProductStatsQueryOptions());
	const { data: productsData, isSuspending } = useSuspenseQueryDeferred(
		getProductPageQueryOptions({
			offset: search.page * search.numItems - search.numItems,
			numItems: search.numItems,
			filter: search.filter,
		}),
	);

	const { mutateAsync: restoreProduct, isPending: isRestoring } = useMutation({
		mutationFn: async (productId: string) => {
			return $restoreProduct({
				data: { productId },
			});
		},
		throwOnError: true,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: getProductStatsQueryOptions().queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: getProductPageQueryOptions({
						numItems: search.numItems,
						offset: search.page * search.numItems - search.numItems,
						filter: search.filter,
					}).queryKey,
				}),
			]);
		},
	});

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
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.totalProducts}</p>
				</MetricCard>
				<MetricCard
					title="Active Product (Available for Sale)"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.activeProducts}</p>
				</MetricCard>
				<MetricCard
					title="Inactive Product (Draft/Archived)"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.inactiveProducts}</p>
				</MetricCard>
				<MetricCard
					title="Scheduled Product"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
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
										<div className="flex items-center gap-2">
											<MetricCard
												classNames={{
													card: "size-12 flex",
													content:
														"p-0 overflow-hidden flex-1 flex isolate relative",
												}}
											>
												<img
													src={item.images[0].url}
													alt={item.name}
													className="size-full object-cover object-center"
												/>
											</MetricCard>
											{item.name}
										</div>
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
												{item.status === "archived" && (
													<Menu.Item
														isDisabled={isRestoring}
														onAction={() =>
															toast.promise(restoreProduct(item.id), {
																loading: "Restoring product...",
																success: "Product restored successfully",
																error: "Failed to restore product",
															})
														}
													>
														{isRestoring ? <Loader /> : <IconRestore />}
														<Menu.Label>Restore Product</Menu.Label>
													</Menu.Item>
												)}
												{item.status === "active" && (
													<Menu.Item
														isDanger
														onAction={() => setSelectedProduct(item)}
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
							{/* Compute and show current item range and page info */}
							{(() => {
								const perPage = search.numItems ?? 10;
								const currentPage = search.page ?? 1;
								const total = data.totalProducts ?? 0;
								const totalPages = Math.max(1, Math.ceil(total / perPage));
								const startIndex = (currentPage - 1) * perPage + 1;
								const endIndex = Math.min(
									startIndex + productsData.page.length - 1,
									total,
								);

								return (
									<div className="flex items-center gap-2">
										Showing {startIndex} to {endIndex} of {total} products —
										Page {currentPage} of {totalPages}
										{isSuspending && <Loader className="size-4" />}
									</div>
								);
							})()}
						</div>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								intent="secondary"
								onPress={() => {
									navigate({
										search: (old) => ({
											...old,
											page: Math.max(1, search.page - 1),
										}),
									});
								}}
								isDisabled={search.page <= 1}
							>
								<IconChevronLeft />
								Previous
							</Button>
							<Button
								size="sm"
								intent="secondary"
								onPress={() => {
									navigate({
										search: (old) => ({
											...old,
											page: search.page + 1,
										}),
									});
								}}
								isDisabled={!productsData.hasNextPage}
							>
								Next
								<IconChevronRight />
							</Button>
						</div>
					</div>
				)}
			</div>
			<ArchiveProductModal
				product={selectedProduct}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setSelectedProduct(null);
					}
				}}
			/>
		</div>
	);
}
