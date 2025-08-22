import { CartItemRow } from "@components/cart-item-row";
import { createFileRoute } from "@tanstack/react-router";
import { buttonStyles } from "@ui/button";
import { Card } from "@ui/card";
import { DescriptionList } from "@ui/description-list";
import { Link } from "@ui/link";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getCartQueryOptions } from "@/lib/query-options";
import { formatMoney, formatNairaShort } from "@/lib/utils";

export const Route = createFileRoute("/(customer)/cart")({
	component: RouteComponent,
});

function RouteComponent() {
	const context = Route.useRouteContext();
	const { data: cart } = useSuspenseQueryDeferred(getCartQueryOptions());

	const totalPrice = cart.reduce((total, item) => {
		return total + item.quantity * item.product.price;
	}, 0);

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-8">
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
				<div>
					<Card.Header className="mb-4">
						<Card.Title>Order Summary</Card.Title>
						<Card.Description>
							Review your order details before proceeding to checkout.
						</Card.Description>
					</Card.Header>
					<div>
						<DescriptionList className="mb-4">
							<DescriptionList.Term>Subtotal</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								{formatMoney(totalPrice)}{" "}
								<span className="text-muted-fg ml-1">
									({formatNairaShort(totalPrice)})
								</span>
							</DescriptionList.Details>
							<DescriptionList.Term>Shipping</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								{formatMoney(0)}
							</DescriptionList.Details>
							<DescriptionList.Term>Tax (0%)</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								{formatMoney(0)}
							</DescriptionList.Details>
							<DescriptionList.Term>Total</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								{formatMoney(totalPrice)}{" "}
								<span className="text-muted-fg ml-1">
									({formatNairaShort(totalPrice)})
								</span>
							</DescriptionList.Details>
						</DescriptionList>
						<Link
							className={buttonStyles({ className: "w-full mb-2", size: "lg" })}
							to="/checkout"
							isDisabled={totalPrice === 0}
						>
							Checkout
						</Link>
						<p className="text-muted-fg text-sm/6 text-pretty max-w-xl text-center">
							You can apply any discount code at checkout
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
