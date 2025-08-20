import { db } from "@server/db";
import { cart, cartItems, discount } from "@server/db/schema";
import { isAfter, isBefore, startOfDay } from "date-fns";
import type { SQL } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";

/**
 * Returns aggregated cart subtotal and meta for a user's cart
 */
export const getCartSubtotal = async (userId: string) => {
	const result = await db
		.select({
			cartId: cart.id,
			userId: cart.userId,
			subtotal: sql<number>`COALESCE(SUM(${cartItems.quantity} * ${cartItems.priceAtAdd}), 0)`,
			itemCount: sql<number>`COUNT(${cartItems.id})`,
			discountId: cart.discountId,
			discountCode: cart.discountCode,
		})
		.from(cart)
		.leftJoin(cartItems, eq(cart.id, cartItems.cartId))
		.where(eq(cart.userId, userId))
		.groupBy(cart.id, cart.userId, cart.discountId, cart.discountCode);

	return result[0];
};

type CalculateResult =
	| {
			ok: true;
			discountAmount: number;
	  }
	| {
			ok: false;
			error: string;
	  };

/**
 * Calculate discount amount for a discount record and subtotal.
 * Ensures caps and that discount doesn't exceed subtotal.
 */
type DiscountRecord = {
	id: string;
	code: string;
	isActive: boolean;
	startsAt?: Date | null;
	expiresAt?: Date | null;
	usageLimit?: number | null;
	usageCount?: number | null;
	minimumOrderAmount?: number | null;
	maximumDiscountAmount?: number | null;
	type: "percentage" | "fixed" | string;
	value: number;
};

export const calculateDiscountAmount = (
	discountRecord: DiscountRecord,
	subtotal: number,
): number => {
	let discountAmount = 0;
	if (discountRecord.type === "percentage") {
		discountAmount = Math.floor((subtotal * discountRecord.value) / 100);
	} else {
		discountAmount = discountRecord.value;
	}

	if (discountRecord.maximumDiscountAmount) {
		discountAmount = Math.min(
			discountAmount,
			discountRecord.maximumDiscountAmount,
		);
	}

	discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

	return discountAmount;
};

/**
 * Validate a discount code by id/record and subtotal/context and return calculated discount or error
 */
export const validateDiscountAndCalculateAmount = async (
	codeOrId: { code?: string; id?: string },
	userId: string,
): Promise<CalculateResult> => {
	// Build where clause safely to avoid passing undefined to eq
	let whereClause: SQL | undefined;
	if (codeOrId.code) {
		whereClause = eq(discount.code, codeOrId.code);
	} else if (codeOrId.id) {
		whereClause = eq(discount.id, codeOrId.id);
	} else {
		return { ok: false, error: "No discount identifier provided" };
	}

	const found = await db.select().from(discount).where(whereClause).limit(1);

	if (!found || found.length === 0) {
		return { ok: false, error: "Discount code not found" };
	}

	const retrievedDiscount = found[0];

	if (!retrievedDiscount.isActive) {
		return { ok: false, error: "Discount code is not active" };
	}

	if (
		retrievedDiscount.startsAt &&
		isBefore(startOfDay(new Date()), startOfDay(retrievedDiscount.startsAt))
	) {
		return { ok: false, error: "Discount code is not yet active" };
	}

	if (
		retrievedDiscount.expiresAt &&
		isAfter(startOfDay(new Date()), startOfDay(retrievedDiscount.expiresAt))
	) {
		return { ok: false, error: "Discount code has expired" };
	}

	if (
		retrievedDiscount.usageLimit &&
		retrievedDiscount.usageCount >= retrievedDiscount.usageLimit
	) {
		return { ok: false, error: "Discount code has reached its usage limit" };
	}

	const cartRow = await getCartSubtotal(userId);
	const subtotal = cartRow?.subtotal ?? 0;

	if (
		retrievedDiscount.minimumOrderAmount &&
		subtotal < retrievedDiscount.minimumOrderAmount
	) {
		return { ok: false, error: "Discount code is not applicable" };
	}

	const discountAmount = calculateDiscountAmount(retrievedDiscount, subtotal);

	return { ok: true, discountAmount };
};

export default {
	getCartSubtotal,
	calculateDiscountAmount,
	validateDiscountAndCalculateAmount,
};
