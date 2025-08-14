import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/products/new")({
	loader: () => {
		return {
			title: "New Product",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/products/new"!</div>;
}
