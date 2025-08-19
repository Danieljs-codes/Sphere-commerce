import { $addToCart, $removeFromCart } from "@server/customers/carts";
import { z } from "zod";

export const COOKIE_CART_KEY = "guest_cart";

const cartSchema = z.array(
	z.object({
		productId: z.string().min(1),
		quantity: z.number().min(1),
	}),
);

// Helper functions to read/write cookie
export function getGuestCart(): { productId: string; quantity: number }[] {
	if (typeof document === "undefined") return []; // server-safe
	const match = document.cookie.match(
		// biome-ignore lint/style/useTemplate: I know
		new RegExp("(^| )" + COOKIE_CART_KEY + "=([^;]+)"),
	);
	return match
		? cartSchema.parse(JSON.parse(decodeURIComponent(match[2])))
		: [];
}

function setGuestCart(cart: { productId: string; quantity: number }[]) {
	if (typeof document === "undefined") return;
	const value = encodeURIComponent(JSON.stringify(cart));
	// path=/ so it's accessible on all routes, max-age 7 days
	// biome-ignore lint/suspicious/noDocumentCookie: I know
	document.cookie = `${COOKIE_CART_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export async function addToCart(
	productId: string,
	quantity: number,
	isAuthenticated: boolean,
) {
	if (isAuthenticated) {
		// ✅ Authenticated user — call server function
		const res = await $addToCart({
			data: { productId, quantity },
		});
		return res;
	} else {
		// 🛒 Guest user — update cookie
		let cart = getGuestCart();

		if (quantity === 0) {
			cart = cart.filter((item) => item.productId !== productId);
		} else {
			const existingItem = cart.find((item) => item.productId === productId);
			if (existingItem) {
				existingItem.quantity = existingItem.quantity + quantity;
			} else {
				cart.push({ productId, quantity });
			}
		}

		setGuestCart(cart);

		return { cartId: null, productId, quantity };
	}
}

export async function removeFromCart(
	productId: string,
	quantity: number,
	isAuthenticated: boolean,
	removeAll: boolean = false,
) {
	if (isAuthenticated) {
		// ✅ Authenticated user — call server function
		const res = await $removeFromCart({
			data: { productId, quantity, removeAll },
		});
		return res;
	} else {
		// 🛒 Guest user — update cookie/localStorage
		let cart = getGuestCart();

		const existingItem = cart.find((item) => item.productId === productId);

		if (!existingItem) return { cartId: null, productId, removed: false };

		if (removeAll || existingItem.quantity <= quantity) {
			// Remove completely
			cart = cart.filter((item) => item.productId !== productId);
		} else {
			// Decrease quantity
			existingItem.quantity = existingItem.quantity - quantity;
		}

		setGuestCart(cart);

		return { cartId: null, productId, removed: true };
	}
}
