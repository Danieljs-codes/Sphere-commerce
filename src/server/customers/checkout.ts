import { isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import {
	cart,
	cartItems,
	discount as discountTable,
	product as productTable,
} from "@server/db/schema";
import { paystack } from "@server/paystack";
import { validateDiscountAndCalculateAmount } from "@server/utils/discounts";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod/v4";
import { env } from "@/env";
import { checkoutSchema } from "@/lib/schema";

// So create a paystack payment transaction
// Don't store pending transaction
// If discount is applied pass it as custom metadata since on webhook we need the discountId when we retrieve the webhook or some other way
// Validate product quantity is good and there is enough stock, price is correct, discount is correct some of this logic exists in other file in the server folder already maybe you can find a way ton reuse it

export type CheckoutMetadata = {
	userId: string;
	cartId: string;
	items: Array<{
		productId: string;
		name: string | null;
		quantity: number;
		unitPrice: number;
		totalPrice: number;
	}>;
	subtotal: number;
	discountAmount: number;
	discountCode: string | null;
	discountId: string | null;
	shippingFee: number;
	taxAmount: number;
	total: number;
	address: string;
};

export const $checkout = createServerFn({
	method: "POST",
})
	.middleware([isAuthenticatedMiddleware])
	.validator(
		z.object({
			...checkoutSchema.shape,
			discountCode: z.string().min(1).nullable(),
		}),
	)
	.handler(async ({ data, context }) => {
		const userId = context.session.user.id;

		// Get user cart
		const cartRow = await db
			.select()
			.from(cart)
			.where(eq(cart.userId, userId))
			.limit(1);

		if (!cartRow || cartRow.length === 0) {
			throw new Error("Cart not found");
		}

		// Load cart items joined with product to validate price and stock
		const rows = await db
			.select({
				id: cartItems.id,
				productId: cartItems.productId,
				quantity: cartItems.quantity,
				priceAtAdd: cartItems.priceAtAdd,
				currentPrice: productTable.price,
				currentStock: productTable.stock,
				productName: productTable.name,
			})
			.from(cartItems)
			.leftJoin(productTable, eq(productTable.id, cartItems.productId))
			.where(eq(cartItems.cartId, cartRow[0].id));

		if (!rows || rows.length === 0) {
			throw new Error("Cart is empty");
		}

		// Validate items
		let subtotal = 0;
		for (const r of rows) {
			if (!r.currentPrice) {
				throw new Error(`Product ${r.productId} not found`);
			}

			// Ensure price hasn't changed from priceAtAdd (simple check)
			if (r.priceAtAdd !== r.currentPrice) {
				// Optional: you might want to update cart priceAtAdd; for now reject
				throw new Error(`Product price has changed for ${r.productName}`);
			}

			if (r.currentStock == null || r.currentStock < r.quantity) {
				throw new Error(`Insufficient stock for ${r.productName}`);
			}

			subtotal += r.quantity * r.priceAtAdd;
		}

		// Apply discount if provided
		let discountAmount = 0;
		const discountCode = data.discountCode;
		if (discountCode) {
			const validated = await validateDiscountAndCalculateAmount(
				{ code: discountCode },
				userId,
			);
			if (!validated.ok) {
				throw new Error(validated.error);
			}
			discountAmount = validated.discountAmount;
		}

		// For now assume no shipping and tax
		const shippingFee = 0;
		const taxAmount = 0;

		const total = Math.max(
			0,
			subtotal - discountAmount + shippingFee + taxAmount,
		);

		// Build items metadata for payment provider
		const itemsMeta = rows.map((r) => ({
			productId: r.productId,
			name: r.productName,
			quantity: r.quantity,
			unitPrice: r.priceAtAdd,
			totalPrice: r.quantity * r.priceAtAdd,
		}));

		// If a discount code was provided, fetch discount id for webhook reference
		let discountId: string | null = null;
		if (discountCode) {
			const found = await db
				.select({ id: discountTable.id, code: discountTable.code })
				.from(discountTable)
				.where(eq(discountTable.code, discountCode))
				.limit(1);
			if (found && found.length > 0) discountId = found[0].id;
		}

		const address = {
			firstName: data.firstName,
			lastName: data.lastName,
			street: data.street,
			city: data.city,
			state: data.state,
			postalCode: data.postalCode,
			country: data.country,
		};

		console.log(context.session.user.email, total);

		const paystackResponse = await paystack.transaction.initialize({
			email: context.session.user.email,
			amount: total.toString(), // Amount is stored in the smallest currency unit (kobo)
			currency: "NGN",
			callback_url: `${env.BETTER_AUTH_URL}/payment-callback`,
			reference: `checkout-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
			metadata: {
				userId,
				cartId: cartRow[0].id,
				items: itemsMeta,
				subtotal,
				discountAmount,
				discountCode: discountCode ?? null,
				discountId,
				shippingFee,
				taxAmount,
				total,
				address,
			},
		});

		console.log("Paystack response:", paystackResponse);

		if (!paystackResponse?.data) {
			throw new Error(paystackResponse.message);
		}

		return {
			url: paystackResponse.data.authorization_url,
		};
	});
