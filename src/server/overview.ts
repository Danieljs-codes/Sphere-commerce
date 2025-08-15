/** biome-ignore-all lint/style/noNonNullAssertion: Yhhh */
import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { order, orderItem, product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import z from "zod/v4";

export const $getOverviewData = createServerFn()
	.middleware([adminMiddleware])
	.handler(async () => {
		const now = new Date();
		const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

		const since = new Date(now.getTime() - THIRTY_DAYS_MS);
		const prevSince = new Date(since.getTime() - THIRTY_DAYS_MS);

		// createdAt is stored as unix epoch (seconds) in the DB — precompute seconds
		const sinceSec = Math.floor(since.getTime() / 1000);
		const prevSinceSec = Math.floor(prevSince.getTime() / 1000);

		const start = performance.now();
		const [metrics] = await db
			.select({
				// Orders & revenue
				revenueCurrent: sql<number>`
	        SUM(CASE WHEN ${order.createdAt} >= ${sinceSec} THEN ${order.total} ELSE 0 END)
	      `,
				revenuePrev: sql<number>`
	        SUM(CASE WHEN ${order.createdAt} >= ${prevSinceSec}
	                 AND ${order.createdAt} < ${sinceSec}
	            THEN ${order.total} ELSE 0 END)
	      `,
				ordersCurrent: sql<number>`
	        SUM(CASE WHEN ${order.createdAt} >= ${sinceSec} THEN 1 ELSE 0 END)
	      `,
				ordersPrev: sql<number>`
	        SUM(CASE WHEN ${order.createdAt} >= ${prevSinceSec}
	                 AND ${order.createdAt} < ${sinceSec}
	            THEN 1 ELSE 0 END)
	      `,

				// Products
				productsTotal: sql<number>`(SELECT COUNT(*) FROM ${product})`,
				productsAdded: sql<number>`
		        (SELECT COUNT(*) FROM ${product}
		         WHERE ${product.createdAt} >= ${sinceSec})
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

		// Normalize to UTC day boundaries to avoid timezone/off-by-one issues.
		// Compute the UTC start of `fromDate` (00:00:00.000) and the UTC end of `toDate` (23:59:59.999)
		const fromUtcStartMs = Date.UTC(
			fromDate.getUTCFullYear(),
			fromDate.getUTCMonth(),
			fromDate.getUTCDate(),
			0,
			0,
			0,
			0,
		);
		const toUtcEndMs = Date.UTC(
			toDate.getUTCFullYear(),
			toDate.getUTCMonth(),
			toDate.getUTCDate(),
			23,
			59,
			59,
			999,
		);

		// createdAt stored as unix epoch seconds in DB — use seconds in SQL comparisons
		const fromSec = Math.floor(fromUtcStartMs / 1000);
		const toSec = Math.floor(toUtcEndMs / 1000);

		const [rawDailyEarnings, topProducts] = await Promise.all([
			db
				.select({
					date: sql<string>`date(${order.createdAt}, 'unixepoch')`.as("date"),
					total: sql<number>`sum(${order.total})`.as("total"),
				})
				.from(order)
				.where(
					sql`${order.createdAt} >= ${fromSec} AND ${order.createdAt} <= ${toSec}`,
				)
				.groupBy(sql`date(${order.createdAt}, 'unixepoch')`)
				.orderBy(sql`date(${order.createdAt}, 'unixepoch')`),

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
					sql`${order.createdAt} >= ${fromSec} AND ${order.createdAt} <= ${toSec}`,
				)
				.groupBy(product.id, product.name)
				.orderBy(sql`sum(${orderItem.quantity}) desc`)
				.limit(5),
		]);

		const dailyEarningsMap = new Map(
			rawDailyEarnings.map((d) => [d.date, Number(d.total)]),
		);

		const filledDailyEarnings: { date: string; total: number }[] = [];
		const iter = new Date(fromUtcStartMs);
		const endMs = toUtcEndMs;

		while (iter.getTime() <= endMs) {
			const dateStr = iter.toISOString().slice(0, 10);
			filledDailyEarnings.push({
				date: dateStr,
				total: dailyEarningsMap.get(dateStr) ?? 0,
			});
			iter.setUTCDate(iter.getUTCDate() + 1);
		}

		return {
			dailyEarnings: filledDailyEarnings,
			topProducts,
		};
	});
