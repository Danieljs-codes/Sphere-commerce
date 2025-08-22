import { createId } from "@paralleldrive/cuid2";
import { isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import {
	cart,
	cartItems,
	discount as discountTable,
	order,
	orderItem,
	payment,
	product as productTable,
} from "@server/db/schema";
import { paystack } from "@server/paystack";
import { validateDiscountAndCalculateAmount } from "@server/utils/discounts";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod/v4";
import { env } from "@/env";
import { checkoutSchema } from "@/lib/schema";
import { setFlashCookie } from "@/types/utils";

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
	address: {
		firstName?: string | null;
		lastName?: string | null;
		street?: string | null;
		city?: string | null;
		state?: string | null;
		postalCode?: string | null;
		country?: string | null;
	};
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

		const checkoutReference = `checkout-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
		const paystackResponse = await paystack.transaction.initialize({
			email: context.session.user.email,
			amount: total.toString(),
			currency: "NGN",
			callback_url: `${env.BETTER_AUTH_URL}/payment-callback`,
			reference: checkoutReference,
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

		if (!paystackResponse?.data) {
			throw new Error(paystackResponse.message);
		}

		await db.insert(payment).values({
			id: createId(),
			reference: checkoutReference,
			amount: total,
			status: "pending",
			provider: "paystack",
			currency: "NGN",
		});

		return {
			url: paystackResponse.data.authorization_url,
		};
	});

export const $handlePayment = createServerFn()
	.middleware([isAuthenticatedMiddleware])
	.validator(
		z.object({
			trxref: z.string().min(1).optional(),
			reference: z.string().min(1),
		}),
	)
	.handler(async ({ context, data }) => {
		const userId = context.session.user.id;

		// Verify payment with Paystack
		const paymentResp = await paystack.transaction.verify(data.reference);

		if (!paymentResp.data || paymentResp.data.status !== "success") {
			throw new Error("Payment verification failed");
		}

		const metadata = paymentResp.data.metadata as CheckoutMetadata;

		if (metadata.userId !== userId) {
			throw new Error("Payment does not belong to this user");
		}

		try {
			await db.transaction(async (tx) => {
				// 1️⃣ Check if order already exists for this payment reference
				const existingOrder = await tx
					.select({ id: order.id })
					.from(order)
					.where(eq(order.paymentReference, data.reference))
					.limit(1);

				if (existingOrder.length > 0) {
					// Already processed → nothing to do
					return;
				}

				// 2️⃣ Generate order id and number
				const newOrderId = createId();
				const orderNumber = Date.now();

				// 3️⃣ Map shipping address
				const addr = metadata.address || {};
				const shippingAddress = {
					street: addr.street ?? "",
					city: addr.city ?? "",
					state: addr.state ?? "",
					country: addr.country ?? "",
					zip: addr.postalCode ?? "",
				};

				// 4️⃣ Insert order
				await tx.insert(order).values({
					id: newOrderId,
					userId,
					orderNumber,
					subtotal: metadata.subtotal,
					discountAmount: metadata.discountAmount,
					shippingFee: metadata.shippingFee,
					taxAmount: metadata.taxAmount,
					total: metadata.total,
					discountId: metadata.discountId ?? null,
					discountCode: metadata.discountCode ?? null,
					status: "processing",
					shippingAddress,
					paymentReference: data.reference,
					createdAt: new Date(),
				});

				// 5️⃣ Insert order items and decrement stock
				for (const it of metadata.items) {
					const prodRows = await tx
						.select({
							id: productTable.id,
							stock: productTable.stock,
							name: productTable.name,
						})
						.from(productTable)
						.where(eq(productTable.id, it.productId))
						.limit(1);

					if (!prodRows || prodRows.length === 0) {
						throw new Error(
							`Product ${it.productId} not found when finalizing order`,
						);
					}

					const currentStock = prodRows[0].stock ?? 0;
					if (currentStock < it.quantity) {
						throw new Error(`Insufficient stock for ${prodRows[0].name}`);
					}

					// Insert order item
					await tx.insert(orderItem).values({
						id: createId(),
						orderId: newOrderId,
						productId: it.productId,
						quantity: it.quantity,
						productName: it.name ?? prodRows[0].name ?? null,
						pricePerItem: it.unitPrice,
						totalPrice: it.totalPrice,
					});

					// Update product stock
					await tx
						.update(productTable)
						.set({ stock: currentStock - it.quantity })
						.where(eq(productTable.id, it.productId));
				}

				if (metadata.discountId) {
					const discRows = await tx
						.select({
							id: discountTable.id,
							usageCount: discountTable.usageCount,
							usageLimit: discountTable.usageLimit,
						})
						.from(discountTable)
						.where(eq(discountTable.id, metadata.discountId))
						.limit(1);

					if (discRows && discRows.length > 0) {
						const usageCount = discRows[0].usageCount ?? 0;
						const usageLimit = discRows[0].usageLimit;
						await tx
							.update(discountTable)
							.set({ usageCount: usageCount + 1 })
							.where(eq(discountTable.id, metadata.discountId));

						if (usageLimit != null && usageCount + 1 >= usageLimit) {
							await tx
								.update(discountTable)
								.set({ isActive: false })
								.where(eq(discountTable.id, metadata.discountId));
						}
					}
				}

				if (metadata.cartId) {
					await tx
						.delete(cartItems)
						.where(eq(cartItems.cartId, metadata.cartId));
					await tx.delete(cart).where(eq(cart.id, metadata.cartId));
				}
			});
		} catch (err) {
			console.error("Error finalizing order after payment:", err);
			throw err;
		}

		setFlashCookie({
			intent: "success",
			message: "Payment successful! Your order is being processed.",
		});

		throw redirect({ to: "/orders" });
	});

