import { TanstackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toast } from "@ui/toast";
import { ThemeProvider } from "next-themes";
import nProgress from "nprogress";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getFlashCookie } from "@/types/utils";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Sphere - Ecommerce Application",
			},
			{
				name: "description",
				content:
					"An ecommerce application built with Tanstack Start, Tailwind CSS, and Sqlite.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon.svg",
				type: "image/svg+xml",
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png",
			},
		],
	}),
	loader: () => {
		const cookie = getFlashCookie();

		return { cookie };
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head
				lang="en"
				className="font-sans antialiased"
				suppressHydrationWarning
			>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<InnerComponent>{children}</InnerComponent>
					<Toast />
				</ThemeProvider>
				<TanstackDevtools
					config={{
						position: "bottom-left",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

function InnerComponent({ children }: { children: React.ReactNode }) {
	const router = useRouterState({
		select: (state) => ({
			pathname: state.location.pathname,
			status: state.status,
		}),
	});
	const pathnameRef = useRef(router.pathname);
	const { cookie } = Route.useLoaderData();

	useEffect(() => {
		if (!cookie) return;
		setTimeout(
			() =>
				toast[cookie.intent](cookie.message, {
					description: cookie.description,
				}),
			0,
		);
	}, [cookie]);

	useEffect(() => {
		const currentPathname = router.pathname;
		const pathnameChanged = currentPathname !== pathnameRef.current;

		nProgress.configure({
			showSpinner: false,
		});
		if (pathnameChanged && router.status === "pending") {
			nProgress.start();
			pathnameRef.current = currentPathname;
		}

		if (router.status === "idle") {
			nProgress.done();
		}
	}, [router.pathname, router.status]);
	return <>{children}</>;
}
