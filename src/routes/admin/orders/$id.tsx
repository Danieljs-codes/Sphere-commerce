import { IconCircleChevronLeftFilled } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { buttonStyles } from "@ui/button";
import { Link } from "@ui/link";

export const Route = createFileRoute("/admin/orders/$id")({
	component: RouteComponent,
});

function RouteComponent() {
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
		</div>
	);
}
