import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { IconDotsVertical } from "@intentui/icons";
import { $markAsDelivered, $markAsShipped } from "@server/orders";
import { IconCircleChevronLeftFilled } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Button, buttonStyles } from "@ui/button";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { Menu } from "@ui/menu";
import { SearchField } from "@ui/search-field";
import { Table } from "@ui/table";
import { useMemo, useState } from "react";
import { Blurhash } from "react-blurhash";
import { toast } from "sonner";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import {
	getOrderQueryOptions,
	getOrdersQueryOptions,
} from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";

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
	const queryClient = useQueryClient();
	const [q, setQ] = useState("");
	const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
	const params = Route.useParams();
	const { data } = useSuspenseQueryDeferred(getOrderQueryOptions(params.id));

	const filteredItems = useMemo(() => {
		const term = q.trim().toLowerCase();
		if (!term || term.length === 0) return data.items;
		return data.items.filter((it) => {
			const name = it.name?.toLowerCase() ?? "";
			const productName = it.productName?.toLowerCase() ?? "";
			const productId = it.productId?.toLowerCase() ?? "";
			return (
				name.includes(term) ||
				productName.includes(term) ||
				productId.includes(term)
			);
		});
	}, [data.items, q]);

	const { mutateAsync: markAsShipped, isPending: isMarkingAsShipped } =
		useMutation({
			mutationFn: (id: string) => $markAsShipped({ data: { id } }),
			mutationKey: ["markAsShipped", params.id],
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: getOrderQueryOptions(params.id).queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: getOrdersQueryOptions({ page: 1, limit: 10 }).queryKey,
					}),
				]);
			},
			throwOnError: true,
		});

	const { mutateAsync: markAsDelivered, isPending: isMarkingAsDelivered } =
		useMutation({
			mutationFn: async (id: string) => {
				return await $markAsDelivered({ data: { id } });
			},
			mutationKey: ["markAsDelivered", params.id],
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: getOrderQueryOptions(params.id).queryKey,
					}),
					queryClient.invalidateQueries({
						queryKey: getOrdersQueryOptions({ page: 1, limit: 10 }).queryKey,
					}),
				]);
			},
			throwOnError: true,
		});

	return (
		<div>
			<div className="mb-8 flex items-center justify-between">
				<Link
					to="/admin/orders"
					className={buttonStyles({ intent: "outline" })}
				>
					<IconCircleChevronLeftFilled data-slot="icon" />
					Back to Orders
				</Link>
				{data.status !== "delivered" && (
					<Menu>
						<Button size="sq-sm" intent="outline">
							<IconDotsVertical />
						</Button>
						<Menu.Content
							popover={{ placement: "bottom right" }}
							dependencies={[isMarkingAsDelivered, isMarkingAsShipped]}
						>
							{data.status === "processing" && (
								<>
									<Menu.Item
										isDisabled={isMarkingAsShipped}
										onAction={() => {
											toast.promise(markAsShipped(params.id), {
												loading: "Marking as shipped...",
												success: "Order marked as shipped successfully",
												error: "Failed to mark order as shipped",
											});
										}}
									>
										{isMarkingAsShipped ? <Loader /> : <IconPackageMoving />}
										<Menu.Label>Ship Order</Menu.Label>
									</Menu.Item>
									<Menu.Item
										isDisabled={isMarkingAsDelivered}
										onAction={() => {
											toast.promise(markAsDelivered(params.id), {
												loading: "Marking as delivered...",
												success: "Order marked as delivered successfully",
												error: "Failed to mark order as delivered",
											});
										}}
									>
										{isMarkingAsDelivered ? (
											<Loader />
										) : (
											<IconPackageDelivered />
										)}
										<Menu.Label>Deliver Order</Menu.Label>
									</Menu.Item>
								</>
							)}
							{data.status === "shipped" && (
								<Menu.Item
									isDisabled={isMarkingAsDelivered}
									onAction={() => {
										toast.promise(markAsDelivered(params.id), {
											loading: "Marking as delivered...",
											success: "Order marked as delivered successfully",
											error: "Failed to mark order as delivered",
										});
									}}
								>
									{isMarkingAsDelivered ? <Loader /> : <IconPackageDelivered />}
									<Menu.Label>Deliver Order</Menu.Label>
								</Menu.Item>
							)}
						</Menu.Content>
					</Menu>
				)}
				{data.status === "delivered" && (
					<Badge intent="success" className="capitalize">
						{data.status === "delivered" && <IconPackageDelivered />}
						{data.status.toLowerCase()}
					</Badge>
				)}
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
					<Table.Body items={filteredItems} dependencies={[imageLoaded, q]}>
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
												onLoad={() => {
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
								<Table.Cell className="tabular-nums font-mono font-medium text-fg">
									{formatMoney(item.pricePerItem)}
								</Table.Cell>

								<Table.Cell className="tabular-nums font-mono font-medium text-fg">
									{formatMoney(item.totalPrice)}
								</Table.Cell>
							</Table.Row>
						)}
					</Table.Body>
				</Table>
			</MetricCard>
		</div>
	);
}
