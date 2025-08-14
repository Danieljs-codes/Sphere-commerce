/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { order, orderItem, product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import z from "zod/v4";

type DailyRow = {
	type: "daily";
	day: number;
	earnings: number;
	productId: null;
	productName: null;
	quantity: null;
	revenue: null;
};

type ProductRow = {
	type: "product";
	day: null;
	earnings: null;
	productId: string;
	productName: string;
	quantity: number;
	revenue: number;
};

type SalesRow = DailyRow | ProductRow;

export const $getOverviewData = createServerFn()
	.middleware([adminMiddleware])
	.handler(async () => {
		const now = new Date();
		const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

		const since = new Date(now.getTime() - THIRTY_DAYS_MS);
		const prevSince = new Date(since.getTime() - THIRTY_DAYS_MS);

		const start = performance.now();
		const [metrics] = await db
			.select({
				// Orders & revenue
				revenueCurrent: sql<number>`
        SUM(CASE WHEN ${order.createdAt} >= ${since.toISOString()} THEN ${order.total} ELSE 0 END)
      `,
				revenuePrev: sql<number>`
        SUM(CASE WHEN ${order.createdAt} >= ${prevSince.toISOString()} 
                 AND ${order.createdAt} < ${since.toISOString()}
            THEN ${order.total} ELSE 0 END)
      `,
				ordersCurrent: sql<number>`
        SUM(CASE WHEN ${order.createdAt} >= ${since.toISOString()} THEN 1 ELSE 0 END)
      `,
				ordersPrev: sql<number>`
        SUM(CASE WHEN ${order.createdAt} >= ${prevSince.toISOString()} 
                 AND ${order.createdAt} < ${since.toISOString()}
            THEN 1 ELSE 0 END)
      `,

				// Products
				productsTotal: sql<number>`(SELECT COUNT(*) FROM ${product})`,
				productsAdded: sql<number>`
        (SELECT COUNT(*) FROM ${product}
         WHERE ${product.createdAt} >= ${since.toISOString()})
      `,
			})
			.from(order);
		console.log(`Query took ${performance.now() - start}ms`);

		const makeChange = (curr: number, prev: number) => {
			const delta = curr - prev;
			const pct = prev === 0 ? null : (delta / prev) * 100;
			const direction: "up" | "down" | "flat" =
				delta > 0 ? "up" : delta < 0 ? "down" : "flat";
			return { pct, delta, direction };
		};

		return {
			revenue30d: metrics.revenueCurrent || 0,
			revenueChange: makeChange(
				metrics.revenueCurrent || 0,
				metrics.revenuePrev || 0,
			),
			ordersCount30d: metrics.ordersCurrent || 0,
			ordersChange: makeChange(
				metrics.ordersCurrent || 0,
				metrics.ordersPrev || 0,
			),
			productsCountTotal: metrics.productsTotal || 0,
			productsAdded30d: metrics.productsAdded || 0,
			since,
			prevSince,
		};
	});

export const $getRecentSalesData = createServerFn()
	.middleware([adminMiddleware])
	.validator(
		z.object({
			from: z.string().datetime({ message: "Must be a valid ISO date string" }),
			to: z.string().datetime({ message: "Must be a valid ISO date string" }),
		}),
	)
	.handler(async ({ data }) => {
		const fromDate = new Date(data.from);
		const toDate = new Date(data.to);

		const [rawDailyEarnings, topProducts] = await Promise.all([
			db
				.select({
					date: sql<string>`date(${order.createdAt})`.as("date"),
					total: sql<number>`sum(${order.total})`.as("total"),
				})
				.from(order)
				.where(
					and(gte(order.createdAt, fromDate), lte(order.createdAt, toDate)),
				)
				.groupBy(sql`date(${order.createdAt})`)
				.orderBy(sql`date(${order.createdAt})`),

			db
				.select({
					productId: product.id,
					name: product.name,
					totalSold: sql<number>`sum(${orderItem.quantity})`.as("totalSold"),
				})
				.from(orderItem)
				.innerJoin(product, eq(orderItem.productId, product.id))
				.innerJoin(order, eq(orderItem.orderId, order.id))
				.where(
					and(gte(order.createdAt, fromDate), lte(order.createdAt, toDate)),
				)
				.groupBy(product.id, product.name)
				.orderBy(sql`sum(${orderItem.quantity}) desc`)
				.limit(5),
		]);

		// Fill missing dates
		const dailyEarningsMap = new Map(
			rawDailyEarnings.map((d) => [d.date, Number(d.total)]),
		);

		const filledDailyEarnings: { date: string; total: number }[] = [];
		const current = new Date(fromDate);

		while (current <= toDate) {
			const dateStr = current.toISOString();
			filledDailyEarnings.push({
				date: dateStr,
				total: dailyEarningsMap.get(dateStr) ?? 0,
			});
			current.setDate(current.getDate() + 1);
		}

		return {
			dailyEarnings: filledDailyEarnings,
			topProducts,
		};
	});
