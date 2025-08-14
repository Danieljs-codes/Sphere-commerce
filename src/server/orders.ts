import { authMiddleware } from "@server/auth";
import { db } from "@server/db";
import { order, orderItem, user } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import z from "zod/v4";

export const $getOrders = createServerFn()
	.middleware([authMiddleware])
	.validator(
		z.object({
			page: z.number().min(1).default(1),
			limit: z.number().min(1).max(100).default(10),
			status: z.enum(["processing", "shipped", "delivered"]).optional(),
		}),
	)
	.handler(async ({ context, data }) => {
		const offset = (data.page - 1) * data.limit;

		// Single query to get counts
		const countsResult = await db
			.select({
				totalOrders: sql<number>`COUNT(*)`.as("totalOrders"),
				shippedOrders:
					sql<number>`SUM(CASE WHEN ${order.status} = 'shipped' THEN 1 ELSE 0 END)`.as(
						"shippedOrders",
					),
				processingOrders:
					sql<number>`SUM(CASE WHEN ${order.status} = 'processing' THEN 1 ELSE 0 END)`.as(
						"processingOrders",
					),
				deliveredOrders:
					sql<number>`SUM(CASE WHEN ${order.status} = 'delivered' THEN 1 ELSE 0 END)`.as(
						"deliveredOrders",
					),
				totalMatchingOrders: sql<number>`
					SUM(
						CASE 
							WHEN ${data.status ? sql`${order.status} = ${data.status}` : sql`1=1`} 
							THEN 1 ELSE 0 
						END
					)
				`.as("totalMatchingOrders"),
			})
			.from(order)
			.get();

		const counts = countsResult ?? {
			totalOrders: 0,
			shippedOrders: 0,
			processingOrders: 0,
			deliveredOrders: 0,
			totalMatchingOrders: 0,
		};

		const orders = await db
			.select({
				id: order.id,
				orderNumber: order.orderNumber,
				total: order.total,
				status: order.status,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				shippedAt: order.shippedAt,
				deliveredAt: order.deliveredAt,
				userName: user.name,
				itemCount: sql<number>`COUNT(${orderItem.id})`.as("itemCount"),
			})
			.from(order)
			.innerJoin(user, eq(order.userId, user.id))
			.leftJoin(orderItem, eq(order.id, orderItem.orderId))
			.where(
				data.status && data.status.length > 0
					? eq(order.status, data.status)
					: undefined,
			)
			.groupBy(order.id, user.name)
			.orderBy(desc(order.createdAt))
			.limit(data.limit)
			.offset(offset);

		// Pagination info
		const totalPages = Math.ceil(counts.totalMatchingOrders / data.limit);

		return {
			counts: {
				totalOrders: counts.totalOrders,
				shippedOrders: counts.shippedOrders,
				processingOrders: counts.processingOrders,
				deliveredOrders: counts.deliveredOrders,
			},
			orders,
			pagination: {
				totalPages,
				currentPage: data.page,
				hasNextPage: data.page < totalPages,
				hasPreviousPage: data.page > 1,
				totalItems: counts.totalMatchingOrders,
			},
		};
	});
