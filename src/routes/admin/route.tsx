import { getSidebarState, setFlashCookie } from "@server/utils";
import {
	createFileRoute,
	Outlet,
	redirect,
	useChildMatches,
} from "@tanstack/react-router";
import AppSidebar from "@/components/admin/app-sidebar";
import AppSidebarNav from "@/components/admin/app-sidebar-nav";
import { Container } from "@/components/ui/container";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSignedUserQueryOptions } from "@/lib/query-options";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.fetchQuery(
			getSignedUserQueryOptions(),
		);

		if (!user) {
			setFlashCookie({
				intent: "error",
				message:
					"Please sign in to continue. Administrative access is required for this page.",
			});
			throw redirect({
				to: "/sign-in",
			});
		}

		if (!user.user.isAdmin) {
			setFlashCookie({
				intent: "error",
				message:
					"Access denied. You do not have the necessary administrative privileges to view this page.",
			});
			throw redirect({
				to: "/",
			});
		}

		return { user };
	},
	loader: async () => {
		const sidebarState = getSidebarState();

		return {
			sidebarState,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const data = Route.useLoaderData();
	const { user } = Route.useRouteContext();
	const match = useChildMatches();

	const loaderData = match[match.length - 1]?.loaderData;

	const title =
		loaderData && "title" in loaderData && typeof loaderData.title === "string"
			? loaderData.title
			: "Dashboard";

	return (
		<SidebarProvider shortcut="\" defaultOpen={data.sidebarState}>
			<AppSidebar user={user.user} collapsible="dock" />
			<SidebarInset>
				<AppSidebarNav title={title} user={user.user} />
				<Container className="p-4 lg:p-6 max-w- mx-auto py-0">
					<Outlet />
				</Container>
			</SidebarInset>
		</SidebarProvider>
	);
}
