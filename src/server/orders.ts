import { adminMiddleware, authMiddleware } from "@server/auth";
import { db } from "@server/db";
import { order, orderItem, product, user } from "@server/db/schema";
import { notFound } from "@tanstack/react-router";
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
	.handler(async ({ data }) => {
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

// Returns the order details, all order items, and user information
export const $getOrder = createServerFn()
	.validator(
		z.object({
			id: z.string().min(1, "Order ID is required"),
		}),
	)
	.middleware([adminMiddleware])
	.handler(async ({ data }) => {
		// Fetch the order with user info
		const orderWithItems = await db
			.select({
				orderId: order.id,
				orderNumber: order.orderNumber,
				subtotal: order.subtotal,
				discountAmount: order.discountAmount,
				shippingFee: order.shippingFee,
				taxAmount: order.taxAmount,
				total: order.total,
				discountId: order.discountId,
				discountCode: order.discountCode,
				status: order.status,
				shippingAddress: order.shippingAddress,
				paymentReference: order.paymentReference,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				shippedAt: order.shippedAt,
				deliveredAt: order.deliveredAt,
				userId: user.id,
				userName: user.name,
				userEmail: user.email,

				itemId: orderItem.id,
				productId: orderItem.productId,
				productName: orderItem.productName,
				quantity: orderItem.quantity,
				pricePerItem: orderItem.pricePerItem,
				totalPrice: orderItem.totalPrice,
				productImages: product.images,
			})
			.from(order)
			.innerJoin(user, eq(order.userId, user.id))
			.leftJoin(orderItem, eq(orderItem.orderId, order.id))
			.leftJoin(product, eq(orderItem.productId, product.id))
			.where(eq(order.id, data.id));

		if (!orderWithItems.length) {
			throw notFound({
				data: {
					message: "Order not found",
				},
			});
		}

		const head = orderWithItems[0];

		const isItemRow = (
			row: (typeof orderWithItems)[number],
		): row is (typeof orderWithItems)[number] & {
			itemId: string;
			productId: string;
			productName: string;
			quantity: number;
			itemStatus: "processing" | "shipped" | "delivered";
			pricePerItem: number;
			totalPrice: number;
		} => row.itemId !== null;

		const result = {
			orderId: head.orderId,
			orderNumber: head.orderNumber,
			subtotal: head.subtotal,
			discountAmount: head.discountAmount,
			shippingFee: head.shippingFee,
			taxAmount: head.taxAmount,
			total: head.total,
			discountId: head.discountId,
			discountCode: head.discountCode,
			status: head.status,
			shippingAddress: head.shippingAddress,
			paymentReference: head.paymentReference,
			createdAt: head.createdAt,
			updatedAt: head.updatedAt,
			shippedAt: head.shippedAt,
			deliveredAt: head.deliveredAt,
			userId: head.userId,
			userName: head.userName,
			userEmail: head.userEmail,
			items: orderWithItems.filter(isItemRow).map((row) => ({
				id: row.itemId,
				productId: row.productId,
				productName: row.productName,
				// Convenience fields expected by UI
				name: row.productName,
				images: row.productImages! ?? [],
				quantity: row.quantity,
				status: row.itemStatus,
				pricePerItem: row.pricePerItem,
				totalPrice: row.totalPrice,
			})),
		};

		return result;
	});

export const $markAsShipped = createServerFn()
	.middleware([adminMiddleware])
	.validator(
		z.object({
			id: z.string().min(1, "Order ID is required"),
		}),
	)
	.handler(async ({ data }) => {
		await db
			.update(order)
			.set({ status: "shipped" })
			.where(eq(order.id, data.id));

		return {
			success: true,
			message: "Order marked as shipped successfully",
		};
	});

export const $markAsDelivered = createServerFn()
	.middleware([adminMiddleware])
	.validator(
		z.object({
			id: z.string().min(1, "Order ID is required"),
		}),
	)
	.handler(async ({ data }) => {
		await db
			.update(order)
			.set({ status: "delivered" })
			.where(eq(order.id, data.id));

		return {
			success: true,
			message: "Order marked as delivered successfully",
		};
	});
