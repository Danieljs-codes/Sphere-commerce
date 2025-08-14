import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { categories } from "@server/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";

export const $getExistingCategories = createServerFn()
	.middleware([adminMiddleware])
	.handler(async () => {
		const categoriesRows = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				description: categories.description,
				parentId: categories.parentId,
				imageId: categories.imageId,
				createdAt: categories.createdAt,
			})
			.from(categories)
			.orderBy(asc(categories.createdAt));

		return categoriesRows;
	});
