import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { Button } from "@ui/button";
import { Label } from "@ui/field";
import { Heading } from "@ui/heading";
import { Loader } from "@ui/loader";
import { Select } from "@ui/select";
import { Skeleton } from "@ui/skeleton";
import { Table } from "@ui/table";

const AdminOrdersSkeleton = () => {
	return (
		<div>
			<div className="mb-6">
				<Heading className="sm:text-xl mb-6">
					<Skeleton className="h-8 w-20" />
				</Heading>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }, (_, i) => (
					<MetricCard
						key={i}
						title=""
						classNames={{
							header: "p-2 block flex items-center justify-between",
							title:
								"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
							action: "w-fit",
							content: "mt-0 h-full",
						}}
					>
						<Skeleton className="h-8 w-16" />
					</MetricCard>
				))}
			</div>

			<div className="mt-8">
				<MetricCard
					title=""
					description=""
					classNames={{
						content: "p-0 overflow-y-hidden has-[table]:border-t-0",
						action: "block",
					}}
					action={
						<div className="flex items-center gap-2">
							<Loader />
							<Select
								placeholder="Select Filter"
								selectedKey="all"
								className="w-fit"
							>
								<Select.Trigger />
								<Select.List
									popover={{ placement: "bottom right", className: "min-w-40" }}
								>
									<Select.Option id={"all"}>
										<Select.Label>All Orders</Select.Label>
									</Select.Option>
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
						</div>
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
						<Table.Body items={Array.from({ length: 10 }, () => ({}))}>
							{() => (
								<Table.Row>
									<Table.Cell>
										<Skeleton className="h-4 w-16" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-20" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-16" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-6 w-20 rounded-full" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-24" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-12" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-20" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-20" />
									</Table.Cell>
									<Table.Cell>
										<span className="font-medium cursor-pointer text-primary-subtle-fg hover:underline">
											<Skeleton className="h-4 w-20" />
										</span>
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table>
				</MetricCard>
				{/* Pagination Controls */}
				<div className="flex items-center justify-between mt-4 mb-8 gap-2">
					<div className="text-sm text-muted-foreground text-muted-fg">
						<Skeleton className="h-4 w-48" />
					</div>
					<div className="md:flex items-center gap-2 hidden">
						<Label className="text-sm">Rows per page</Label>
						<Select className="w-fit" selectedKey={10}>
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
						<Button intent="outline" size="sm" isDisabled>
							Previous
						</Button>
						<Button intent="outline" size="sm" isDisabled>
							Next
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export { AdminOrdersSkeleton };
