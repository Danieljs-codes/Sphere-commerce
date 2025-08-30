import { MetricCard } from "@components/admin/metric-card";
import PlusSignSquareIcon from "@components/icons/plus-size-square-icon";
import {
	IconChevronLeft,
	IconChevronRight,
	IconDotsVertical,
} from "@intentui/icons";
import { Button, buttonStyles } from "@ui/button";
import { Heading } from "@ui/heading";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { Menu } from "@ui/menu";
import { Skeleton } from "@ui/skeleton";
import { Table } from "@ui/table";

const ProductsSkeleton = () => {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<Heading className="sm:text-xl">
					<Skeleton className="h-8 w-24" />
				</Heading>
				<Link to="/admin/products/new" className={buttonStyles()}>
					<PlusSignSquareIcon data-slot="icon" />
					New
				</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
						<Table.Body
							items={Array.from({ length: 10 }, (_, i) => ({ id: i }))}
						>
							{(item) => (
								<Table.Row id={item.id}>
									<Table.Cell className="text-muted-fg">
										<div className="flex items-center gap-1">
											<Skeleton className="h-4 w-12" />
											<Skeleton className="size-6" />
										</div>
									</Table.Cell>
									<Table.Cell className="whitespace-nowrap">
										<div className="flex items-center gap-2">
											<Skeleton className="size-12 rounded" />
											<Skeleton className="h-4 w-32" />
										</div>
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-16" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-8" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-6 w-16 rounded-full" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-20" />
									</Table.Cell>
									<Table.Cell>
										<Skeleton className="h-4 w-20" />
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
												<Menu.Item>
													<Skeleton className="h-4 w-24" />
												</Menu.Item>
											</Menu.Content>
										</Menu>
									</Table.Cell>
								</Table.Row>
							)}
						</Table.Body>
					</Table>
				</MetricCard>
				<div className="flex items-center justify-between py-4">
					<div className="text-sm text-muted-fg">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-64" />
							<Loader className="size-4" />
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button size="sm" intent="secondary" isDisabled>
							<IconChevronLeft />
							Previous
						</Button>
						<Button size="sm" intent="secondary" isDisabled>
							Next
							<IconChevronRight />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export { ProductsSkeleton };
