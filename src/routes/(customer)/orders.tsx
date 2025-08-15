import { createFileRoute } from "@tanstack/react-router";
import { Heading } from "@ui/heading";

export const Route = createFileRoute("/(customer)/orders")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			<div>
				<Heading>Orders</Heading>
			</div>
		</div>
	);
}
