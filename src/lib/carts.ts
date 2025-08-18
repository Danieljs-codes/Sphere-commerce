import { $addToCart } from "@server/customers/carts";
import z from "zod/v4";

interface GuestCartItem {
	productId: string;
	quantity: number;
}

const LOCAL_CART_KEY = "guest_cart";

/**
 * Add a product to the cart.
 * @param productId - ID of the product to add
 * @param quantity - Desired quantity
 * @param isAuthenticated - Whether the user is logged in
 */

const localStorageCartSchema = z.array(
	z.object({
		productId: z.string().min(1),
		quantity: z.number().min(1),
	}),
);

export async function addToCart(
	productId: string,
	quantity: number,
	isAuthenticated: boolean,
) {
	if (isAuthenticated) {
		// ✅ Authenticated user — call server function
		const res = await $addToCart({
			data: {
				productId,
				quantity,
			},
		});
		return res;
	} else {
		// 🛒 Guest user — update localStorage
		const raw = localStorage.getItem(LOCAL_CART_KEY);
		let cart = raw ? localStorageCartSchema.parse(JSON.parse(raw)) : [];

		if (quantity === 0) {
			// Remove item if quantity is 0
			cart = cart.filter((item) => item.productId !== productId);
		} else {
			const existingItem = cart.find((item) => item.productId === productId);
			if (existingItem) {
				existingItem.quantity = quantity; // overwrite
			} else {
				cart.push({ productId, quantity });
			}
		}

		localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));

		return { cartId: null, productId, quantity };
	}
}
