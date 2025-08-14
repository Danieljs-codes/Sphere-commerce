import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getOverviewStatsQueryOptions } from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";
import { MetricCard } from "./metric-card";

interface OverviewMetricsProps {
	className?: string;
}

const fmtDelta = (change?: {
	pct: number | null;
	delta: number;
	direction: "up" | "down" | "flat";
}) => {
	if (!change) return "—";
	const { pct, direction } = change;
	if (pct == null) return "No prior period";
	if (direction === "flat") return "No change from last month";
	const sign = pct >= 0 ? "+" : "";
	return `${sign}${pct.toFixed(1)}% from last month`;
};

export function OverviewMetrics({ className }: OverviewMetricsProps) {
	const { data } = useSuspenseQueryDeferred(getOverviewStatsQueryOptions());

	return (
		<div className={`grid gap-4 grid-cols-1 md:grid-cols-3 ${className ?? ""}`}>
			<MetricCard
				title="Total Revenue"
				description="Total revenue from all sales in the last 30 days."
			>
				<div className="text-2xl font-semibold">
					{formatMoney(data.revenue30d)}
				</div>
				<div className="text-sm text-muted-fg mt-1">
					{fmtDelta(data.revenueChange)}
				</div>
			</MetricCard>

			<MetricCard
				title="Total Products"
				description="Total number of products in the store."
			>
				<div className="text-2xl font-semibold">{data.productsCountTotal}</div>
				<div className="text-sm text-muted-fg mt-1">
					+{data.productsAdded30d} in last 30 days
				</div>
			</MetricCard>

			<MetricCard
				title="Total Orders"
				description="Total number of orders in the last 30 days."
			>
				<div className="text-2xl font-semibold">
					{data.ordersCount30d.toLocaleString()}
				</div>
				<div className="text-sm text-muted-fg mt-1">
					{fmtDelta(data.ordersChange)}
				</div>
			</MetricCard>
		</div>
	);
}
