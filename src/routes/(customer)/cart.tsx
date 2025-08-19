import { CartItemRow } from "@components/cart-item-row";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@ui/link";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getCartQueryOptions } from "@/lib/query-options";

export const Route = createFileRoute("/(customer)/cart")({
	component: RouteComponent,
});

function RouteComponent() {
	const context = Route.useRouteContext();
	const { data: cart } = useSuspenseQueryDeferred(getCartQueryOptions());

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-6">
				<h1 className="text-xl sm:text-2xl text-fg tracking-tight font-semibold leading-8">
					Your shopping cart
				</h1>
				<p className="text-muted-fg text-sm/6 mt-1 text-pretty max-w-xl">
					Let's take a moment to review your order. You can modify quantities or
					remove items if needed. Once you're ready, click the button below to
					proceed to checkout.
				</p>
			</div>
			<div className="grid lg:gap-12 lg:grid-cols-2 gap-6 items-start grid-cols-1">
				<div>
					<div>
						{cart.map((item) => (
							<CartItemRow
								item={item}
								user={context.user}
								key={item.productId}
							/>
						))}
					</div>
					<div className="flex items-center sm:justify-end justify-center mt-4">
						<Link
							to="/store"
							className="lg:block text-primary-subtle-fg text-sm font-medium cursor-pointer hidden hover:underline"
						>
							Continue Shopping
						</Link>
					</div>
				</div>
				<div></div>
			</div>
		</div>
	);
}
