import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(customer)/store/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/(customer)/store/$id"!</div>;
}
