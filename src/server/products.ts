import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import z from "zod/v4";

export const $getProductStats = createServerFn()
	.middleware([adminMiddleware])
	.handler(async () => {
		const productCounts = await db
			.select({
				totalProducts: sql<number>`count(*)`.as("totalProducts"),
				activeProducts:
					sql<number>`COALESCE(SUM(CASE WHEN ${product.status} = 'active' THEN 1 ELSE 0 END), 0)`.as(
						"activeProducts",
					),
				inactiveProducts: sql<number>`
    COALESCE(SUM(CASE WHEN ${product.status} IN ('draft', 'inactive', 'archived') THEN 1 ELSE 0 END), 0)
  `.as("inactiveProducts"),
				scheduledProducts: sql<number>`
    COALESCE(SUM(CASE WHEN ${product.status} = 'scheduled' THEN 1 ELSE 0 END), 0)
  `.as("scheduledProducts"),
			})
			.from(product);

		return (
			productCounts[0] || {
				totalProducts: 0,
				activeProducts: 0,
				inactiveProducts: 0,
				scheduledProducts: 0,
			}
		);
	});

export const $getProductPage = createServerFn()
	.validator(
		z.object({
			offset: z.number(),
			numItems: z.number().int().positive(),
			filter: z.enum(["active", "draft", "scheduled"]).optional(),
		}),
	)
	.middleware([adminMiddleware])
	.handler(async ({ context, data }) => {
		// 2. Base WHERE clause
		const { filter, offset, numItems } = data;
		const whereClause = eq(product.sellerId, context.session.user.id);

		// 3. Fetch products with pagination (+1 to check next page)
		const results = await db
			.select()
			.from(product)
			.where(filter ? and(whereClause, eq(product.status, filter)) : undefined)
			.orderBy(product.createdAt)
			.limit(numItems + 1)
			.offset(offset);

		// 4. hasNextPage calculation
		const hasNextPage = results.length > numItems;

		return {
			page: results.slice(0, numItems),
			hasNextPage,
		};
	});
