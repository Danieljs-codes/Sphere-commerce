import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/discounts")({
	loader: () => {
		return {
			title: "Discounts",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/discounts"!</div>;
}
