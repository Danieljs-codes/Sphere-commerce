import { createId } from "@paralleldrive/cuid2";
import type { CheckoutMetadata } from "@server/customers/checkout";
import { db } from "@server/db";
import {
	cart,
	cartItems,
	discount as discountTable,
	order,
	orderItem,
	payment,
	product,
} from "@server/db/schema";
import { paystack } from "@server/paystack";
import { eq } from "drizzle-orm";

export async function processPaymentOrder(
	reference: string,
	source: "webhook" | "redirect" = "webhook",
	userId?: string,
) {
	// Verify payment with Paystack
	const paymentResp = await paystack.transaction.verify(reference);

	if (!paymentResp.data || paymentResp.data.status !== "success") {
		await db
			.update(payment)
			.set({ status: "failed", rawResponse: paymentResp.data })
			.where(eq(payment.reference, reference));
		throw new Error("Payment verification failed");
	}
	const metadata = paymentResp.data.metadata as CheckoutMetadata;

	if (source === "redirect" && metadata.userId !== userId) {
		throw new Error("User ID mismatch");
	}

	try {
		const res = await db.transaction(async (tx) => {
			// Check if payment has already been processed
			const existingPayment = await tx
				.select({ id: payment.id, status: payment.status })
				.from(payment)
				.where(eq(payment.reference, reference))
				.limit(1);

			if (
				existingPayment.length > 0 &&
				existingPayment[0].status === "success"
			) {
				console.log(
					`${source}: Payment ${reference} already processed, skipping`,
				);
				return null;
			}

			// 1️⃣ Check if order already exists for this payment reference
			const existingOrder = await tx
				.select({ id: order.id, status: order.status })
				.from(order)
				.where(eq(order.paymentReference, reference))
				.limit(1);

			if (existingOrder.length > 0) {
				console.log(
					`${source}: Order already exists for payment ${reference}, skipping`,
				);
				return existingOrder[0];
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

			// 4️⃣ Insert order (this will fail if paymentReference already exists)
			const [newOrder] = await tx
				.insert(order)
				.values({
					id: newOrderId,
					userId: metadata.userId,
					orderNumber,
					subtotal: metadata.subtotal,
					discountAmount: metadata.discountAmount,
					shippingFee: metadata.shippingFee,
					taxAmount: metadata.taxAmount,
					total: metadata.total,
					discountId:
						typeof metadata.discountId === "string" &&
						metadata.discountId.length > 0
							? metadata.discountId
							: null,
					discountCode:
						metadata.discountId && metadata.discountCode
							? metadata.discountCode
							: null,
					status: "processing",
					shippingAddress,
					paymentReference: reference,
					createdAt: new Date(),
				})
				.returning();

			// 5️⃣ Insert order items and decrement stock
			for (const it of metadata.items) {
				const prodRows = await tx
					.select({
						id: product.id,
						stock: product.stock,
						name: product.name,
					})
					.from(product)
					.where(eq(product.id, it.productId))
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

				// Decrement stock
				await tx
					.update(product)
					.set({ stock: currentStock - it.quantity })
					.where(eq(product.id, it.productId));
			}

			// 6️⃣ Update payment status
			await tx
				.update(payment)
				.set({ status: "success" })
				.where(eq(payment.reference, reference));

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
				await tx.delete(cartItems).where(eq(cartItems.cartId, metadata.cartId));
				await tx.delete(cart).where(eq(cart.id, metadata.cartId));
			}
			return newOrder;
		});
		// biome-ignore lint/suspicious/noExplicitAny: I know
	} catch (error: any) {
		// Handle unique constraint violation gracefully
		if (
			error.message?.includes("UNIQUE constraint failed") ||
			error.message?.includes("duplicate key value")
		) {
			console.log(
				`${source}: Payment ${reference} already processed (constraint violation), skipping`,
			);
			return null;
		}
		console.error(`${source}: Error processing payment ${reference}:`, error);
		throw error;
	}
}
