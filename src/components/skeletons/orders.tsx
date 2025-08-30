import { MetricCard } from "@components/admin/metric-card";
import { SummaryItem } from "@components/summary-item";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { Card } from "@ui/card";
import { Heading } from "@ui/heading";
import { Loader } from "@ui/loader";
import { Skeleton } from "@ui/skeleton";
import { Table } from "@ui/table";

const OrdersSkeleton = () => {
	return (
		<div>
			<Card.Header className="mx-auto mb-6 text-center">
				<Heading>
					<Skeleton className="h-8 w-32 mx-auto" />
				</Heading>
				<Card.Description>
					<Skeleton className="h-4 w-80 mx-auto" />
				</Card.Description>
			</Card.Header>
			<div className="mx-auto max-w-2xl">
				{Array.from({ length: 5 }, (_, i) => (
					<div className="mb-4 last:mb-0" key={i}>
						<MetricCard
							title={<Skeleton className="h-4 w-24" />}
							classNames={{
								header: "p-2 block flex items-center justify-between",
								title:
									"pl-0 font-mono font-normal! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
								action: "w-fit block",
								content: "mt-0 h-full",
							}}
							action={
								<Badge className="capitalize" intent="secondary">
									<Skeleton className="h-4 w-16" />
								</Badge>
							}
						>
							<div className="flex flex-col gap-y-3 pb-(--card-spacing)">
								<SummaryItem
									label="Ordered at"
									value={<Skeleton className="h-4 w-32" />}
								/>
								<SummaryItem
									label="Subtotal"
									value={<Skeleton className="h-4 w-20" />}
								/>
								<SummaryItem
									label="Discount"
									value={<Skeleton className="h-4 w-20" />}
								/>
								<SummaryItem
									label="Total"
									value={<Skeleton className="h-4 w-20" />}
								/>
								<SummaryItem
									label="Shipping Address"
									value={<Skeleton className="h-4 w-48" />}
									classNames={{
										value: "truncate",
									}}
								/>
								<SummaryItem
									label="Shipped at"
									value={<Skeleton className="h-4 w-24" />}
								/>
								<SummaryItem
									label="Delivered at"
									value={<Skeleton className="h-4 w-24" />}
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
									items={Array.from({ length: 3 }, (_, i) => ({ id: i }))}
								>
									{(item) => (
										<Table.Row id={item.id}>
											<Table.Cell>
												<Skeleton className="h-4 w-32" />
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-4 w-8" />
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-4 w-16" />
											</Table.Cell>
											<Table.Cell>
												<Skeleton className="h-4 w-16" />
											</Table.Cell>
										</Table.Row>
									)}
								</Table.Body>
							</Table>
						</MetricCard>
					</div>
				))}
			</div>
			<div className="flex justify-center mt-6">
				<Button intent="secondary" isDisabled>
					<Loader />
					Loading More Order History
				</Button>
			</div>
		</div>
	);
};

export { OrdersSkeleton };
