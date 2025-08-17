import { db } from "@server/db";
import { product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";

export const $getHighestAndLowestPrice = createServerFn().handler(async () => {
	const now = new Date();

	const [row] = await db
		.select({
			lowestPrice: sql<number>`min(${product.price})`,
			highestPrice: sql<number>`max(${product.price})`,
		})
		.from(product)
		.where(
			and(
				eq(product.status, "active"),
				gt(product.stock, 0),
				or(isNull(product.publishedAt), lte(product.publishedAt, now)),
			),
		);

	return {
		lowestPrice: row?.lowestPrice ?? null,
		highestPrice: row?.highestPrice ?? null,
	};
});
