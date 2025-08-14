import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
	beforeLoad: ({ context }) => {
		// if (context.token && context.userId) {
		//   setFlashCookie({
		//     intent: 'info',
		//     message: 'You are already logged in',
		//   })
		//   throw redirect({
		//     to: '/',
		//   })
		// }
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="relative grid min-h-svh grid-cols-[1fr_1rem_auto_1rem_1fr] grid-rows-[1fr_1px_auto_1px_1fr] bg-bg sm:grid-cols-[1fr_2.5rem_auto_2.5rem_1fr]">
			<div className="col-start-3 row-start-3 flex max-w-lg flex-col sm:bg-fg/10 sm:p-2">
				<div className="rounded-xl bg-bg p-6 text-sm/7 sm:p-10">
					<Outlet />
				</div>
			</div>
			<div
				className="border-[--pattern-fg] bg-[size:10px_10px] bg-fixed [--pattern-fg:var(--color-border)] relative inset-auto z-auto col-start-2 row-span-full row-start-1 border-x"
				style={{
					backgroundImage:
						"repeating-linear-gradient(315deg, var(--pattern-fg) 0, var(--pattern-fg) 1px, transparent 0, transparent 50%)",
				}}
			/>
			<div
				className="border-[--pattern-fg] bg-[size:10px_10px] bg-fixed [--pattern-fg:var(--color-border)] relative inset-auto z-auto col-start-4 row-span-full row-start-1 border-x"
				style={{
					backgroundImage:
						"repeating-linear-gradient(315deg, var(--pattern-fg) 0, var(--pattern-fg) 1px, transparent 0, transparent 50%)",
				}}
			/>
			<div className="-bottom-px relative col-span-full col-start-1 row-start-2 h-px bg-border/50" />
			<div className="-bottom-px relative col-span-full col-start-1 row-start-2 h-px bg-border/50" />
		</div>
	);
}
