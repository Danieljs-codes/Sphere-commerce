import { SummaryItem } from "@components/summary-item";
import { zodResolver } from "@hookform/resolvers/zod";
import { $checkout } from "@server/customers/checkout";
import { $validateDiscountCode } from "@server/discounts";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Avatar } from "@ui/avatar";
import { Button } from "@ui/button";
import { Card } from "@ui/card";
import { Loader } from "@ui/loader";
import { TextField } from "@ui/text-field";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getCartQueryOptions } from "@/lib/query-options";
import { type CheckoutFormData, checkoutSchema } from "@/lib/schema";
import { formatMoney, formatNairaShort } from "@/lib/utils";
import { setFlashCookie } from "@/types/utils";

export const Route = createFileRoute("/(customer)/checkout")({
	beforeLoad: async ({ context }) => {
		if (!context.user) {
			setFlashCookie({
				intent: "warning",
				message:
					"Please sign in to continue to Checkout. You'll be redirected to the login page to complete your purchase.",
			});

			throw redirect({
				to: "/sign-in",
			});
		}

		return {
			user: context.user,
		};
	},
	loader: async ({ context }) => {
		context.queryClient.ensureQueryData(getCartQueryOptions());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const context = Route.useRouteContext();
	const { handleSubmit, control } = useForm({
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			firstName: context.user.user.name.split(" ")[0],
			lastName: context.user.user.name.split(" ")[1] || "",
			street: "",
			city: "",
			state: "",
			postalCode: "",
			country: "",
		},
	});
	const { data: cart } = useSuspenseQueryDeferred(getCartQueryOptions());

	const totalPrice = cart.reduce((total, item) => {
		return total + item.quantity * item.product.price;
	}, 0);

	const totalItems = cart.reduce((total, item) => {
		return total + item.quantity;
	}, 0);

	const [discountCode, setDiscountCode] = useState("");
	const [discountAmount, setDiscountAmount] = useState(0);

	const { mutateAsync: checkout, isPending: isCheckingOut } = useMutation({
		mutationFn: async (data: CheckoutFormData) => {
			return await $checkout({
				data: {
					...data,
					discountCode: discountCode.length > 0 ? discountCode : null,
				},
			});
		},
		// throwOnError: true,
		onSuccess: ({ url }) => {
			window.location.href = url;
		},
		// onError: (error) => {
		// 	toast.error(error.message);
		// },
	});

	const { mutateAsync: validateDiscountCode, isPending } = useMutation({
		mutationFn: async ({ code }: { code: string }) => {
			const { discountAmount } = await $validateDiscountCode({
				data: { code },
			});

			return { discountAmount };
		},
		onSuccess: ({ discountAmount }) => {
			setDiscountAmount(discountAmount);
			toast.success("Discount code applied successfully!");
		},
		onError: (err) => {
			setDiscountAmount(0);
			setDiscountCode("");
			toast.error(err.message);
		},
	});

	const onSubmit = (data: CheckoutFormData) => {
		toast.promise(checkout(data), {
			loading: "Processing checkout...",
			success: "Checkout successful!",
			error: (error) => error.message,
		});
	};

	return (
		<div>
			<h1 className="sr-only">Checkout</h1>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="lg:gap-16 grid lg:grid-cols-2 grid-cols-1 max-w-5xl mx-auto gap-8"
			>
				<div className="flex flex-col">
					<div className="pb-8 mb-8 border-b">
						<Card.Header>
							<Card.Title>Shipping address</Card.Title>
							<Card.Description>
								Provide the recipient's name, street address, city, and postal
								code for delivery.
							</Card.Description>
						</Card.Header>
						<div className="mt-6 space-y-6">
							<div className="grid md:grid-cols-2 grid-cols-1 gap-6">
								<Controller
									control={control}
									name="firstName"
									render={({ field, fieldState }) => (
										<TextField
											label="First Name"
											placeholder="John"
											{...field}
											isInvalid={fieldState.invalid}
											errorMessage={fieldState.error?.message}
										/>
									)}
								/>
								<Controller
									control={control}
									name="lastName"
									render={({ field, fieldState }) => (
										<TextField
											label="Last Name"
											placeholder="Doe"
											{...field}
											isInvalid={fieldState.invalid}
											errorMessage={fieldState.error?.message}
										/>
									)}
								/>
							</div>
							<div className="grid md:grid-cols-2 grid-cols-1 gap-6">
								<Controller
									control={control}
									name="street"
									render={({ field, fieldState }) => (
										<TextField
											label="Street"
											placeholder="123 Main St"
											{...field}
											isInvalid={fieldState.invalid}
											errorMessage={fieldState.error?.message}
										/>
									)}
								/>
								<Controller
									control={control}
									name="city"
									render={({ field, fieldState }) => (
										<TextField
											label="City"
											placeholder="Anytown"
											{...field}
											isInvalid={fieldState.invalid}
											errorMessage={fieldState.error?.message}
										/>
									)}
								/>
							</div>
							<div className="grid md:grid-cols-2 grid-cols-1 gap-6">
								<Controller
									control={control}
									name="state"
									render={({ field, fieldState }) => (
										<TextField
											label="State"
											placeholder="CA"
											{...field}
											isInvalid={fieldState.invalid}
											errorMessage={fieldState.error?.message}
										/>
									)}
								/>
								<Controller
									control={control}
									name="postalCode"
									render={({ field, fieldState }) => (
										<TextField
											label="Postal Code"
											placeholder="12345"
											{...field}
											isInvalid={fieldState.invalid}
											errorMessage={fieldState.error?.message}
										/>
									)}
								/>
							</div>
							<Controller
								control={control}
								name="country"
								render={({ field, fieldState }) => (
									<TextField
										label="Country"
										placeholder="Nigeria"
										{...field}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>
						</div>
					</div>
					<div>
						<Card.Header>
							<Card.Title>Discount Code</Card.Title>
							<Card.Description>
								Enter your discount code below.
							</Card.Description>
						</Card.Header>
						<div className="mt-6">
							<TextField
								label="Discount Code"
								placeholder="Enter your code"
								suffix={
									<Button
										onPress={async () => {
											await validateDiscountCode({ code: discountCode });
										}}
										isPending={isPending}
										isDisabled={!discountCode}
									>
										{isPending ? <Loader /> : "Apply"}
									</Button>
								}
								value={discountCode}
								onChange={(value) => setDiscountCode(value.toUpperCase())}
							/>
						</div>
						<Button
							size="md"
							className="mt-6 w-full"
							aria-label={`Pay ${formatMoney(totalPrice)} with Paystack`}
							type="submit"
							isPending={isCheckingOut}
							isDisabled={cart.length === 0}
						>
							{isCheckingOut ? <Loader /> : "Proceed to Payment"}
						</Button>
					</div>
				</div>
				<div className="flex flex-col">
					<div>
						<Card.Header>
							<Card.Title>Order summary</Card.Title>
							<Card.Description>Check your order details.</Card.Description>
						</Card.Header>
						<div className="mt-6 border rounded-lg">
							{cart.map((product) => (
								<div
									key={product.productId}
									className="text-sm/[calc(1.25_/_.875)] p-5 items-start flex border-b last:border-0 gap-4"
								>
									<Avatar
										size="lg"
										src={product.product.images[0].url}
										alt={product.product.name}
										isSquare
									/>
									<div className="flex-1 w-fit">
										<h4 className="font-medium">{product.product.name}</h4>
										<p className="mt-1">
											Quantity: {product.quantity} x ₦
											{formatNairaShort(product.product.price)}
										</p>
									</div>
									<div className="text-right font-medium">
										{formatMoney(product.quantity * product.product.price)}
									</div>
								</div>
							))}
							<div className="p-4 gap-y-4 flex-col flex">
								<SummaryItem label="Total Items" value={totalItems} />
								<SummaryItem label="Subtotal" value={formatMoney(totalPrice)} />
								<SummaryItem label="Shipping" value={formatMoney(0)} />
								<SummaryItem
									label="Discount"
									value={formatMoney(discountAmount)}
								/>
								<SummaryItem
									label="Grand Total"
									value={formatMoney(totalPrice - discountAmount)}
								/>
							</div>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
}
