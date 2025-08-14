import { AppNavbar } from "@components/app-navbar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container } from "@/components/ui/container";
import { NavbarProvider } from "@/components/ui/navbar";
import { getSignedUserQueryOptions } from "@/lib/query-options";

export const Route = createFileRoute("/(customer)")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.fetchQuery(
			getSignedUserQueryOptions(),
		);

		return { user };
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
