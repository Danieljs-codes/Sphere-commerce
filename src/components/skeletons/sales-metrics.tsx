import { MetricCard } from "@components/admin/metric-card";
import { Skeleton } from "@ui/skeleton";

const array8 = new Array(8).fill(null);

export const SalesMetricSkeleton = () => {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<MetricCard
				title="Top Selling Products"
				description="The top selling products in your store."
				classNames={{
					content: "h-full",
				}}
			>
				<div className="flex flex-col gap-y-4">
					{array8.map((_, index) => (
						<div
							key={index}
							className="grid grid-cols-[auto_1fr_auto] items-center"
						>
							<Skeleton className="h-4 w-24 rounded" />
							<div className="mx-2 after:block after:h-[1.5px] after:grow after:bg-[repeating-linear-gradient(to_right,theme(--color-muted-fg/50%)_0,theme(--color-muted-fg/50%)_1.5px,_transparent_1.5px,_transparent_6px)] after:bg-repeat-x after:content-['']" />
							<Skeleton className="h-4 w-8 rounded" />
						</div>
					))}
				</div>
			</MetricCard>
			{/* end region Charts */}
			<MetricCard
				title="Recent Sales"
				description="Your store's sales revenue for the last 30 days."
				classNames={{
					card: "lg:col-span-2",
					content: "h-full p-0 overflow-hidden",
				}}
				action={
					<div className="flex items-center gap-x-2">
						<Skeleton className="h-8 w-20 rounded" />
					</div>
				}
			>
				<div className="px-1 pt-4 relative isolate">
					<Skeleton className="h-64 w-full rounded" />
				</div>
			</MetricCard>
		</div>
	);
};
