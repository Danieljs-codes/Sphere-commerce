import { adminMiddleware, isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import { discount } from "@server/db/schema";
import { getCartSubtotal } from "@server/utils/discounts";
import { createServerFn } from "@tanstack/react-start";
import { isAfter, isBefore, startOfDay } from "date-fns";
import { asc, eq, sql } from "drizzle-orm";
import z from "zod/v4";
import { createDiscountSchema } from "@/lib/schema";

export const $getDiscounts = createServerFn()
	.validator(
		z.object({
			page: z.number().min(1).default(1).catch(1),
			limit: z
				.union([
					z.literal(10),
					z.literal(20),
					z.literal(30),
					z.literal(40),
					z.literal(50),
				])
				.default(10)
				.catch(10),
		}),
	)
	.middleware([adminMiddleware])
	.handler(async ({ data }) => {
		const offset = (data.page - 1) * data.limit;

		const items = await db
			.select()
			.from(discount)
			.orderBy(asc(discount.createdAt))
			.limit(data.limit)
			.offset(offset);

		// aggregate counts in a single query to avoid multiple DB roundtrips
		const now = Math.floor(Date.now() / 1000);

		const [aggRow] = await db
			.select({
				total: sql<number>`count(*)`,
				active: sql<number>`sum(case when ${discount.isActive} = 1 then 1 else 0 end)`,
				notStarted: sql<number>`sum(case when ${discount.startsAt} > ${now} then 1 else 0 end)`,
				expired: sql<number>`sum(case when ${discount.expiresAt} IS NOT NULL AND ${discount.expiresAt} < ${now} then 1 else 0 end)`,
			})
			.from(discount);

		const total = Number(aggRow?.total ?? 0);
		const activeCount = Number(aggRow?.active ?? 0);
		const notStartedCount = Number(aggRow?.notStarted ?? 0);
		const expiredCount = Number(aggRow?.expired ?? 0);

		const pageCount = Math.max(1, Math.ceil(total / data.limit));

		return {
			items,
			page: data.page,
			limit: data.limit,
			total,
			pageCount,
			counts: {
				total,
				active: activeCount,
				notStarted: notStartedCount,
				expired: expiredCount,
			},
		};
	});

export const $createDiscount = createServerFn()
	.middleware([adminMiddleware])
	.validator(createDiscountSchema)
	.handler(async ({ data }) => {
		const newDiscount = {
			code: data.code,
			name: data.name,
			description: data.description,
			type: data.type,
			value: data.value,
			maximumDiscountAmount: data.maximumDiscountAmount ?? null,
			minimumOrderAmount: data.minimumOrderAmount ?? null,
			usageLimit: data.usageLimit ?? null,
			startsAt: data.dates.startsAt,
			expiresAt: data.dates.expiresAt ?? null,
		};

		const [createdDiscount] = await db
			.insert(discount)
			.values({ ...newDiscount, isActive: true })
			.returning({
				id: discount.id,
			});

		return createdDiscount;
	});

export const $validateDiscountCode = createServerFn()
	.middleware([isAuthenticatedMiddleware])
	.validator(
		z.object({
			code: z.string().min(2).max(100),
		}),
	)
	.handler(async ({ data, context }) => {
		const foundDiscount = await db
			.select()
			.from(discount)
			.where(eq(discount.code, data.code))
			.limit(1);

		if (!foundDiscount || foundDiscount.length === 0) {
			throw new Error("Discount code not found");
		}

		const retrievedDiscount = foundDiscount[0];

		if (!retrievedDiscount.isActive) {
			throw new Error("Discount code is not active");
		}

		if (
			retrievedDiscount.startsAt &&
			isBefore(startOfDay(new Date()), startOfDay(retrievedDiscount.startsAt))
		) {
			throw new Error("Discount code is not yet active");
		}

		if (
			retrievedDiscount.expiresAt &&
			isAfter(startOfDay(new Date()), startOfDay(retrievedDiscount.expiresAt))
		) {
			throw new Error("Discount code has expired");
		}

		if (
			retrievedDiscount.usageLimit &&
			retrievedDiscount.usageCount >= retrievedDiscount.usageLimit
		) {
			throw new Error("Discount code has reached its usage limit");
		}

		const { subtotal } = await getCartSubtotal(context.session.user.id);

		if (
			retrievedDiscount.minimumOrderAmount &&
			subtotal < retrievedDiscount.minimumOrderAmount
		) {
			throw new Error("Discount code is not applicable");
		}

		let discountAmount = 0;
		if (retrievedDiscount.type === "percentage") {
			discountAmount = Math.floor((subtotal * retrievedDiscount.value) / 100);
		} else {
			discountAmount = retrievedDiscount.value;
		}

		if (retrievedDiscount.maximumDiscountAmount) {
			discountAmount = Math.min(
				discountAmount,
				retrievedDiscount.maximumDiscountAmount,
			);
		}

		discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

		return {
			ok: true,
			discountAmount,
		};
	});
