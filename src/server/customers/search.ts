import { db } from "@server/db";
import { product } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import z from "zod/v4";

export const $searchProducts = createServerFn()
	.validator(
		z.object({
			search: z.string().min(1, "Search is required"),
		}),
	)
	.handler(async ({ data }) => {
		const q = data.search.trim();

		const pattern = `%${q}%`;

		// Case-insensitive includes search across key fields; only active products
		const whereClause = sql`
      ${product.status} = 'active' AND (
        LOWER(${product.name}) LIKE LOWER(${pattern})
        OR LOWER(${product.description}) LIKE LOWER(${pattern})
        OR LOWER(COALESCE(${product.metaTitle}, '')) LIKE LOWER(${pattern})
        OR LOWER(COALESCE(${product.metaDescription}, '')) LIKE LOWER(${pattern})
        OR EXISTS (
          SELECT 1
          FROM json_each(${product.tags}) je
          WHERE LOWER(COALESCE(je.value, '')) LIKE LOWER(${pattern})
        )
      )
    `;

		const results = await db
			.select()
			.from(product)
			.where(whereClause)
			.orderBy(sql`LOWER(${product.name})`)
			.limit(20);

		return results;
	});
