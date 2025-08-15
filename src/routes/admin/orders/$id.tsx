import { MetricCard } from "@components/admin/metric-card";
import { IconPackageDelivered } from "@components/icons/package-delivered";
import { IconPackageMoving } from "@components/icons/package-moving";
import { IconPackageProcess } from "@components/icons/package-process";
import { IconCircleChevronLeftFilled } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { buttonStyles } from "@ui/button";
import { Link } from "@ui/link";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getOrderQueryOptions } from "@/lib/query-options";

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
	const params = Route.useParams();
	const { data } = useSuspenseQueryDeferred(getOrderQueryOptions(params.id));

	return (
		<div>
			<div className="mb-8">
				<Link
					to="/admin/orders"
					className={buttonStyles({ intent: "outline" })}
				>
					<IconCircleChevronLeftFilled data-slot="icon" />
					Back to Orders
				</Link>
			</div>
			<div className="grid  grid-cols-3">
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
		</div>
	);
}
