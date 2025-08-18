import { createId } from "@paralleldrive/cuid2";
import { isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import { cart, cartItems, product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import z from "zod/v4";

const cartSchema = z.array(
	z.object({
		productId: z.string().min(1),
		quantity: z.number().min(1),
	}),
);

export const $mergeCartOnSignIn = createServerFn()
	.middleware([isAuthenticatedMiddleware])
	.validator(cartSchema)
	.handler(async ({ context, data: localCartData }) => {
		const { id: userId } = context.session.user;

		if (!localCartData.length) {
			return {
				success: true,
				cartId: null,
				mergedItemsCount: 0,
				updatedItemsCount: 0,
			};
		}

		return await db.transaction(async (tx) => {
			// Get all data in parallel
			const productIds = localCartData.map((item) => item.productId);

			const [userCartResult, validProductsResult] = await Promise.all([
				tx.select().from(cart).where(eq(cart.userId, userId)).limit(1),
				tx
					.select({
						id: product.id,
						price: product.price,
						stock: product.stock,
					})
					.from(product)
					.where(
						and(inArray(product.id, productIds), eq(product.status, "active")),
					),
			]);

			let cartId: string;
			if (userCartResult.length === 0) {
				cartId = createId();
				await tx.insert(cart).values({
					id: cartId,
					userId,
					createdAt: new Date(),
					updatedAt: new Date(),
					discountCode: null,
					total: 0,
					discountId: null,
				});
			} else {
				cartId = userCartResult[0].id;
			}

			const validProductMap = new Map(
				validProductsResult.map((p) => [p.id, p]),
			);
			const validLocalItems = localCartData.filter((item) =>
				validProductMap.has(item.productId),
			);

			if (!validLocalItems.length) {
				return {
					success: true,
					cartId,
					mergedItemsCount: 0,
					updatedItemsCount: 0,
				};
			}

			const existingCartItems = await tx
				.select()
				.from(cartItems)
				.where(
					and(
						eq(cartItems.cartId, cartId),
						inArray(
							cartItems.productId,
							validLocalItems.map((item) => item.productId),
						),
					),
				);

			const existingItemsMap = new Map(
				existingCartItems.map((item) => [item.productId, item]),
			);

			const itemsToInsert: (typeof cartItems.$inferInsert)[] = [];
			const updatePromises: Promise<any>[] = [];
			let updatedCount = 0;

			const now = new Date();

			for (const localItem of validLocalItems) {
				const validProduct = validProductMap.get(localItem.productId)!;
				const existingItem = existingItemsMap.get(localItem.productId);

				if (existingItem) {
					const newQuantity = Math.min(
						existingItem.quantity + localItem.quantity,
						validProduct.stock,
					);

					if (newQuantity !== existingItem.quantity) {
						updatePromises.push(
							tx
								.update(cartItems)
								.set({ quantity: newQuantity })
								.where(eq(cartItems.id, existingItem.id)),
						);
						updatedCount++;
					}
				} else {
					const quantityToAdd = Math.min(
						localItem.quantity,
						validProduct.stock,
					);

					if (quantityToAdd > 0) {
						itemsToInsert.push({
							id: createId(),
							cartId,
							productId: localItem.productId,
							quantity: quantityToAdd,
							priceAtAdd: validProduct.price,
							createdAt: now,
						});
					}
				}
			}

			const allOperations: Promise<any>[] = [...updatePromises];

			if (itemsToInsert.length > 0) {
				allOperations.push(tx.insert(cartItems).values(itemsToInsert));
			}

			allOperations.push(
				tx.update(cart).set({ updatedAt: now }).where(eq(cart.id, cartId)),
			);

			await Promise.all(allOperations);

			return {
				success: true,
				cartId,
				mergedItemsCount: itemsToInsert.length,
				updatedItemsCount: updatedCount,
			};
		});
	});

export const $addToCart = createServerFn()
	.middleware([isAuthenticatedMiddleware])
	.validator(
		z.object({
			productId: z.string().min(1),
			quantity: z.number().min(1),
		}),
	)
	.handler(async ({ context, data }) => {
		const { id: userId } = context.session.user;

		// 1️⃣ Get product and stock
		const [validProduct] = await db
			.select()
			.from(product)
			.where(eq(product.id, data.productId))
			.limit(1);

		if (!validProduct) throw new Error("Product not found");

		const stock = validProduct.stock;

		// 2️⃣ Create cart if missing
		const [userCart] = await db
			.insert(cart)
			.values({ userId, total: 0 })
			.onConflictDoUpdate({
				target: cart.userId,
				set: { userId: sql`excluded.user_id` }, // no-op
			})
			.returning({ id: cart.id });

		const cartId = userCart.id;

		// 3️⃣ Upsert cart item with requested quantity capped by stock
		const [cartItem] = await db
			.insert(cartItems)
			.values({
				cartId,
				productId: data.productId,
				quantity: Math.min(data.quantity, stock),
				priceAtAdd: validProduct.price,
				createdAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [cartItems.cartId, cartItems.productId],
				set: {
					quantity: sql`MIN(${data.quantity}, ${stock})`, // overwrite, capped
					priceAtAdd: sql`excluded.price_at_add`,
				},
			})
			.returning({
				id: cartItems.id,
				quantity: cartItems.quantity,
			});

		return {
			cartId,
			productId: data.productId,
			quantity: cartItem.quantity,
		};
	});
