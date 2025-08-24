import { db } from "@server/db";
import { categories, product, review, user } from "@server/db/schema";
import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt, isNull, lte, ne, or, sql } from "drizzle-orm";
import z from "zod/v4";
import { setFlashCookie } from "@/types/utils";

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

// Should support the query params
// Should support pagination
export const $getProducts = createServerFn()
	.validator(
		z.object({
			minPrice: z.number().optional(), // in major units (e.g., ₦)
			maxPrice: z.number().optional(), // in major units (e.g., ₦)
			category: z.array(z.string()).optional().default([]), // lower-cased names
			sort: z
				.enum(["high-to-low", "low-to-high"]) // price sort
				.optional()
				.default("high-to-low"),
			page: z.number().int().positive().optional().default(1),
			limit: z.number().int().positive().max(100).optional().default(24),
		}),
	)
	.handler(async ({ data }) => {
		const now = new Date();
		const page = data.page ?? 1;
		const limit = data.limit ?? 24;
		const offset = (page - 1) * limit;

		// Convert prices to the stored minor unit (kobo)
		const minPrice =
			typeof data.minPrice === "number"
				? Math.round(data.minPrice * 100)
				: undefined;
		const maxPrice =
			typeof data.maxPrice === "number"
				? Math.round(data.maxPrice * 100)
				: undefined;

		// Base visibility constraints for customer-facing products
		let where = and(
			eq(product.status, "active"),
			gt(product.stock, 0),
			or(isNull(product.publishedAt), lte(product.publishedAt, now)),
		);

		// Price filters
		if (typeof minPrice === "number") {
			where = and(where, sql`${product.price} >= ${minPrice}`);
		}
		if (typeof maxPrice === "number") {
			where = and(where, sql`${product.price} <= ${maxPrice}`);
		}

		const hasCategories = (data.category ?? []).length > 0;

		const [countRow] = await (hasCategories
			? db
					.select({ total: sql<number>`count(*)` })
					.from(product)
					.innerJoin(categories, eq(categories.id, product.categoryId))
					.where(
						and(
							where,
							sql`LOWER(${categories.name}) IN (${sql.join(
								(data.category ?? []).map((c) => c.toLowerCase()),
								sql`, `,
							)})`,
						),
					)
			: db.select({ total: sql<number>`count(*)` }).from(product).where(where));

		const total = countRow?.total ?? 0;

		// Fetch page items
		const orderSql =
			data.sort === "low-to-high"
				? sql`${product.price} ASC`
				: sql`${product.price} DESC`;

		// First get the product IDs we need with all the filters applied
		const filteredProductIds = await (() => {
			const query = db.select({ id: product.id }).from(product);

			if (hasCategories) {
				query
					.innerJoin(categories, eq(categories.id, product.categoryId))
					.where(
						and(
							where,
							sql`LOWER(${categories.name}) IN (${sql.join(
								(data.category ?? []).map((c) => c.toLowerCase()),
								sql`, `,
							)})`,
						),
					);
			} else {
				query.where(where);
			}

			return query.orderBy(orderSql).limit(limit).offset(offset);
		})();

		// If no products match the filters, return empty array
		if (filteredProductIds.length === 0) {
			return {
				items: [],
				page,
				limit,
				total: 0,
				pages: 0,
				hasNext: false,
				hasPrev: page > 1,
			};
		}

		// Then fetch the full product data with category names for the filtered IDs
		const result = await db
			.select({
				product: product,
				category: {
					name: categories.name,
				},
			})
			.from(product)
			.leftJoin(categories, eq(categories.id, product.categoryId))
			.where(
				sql`${product.id} IN (${sql.join(
					filteredProductIds.map((p) => p.id),
					sql`, `,
				)})`,
			)
			.orderBy(orderSql);

		// Transform the result to include categoryName on each product
		const items = result.map((row) => ({
			...row.product,
			categoryName: row.category?.name ?? null,
		}));

		// Define the return type with the additional categoryName field
		type ProductWithCategory = typeof product.$inferSelect & {
			categoryName: string | null;
		};

		return {
			items: items as unknown as ProductWithCategory[],
			page,
			limit,
			total,
			pages: Math.max(1, Math.ceil(total / limit)),
			hasNext: offset + items.length < total,
			hasPrev: page > 1,
		};
	});

export const $getProductById = createServerFn()
	.validator(
		z.object({
			id: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		const [validProduct] = await db
			.select()
			.from(product)
			.leftJoin(categories, eq(categories.id, product.categoryId))
			.where(and(eq(product.id, data.id), eq(product.status, "active")))
			.limit(1);

		if (!validProduct) {
			setFlashCookie({
				intent: "error",
				message: "Product not found",
			});

			throw notFound();
		}

		if (validProduct.product.stock <= 0) {
			setFlashCookie({
				intent: "error",
				message: "Product is out of stock",
			});

			throw redirect({
				to: "/store",
			});
		}

		// Get 4 product from the same category, excluding the current product
		const relatedProducts = await db
			.select()
			.from(product)
			.where(
				and(
					validProduct.product.categoryId
						? eq(product.categoryId, validProduct.product.categoryId)
						: undefined,
					ne(product.id, validProduct.product.id),
				),
			)
			.limit(4);

		// Get reviews for the valid product
		const reviews = await db
			.select()
			.from(review)
			.innerJoin(user, eq(user.id, review.userId))
			.where(eq(review.productId, validProduct.product.id))
			.orderBy(desc(review.createdAt))
			.limit(5);

		const formattedReviews = reviews.map((review) => ({
			id: review.review.id,
			rating: review.review.rating,
			comment: review.review.comment,
			createdAt: review.review.createdAt,
			images: review.review.images,
			author: {
				id: review.user.id,
				name: review.user.name,
				avatar: review.user.image,
				image: review.user.image,
			},
		}));

		return {
			product: validProduct.product,
			relatedProducts,
			reviews: formattedReviews,
			category: validProduct.categories,
		};
	});
