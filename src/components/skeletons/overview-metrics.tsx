import { MetricCard } from "@components/admin/metric-card";
import { Skeleton } from "@ui/skeleton";

export const OverviewMetricsSkeleton = () => {
	return (
		<div
			className={`grid gap-4 grid-cols-1 md:grid-cols-3 pointer-events-none`}
		>
			<MetricCard
				title="Total Revenue"
				description="Total revenue from all sales in the last 30 days."
			>
				<div className="text-2xl font-semibold">
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="text-sm text-muted-fg mt-1">
					<Skeleton className="h-4 w-32" />
				</div>
			</MetricCard>

			<MetricCard
				title="Total Products"
				description="Total number of products in the store."
			>
				<div className="text-2xl font-semibold">
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="text-sm text-muted-fg mt-1">
					<Skeleton className="h-4 w-32" />
				</div>
			</MetricCard>

			<MetricCard
				title="Total Orders"
				description="Total number of orders in the last 30 days."
			>
				<div className="text-2xl font-semibold">
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="text-sm text-muted-fg mt-1">
					<Skeleton className="h-4 w-32" />
				</div>
			</MetricCard>
		</div>
	);
};
