import { MetricCard } from "@components/admin/metric-card";
import { EmptyFile } from "@components/empty-file";
import {
	getLocalTimeZone,
	now,
	parseAbsoluteToLocal,
} from "@internationalized/date";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DateRangePicker } from "@ui/date-range-picker";
import { LineChart } from "@ui/line-chart";
import { Loader } from "@ui/loader";
import { format } from "date-fns";
import type React from "react";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getRecentSalesDataQueryOptions } from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";

export const SalesMetrics = () => {
	const navigate = useNavigate({
		from: "/admin/dashboard",
	});
	const search = useSearch({
		from: "/admin/dashboard",
	});
	const { data: salesData, isSuspending } = useSuspenseQueryDeferred(
		getRecentSalesDataQueryOptions({
			from: search.from,
			to: search.to,
		}),
	);

	console.log(salesData);

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
					{salesData.topProducts.length > 0 ? (
						salesData.topProducts.map((product) => (
							<div
								key={product.productId}
								className="grid grid-cols-[auto_1fr_auto] items-center"
							>
								<p className="text-muted-fg text-sm truncate capitalize">
									{product.name.toLowerCase()}
								</p>
								<div className="mx-2 after:block after:h-[1.5px] after:grow after:bg-[repeating-linear-gradient(to_right,theme(--color-muted-fg/50%)_0,theme(--color-muted-fg/50%)_1.5px,_transparent_1.5px,_transparent_6px)] after:bg-repeat-x after:content-['']" />
								<span className="text-sm font-mono tabular-nums">
									{product.totalSold}
								</span>
							</div>
						))
					) : (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<EmptyFile className="size-16" />
							<div className="text-muted-fg text-sm font-medium mt-3">
								No sales data available for the selected period
							</div>
							<div className="text-muted-fg/70 text-[0.8125rem] mt-1">
								Try selecting a different date range
							</div>
						</div>
					)}
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
						<DateRangePicker
							visibleDuration={{ months: 2 }}
							aria-label="Sales date range"
							className="font-mono"
							granularity="day"
							isDateUnavailable={(date) => {
								const today = now(getLocalTimeZone()).set({
									hour: 23,
									minute: 59,
									second: 59,
								});

								return date > today;
							}}
							value={{
								start: parseAbsoluteToLocal(search.from),
								end: parseAbsoluteToLocal(search.to),
							}}
							onChange={(val) => {
								if (!val) return;
								navigate({
									search: (prev) => ({
										...prev,
										from: val.start.toAbsoluteString(),
										to: val.end.toAbsoluteString(),
									}),
									replace: true,
								});
							}}
						/>
					</div>
				}
			>
				<div className="px-1 pt-4 relative isolate">
					{isSuspending && (
						<div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
							<Loader intent="primary" />
						</div>
					)}
					<LineChart
						className="h-56 min-h-[224px] sm:h-72 sm:min-h-[288px]"
						data={salesData.dailyEarnings.map((earnings) => {
							return {
								day: format(new Date(earnings.date), "MMM d"),
								earnings: earnings.total,
							};
						})}
						dataKey="day"
						xAxisProps={{
							interval: "preserveStartEnd",
						}}
						yAxisProps={{
							width: 80,
							tickFormatter: (value) => {
								const nairaValue = value / 100;
								if (nairaValue >= 1000000) {
									return `${(nairaValue / 1000000).toFixed(1)}M`;
								}
								if (nairaValue >= 1000) {
									return `${(nairaValue / 1000).toFixed(1)}K`;
								}
								return `₦${nairaValue.toLocaleString()}`;
							},
						}}
						config={{
							earnings: { label: "Earnings" },
						}}
						tooltipProps={{
							formatter: (value, label) => (
								<span className="flex w-full flex-wrap gap-2 *:data-[slot=icon]:size-2.5 *:data-[slot=icon]:text-muted-fg items-center">
									<div
										className="shrink-0 rounded-full border-(--color-border) bg-(--color-bg) size-2.5"
										style={
											{
												"--color-bg": "var(--chart-1)",
												"--color-border": "var(--chart-1)",
											} as React.CSSProperties
										}
									/>
									<div className="flex flex-1 justify-between leading-none items-center">
										<span className="flex-1 capitalize font-sans">{label}</span>
										<span className="tabular-nums font-mono">
											{formatMoney(value as number)}
										</span>
									</div>
								</span>
							),
						}}
					/>
				</div>
			</MetricCard>
		</div>
	);
};
