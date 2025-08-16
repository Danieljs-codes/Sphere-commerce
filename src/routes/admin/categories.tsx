import { MetricCard } from "@components/admin/metric-card";
import { NewCategoryModal } from "@components/admin/new-category-modal";
import { IconEdit } from "@components/icons/edit";
import PlusSignSquareIcon from "@components/icons/plus-size-square-icon";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { Label } from "@ui/field";
import { Heading } from "@ui/heading";
import { Select } from "@ui/select";
import { Table } from "@ui/table";
import { format } from "date-fns";
import z from "zod/v4";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getExistingCategoriesWithPaginationQueryOptions } from "@/lib/query-options";

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
	new: z.boolean().optional().default(false).catch(false),
});

export const Route = createFileRoute("/admin/categories")({
	validateSearch: searchParamSchema,
	loaderDeps: ({ search }) => ({ ...search }),
	loader: async ({ context, deps }) => {
		context.queryClient.ensureQueryData(
			getExistingCategoriesWithPaginationQueryOptions(deps),
		);
		return {
			title: "Categories",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data } = useSuspenseQueryDeferred(
		getExistingCategoriesWithPaginationQueryOptions(search),
	);
	return (
		<div>
			<div className="mb-8 flex items-center justify-between">
				<Heading className="sm:text-xl mb-6">Categories</Heading>
				<Button
					size="sm"
					onPress={() =>
						navigate({ search: (prev) => ({ ...prev, new: true }) })
					}
				>
					<PlusSignSquareIcon data-slot="icon" />
					New Category
				</Button>
			</div>
			<MetricCard
				title="Total Categories"
				description="All categories in your store"
				classNames={{
					content: "p-0 overflow-y-hidden has-[table]:border-t-0",
					action: "block",
				}}
			>
				<Table>
					<Table.Header>
						<Table.Column>#</Table.Column>
						<Table.Column isRowHeader>Name</Table.Column>
						<Table.Column>Description</Table.Column>
						<Table.Column>Image</Table.Column>
						<Table.Column>Created at</Table.Column>
						<Table.Column>Actions</Table.Column>
					</Table.Header>
					<Table.Body items={data.items}>
						{(item) => (
							<Table.Row>
								<Table.Cell>{item.id.slice(0, 8)}</Table.Cell>
								<Table.Cell className="font-medium">{item.name}</Table.Cell>
								<Table.Cell className="max-w-[50ch] whitespace-normal text-pretty">
									{item.description}
								</Table.Cell>
								<Table.Cell>
									{item.image ? (
										<MetricCard
											classNames={{
												card: "size-12 flex",
												content:
													"p-0 overflow-hidden flex-1 flex isolate relative",
											}}
										>
											<img
												src={item.image}
												alt={item.name}
												className="size-full object-cover object-center"
											/>
										</MetricCard>
									) : (
										"No image"
									)}
								</Table.Cell>
								<Table.Cell>
									{format(item.createdAt, "do MMM, yyyy, h:mm a")}
								</Table.Cell>
								<Table.Cell>
									<Button size="xs" intent="secondary">
										<IconEdit />
										Edit
									</Button>
								</Table.Cell>
							</Table.Row>
						)}
					</Table.Body>
				</Table>
			</MetricCard>
			{/* Pagination Controls */}
			<div className="flex items-center justify-between mt-4 mb-8 gap-2">
				<div className="text-sm text-muted-foreground text-muted-fg">
					Page {search.page} of {data.pageCount} ·{" "}
					<span className="text-fg font-medium">{data.total} Categories</span>
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
								<Select.Option key={item.id} textValue={item.value.toString()}>
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
						isDisabled={search.page <= 1}
						onPress={() => {
							if (search.page > 1) {
								navigate({
									search: (prev) => ({
										...prev,
										page: search.page - 1,
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
						isDisabled={search.page >= data.pageCount}
						onPress={() => {
							if (search.page < data.pageCount) {
								navigate({
									search: (prev) => ({
										...prev,
										page: search.page + 1,
									}),
								});
							}
						}}
					>
						Next
					</Button>
				</div>
			</div>
			<NewCategoryModal />
		</div>
	);
}
