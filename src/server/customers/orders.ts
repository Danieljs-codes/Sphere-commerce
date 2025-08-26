import { isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import {
	type Discount,
	discount,
	type Order,
	type OrderItem,
	order,
	orderItem,
	type Product,
	product,
} from "@server/db/schema";
import { decodeCursor, encodeCursor } from "@server/utils/orders";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, lt, or } from "drizzle-orm";
import z from "zod/v4";

export const $getUserOrderHistory = createServerFn()
	.middleware([isAuthenticatedMiddleware])
	.validator(
		z.object({
			cursor: z.string().optional().nullable().catch(undefined),
			limit: z.number().min(1).max(100).default(10),
		}),
	)
	.handler(async ({ data, context }) => {
		const { cursor, limit } = data;

		const decodedCursor = cursor ? decodeCursor(cursor) : null;

		const rawOrders = await db
			.select()
			.from(order)
			.innerJoin(orderItem, eq(order.id, orderItem.orderId))
			.innerJoin(product, eq(orderItem.productId, product.id))
			.leftJoin(discount, eq(order.discountId, discount.id))
			.where(
				decodedCursor
					? and(
							eq(order.userId, context.session.user.id),
							or(
								lt(order.createdAt, new Date(decodedCursor.createdAt)),
								and(
									eq(order.createdAt, new Date(decodedCursor.createdAt)),
									lt(order.id, decodedCursor.id),
								),
							),
						)
					: eq(order.userId, context.session.user.id),
			)
			.orderBy(desc(order.createdAt), desc(order.id))
			.limit(limit + 1);

		// Group into orders
		const grouped = rawOrders.reduce(
			(acc, row) => {
				let existing = acc.find((o) => o.id === row.order.id);
				if (!existing) {
					existing = {
						...row.order,
						discount: row.discount ?? undefined,
						items: [],
					};
					acc.push(existing);
				}
				existing.items.push({
					...row.order_item,
					product: row.product,
				});
				return acc;
			},
			[] as (Order & {
				discount?: Discount;
				items: (OrderItem & { product: Product })[];
			})[],
		);

		const hasMore = grouped.length > limit;
		const orders = grouped.slice(0, limit);

		const last = orders[orders.length - 1];
		const nextCursor = hasMore
			? encodeCursor({ id: last.id, createdAt: last.createdAt.toISOString() })
			: null;

		return { orders, nextCursor, hasMore };
	});
