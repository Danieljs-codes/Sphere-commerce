import { AppNavbar } from "@components/app-navbar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import z from "zod/v4";
import { Container } from "@/components/ui/container";
import { NavbarProvider } from "@/components/ui/navbar";
import {
	getCartQueryOptions,
	getSignedUserQueryOptions,
	searchProductsQueryOptions,
} from "@/lib/query-options";

export const Route = createFileRoute("/(customer)")({
	validateSearch: z.object({
		search: z.string().optional().default("").catch(""),
	}),
	loaderDeps: ({ search }) => ({ ...search }),
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.fetchQuery(
			getSignedUserQueryOptions(),
		);

		return { user };
	},
	loader: async ({ context, deps }) => {
		context.queryClient.ensureQueryData(
			searchProductsQueryOptions(deps.search),
		);
		context.queryClient.ensureQueryData(getCartQueryOptions());
		return {
			title: "Customer",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { user } = Route.useRouteContext();
	return (
		<NavbarProvider>
			<AppNavbar user={user ? user.user : null} />
			<Container className="py-6 sm:py-12">
				<Outlet />
			</Container>
		</NavbarProvider>
	);
}
