import { MetricCard } from "@components/admin/metric-card";
import { NewDiscountModal } from "@components/admin/new-discount-modal";
import PlusSignSquareIcon from "@components/icons/plus-size-square-icon";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { Heading } from "@ui/heading";
import { Table } from "@ui/table";
import { format } from "date-fns";
import z from "zod/v4";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getDiscountsQueryOptions } from "@/lib/query-options";

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
	new: z.boolean().default(false).catch(false),
});

export const Route = createFileRoute("/admin/discounts")({
	validateSearch: searchParamSchema,
	loaderDeps: ({ search }) => ({ ...search }),
	loader: ({ context, deps }) => {
		context.queryClient.ensureQueryData(
			getDiscountsQueryOptions({
				page: deps.page,
				limit: deps.limit,
			}),
		);
		return {
			title: "Discounts",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data } = useSuspenseQueryDeferred(getDiscountsQueryOptions(search));
	return (
		<div>
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<Heading className="sm:text-xl">Discounts</Heading>
					<Button
						onPress={() =>
							navigate({ search: (prev) => ({ ...prev, new: true }) })
						}
					>
						<PlusSignSquareIcon />
						Create Discount
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<MetricCard
					title="Total Discounts"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.counts.total}</p>
				</MetricCard>
				<MetricCard
					title="Active Discounts"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.counts.active}</p>
				</MetricCard>
				<MetricCard
					title="Scheduled Discounts"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.counts.notStarted}</p>
				</MetricCard>
				<MetricCard
					title="Expired Discounts"
					classNames={{
						header: "p-2 block flex items-center justify-between",
						title:
							"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
						action: "w-fit",
						content: "mt-0 h-full",
					}}
				>
					<p className="text-2xl font-semibold">{data.counts.expired}</p>
				</MetricCard>
			</div>
			<div className="mt-8">
				<MetricCard
					title="All Discounts"
					description="Overview and analytics of all discounts"
					classNames={{
						content: "p-0 overflow-y-hidden has-[table]:border-t-0",
						action: "block",
					}}
				>
					<Table>
						<Table.Header>
							<Table.Column>Name</Table.Column>
							<Table.Column isRowHeader>Code</Table.Column>
							<Table.Column>Value</Table.Column>
							<Table.Column>Description</Table.Column>
							<Table.Column>Minimum Order Amount</Table.Column>
							<Table.Column>Maximum Discount Amount</Table.Column>
							<Table.Column>Usage Limit</Table.Column>
							<Table.Column>Usage Count</Table.Column>
							<Table.Column>Starts At</Table.Column>
							<Table.Column>Expires At</Table.Column>
						</Table.Header>
						<Table.Body
							dependencies={[Math.random()]}
							items={data.items}
							renderEmptyState={() => (
								<div className="p-6 text-center">
									<h3 className="text-lg font-medium tracking-tight">
										No discounts yet
									</h3>
									<p className="mt-1 text-sm text-muted-fg text-balance max-w-[50ch] mx-auto">
										Create discounts to offer promotions to your customers.
										Click “Create Discount” to get started.
									</p>
								</div>
							)}
						>
							{(item) => (
								<Table.Row key={item.id}>
									<Table.Cell>{item.name}</Table.Cell>
									<Table.Cell>{item.code}</Table.Cell>
									<Table.Cell>{item.value}</Table.Cell>
									<Table.Cell>{item.description}</Table.Cell>
									<Table.Cell>
										{item.minimumOrderAmount
											? item.minimumOrderAmount
											: "No minimum"}
									</Table.Cell>
									<Table.Cell>
										{item.maximumDiscountAmount
											? item.maximumDiscountAmount
											: "No maximum"}
									</Table.Cell>
									<Table.Cell>
										{item.usageLimit ? item.usageLimit : "No limit"}
									</Table.Cell>
									<Table.Cell>
										{item.usageCount ? item.usageCount : "No usage"}
									</Table.Cell>
									<Table.Cell>{format(item.startsAt, "PPP")}</Table.Cell>
									<Table.Cell>
										{item.expiresAt
											? format(item.expiresAt, "PPP")
											: "Does not expire"}
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table>
				</MetricCard>
			</div>
			<NewDiscountModal />
		</div>
	);
}
