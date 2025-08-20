import { createId } from "@paralleldrive/cuid2";
import { authMiddleware, isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import { cart, cartItems, product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import z from "zod/v4";
import { COOKIE_CART_KEY } from "@/lib/carts";

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

			deleteCookie(COOKIE_CART_KEY);

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
					quantity: sql`MIN(${cartItems.quantity} + ${data.quantity}, ${stock})`,
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

export const $getCart = createServerFn()
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		// Helper function to fetch products by IDs
		const fetchProducts = async (productIds: string[]) => {
			return await db
				.select()
				.from(product)
				.where(inArray(product.id, productIds));
		};

		// If the user is not authenticated
		if (!context.session) {
			const cartCookie = getCookie(COOKIE_CART_KEY);

			if (!cartCookie) return [];

			try {
				const validatedCartItems = cartSchema.parse(JSON.parse(cartCookie));

				// Extract unique product IDs from the cart items
				const productIds = [
					...new Set(validatedCartItems.map((item) => item.productId)),
				];

				// Fetch corresponding products from the database
				const products = await fetchProducts(productIds);

				// Map cart items to include product details and apply necessary validations
				return validatedCartItems
					.map((item) => {
						const productDetails = products.find(
							(p) => p.id === item.productId,
						);

						// If product is inactive, out of stock, or missing, return null
						if (
							!productDetails ||
							productDetails.status !== "active" ||
							productDetails.stock === 0
						) {
							return null;
						}

						// Cap the quantity to available stock
						const quantity = Math.min(item.quantity, productDetails.stock);

						return {
							...item,
							quantity,
							product: productDetails,
						};
					})
					.filter(Boolean); // Remove null values
			} catch (_) {
				return [];
			}
		}

		// If the user is authenticated
		const [userCart] = await db
			.select()
			.from(cart)
			.where(eq(cart.userId, context.session.user.id))
			.limit(1);

		if (!userCart) return [];

		const cartItemsData = await db
			.select()
			.from(cartItems)
			.where(eq(cartItems.cartId, userCart.id));

		const productIds = cartItemsData.map((item) => item.productId);

		const products = await fetchProducts(productIds);

		return cartItemsData
			.map((item) => {
				const productDetails = products.find((p) => p.id === item.productId);

				// If product is inactive, out of stock, or missing, return null
				if (
					!productDetails ||
					productDetails.status !== "active" ||
					productDetails.stock === 0
				) {
					return null;
				}

				// Cap the quantity to available stock
				const quantity = Math.min(item.quantity, productDetails.stock);

				return {
					...item,
					quantity,
					product: productDetails,
				};
			})
			.filter(Boolean);
	});

export const $removeFromCart = createServerFn()
	.middleware([isAuthenticatedMiddleware])
	.validator(
		z.object({
			productId: z.string().min(1),
			quantity: z.number().min(1),
			removeAll: z.boolean().optional().default(false),
		}),
	)
	.handler(async ({ context, data }) => {
		const { id: userId } = context.session.user;

		// 1️⃣ Find the user cart
		const [userCart] = await db
			.select()
			.from(cart)
			.where(eq(cart.userId, userId))
			.limit(1);

		if (!userCart) throw new Error("Cart not found");

		// 2️⃣ Find the cart item
		const [cartItem] = await db
			.select()
			.from(cartItems)
			.where(
				and(
					eq(cartItems.cartId, userCart.id),
					eq(cartItems.productId, data.productId),
				),
			)
			.limit(1);

		if (!cartItem) throw new Error("Item not in cart");

		if (data.removeAll || cartItem.quantity <= data.quantity) {
			// ❌ Remove completely
			await db.delete(cartItems).where(eq(cartItems.id, cartItem.id));
			return {
				cartId: userCart.id,
				productId: data.productId,
				removed: true,
			};
		} else {
			// ➖ Decrease quantity
			const [updatedItem] = await db
				.update(cartItems)
				.set({
					quantity: cartItem.quantity - data.quantity,
				})
				.where(eq(cartItems.id, cartItem.id))
				.returning({
					id: cartItems.id,
					quantity: cartItems.quantity,
				});

			return {
				cartId: userCart.id,
				productId: data.productId,
				quantity: updatedItem.quantity,
			};
		}
	});
