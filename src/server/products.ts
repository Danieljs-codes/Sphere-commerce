import { createId } from "@paralleldrive/cuid2";
import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { product } from "@server/db/schema";
import { utapi } from "@server/uploadthing";
import { createServerFn } from "@tanstack/react-start";
import { encode } from "blurhash";
import { and, count, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import z from "zod/v4";
import { productFormBackendSchema } from "@/lib/schema";

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
		const [totalProducts] = await db
			.select({ count: count() })
			.from(product)
			.where(
				filter ? and(whereClause, eq(product.status, filter)) : whereClause,
			);

		// 5. Return results and hasNextPage

		return {
			page: results.slice(0, numItems),
			hasNextPage,
			totalProducts: totalProducts.count,
		};
	});

// Helper function to process images
async function processImages(files: File[]) {
	const processedImages: File[] = [];
	const blurhashes: string[] = [];

	await Promise.all(
		files.map(async (file) => {
			const inputBuffer = Buffer.from(await file.arrayBuffer());
			if (!inputBuffer) return;

			const metadata = await sharp(inputBuffer).metadata();

			let transformer = sharp(inputBuffer);

			// Resize only if width > 1200
			if (metadata.width && metadata.width > 1200) {
				transformer = transformer.resize({ width: 1200 });
			}

			// Convert to WebP while preserving alpha
			const outputBuffer = await transformer
				.webp({ quality: metadata.width > 1200 ? 80 : 100 })
				.toBuffer();

			// Generate small version for blurhash (32x32)
			const { data: raw, info } = await sharp(inputBuffer)
				.resize(32, 32, { fit: "inside" })
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			const hash = encode(
				new Uint8ClampedArray(raw),
				info.width,
				info.height,
				4,
				4,
			);

			blurhashes.push(hash);

			// Convert to File for UploadThing
			const processedFile = new File(
				[new Uint8Array(outputBuffer)],
				file.name,
				{
					type: "image/webp",
				},
			);

			processedImages.push(processedFile);
		}),
	);

	return { processedImages, blurhashes };
}

export const $createProduct = createServerFn({
	method: "POST",
})
	.middleware([adminMiddleware])
	.validator(z.instanceof(FormData))
	.handler(async ({ data, context }) => {
		// Collect all fields, grouping repeated keys into arrays
		const obj: Record<string, unknown> = {};
		for (const [key, value] of data.entries()) {
			if (obj[key] !== undefined) {
				if (Array.isArray(obj[key])) {
					(obj[key] as unknown[]).push(value);
				} else {
					obj[key] = [obj[key], value];
				}
			} else {
				obj[key] = value;
			}
		}

		if (obj.images && !Array.isArray(obj.images)) {
			obj.images = [obj.images];
		}

		// Validate with backend schema
		const result = productFormBackendSchema.safeParse(obj);
		if (!result.success) {
			throw new Error("Validation failed");
		}
		const parsed = result.data;

		// Process images with sharp & generate blurhash
		const { processedImages, blurhashes } = await processImages(parsed.images);

		// Upload processed files to UploadThing
		const uploadedFiles = await utapi.uploadFiles(processedImages);

		const imagesWithHash = uploadedFiles.map((file, index) => ({
			url: file.data!.ufsUrl,
			blurhash: blurhashes[index],
		}));

		// Insert into database
		await db.insert(product).values({
			name: parsed.name,
			slug: createId(),
			description: parsed.description,
			categoryId: parsed.categoryId,
			price: parsed.price * 100,
			stock: parsed.stockCount,
			sellerId: context.session.user.id,
			images: imagesWithHash,
			tags: parsed.tags as string[],
			metaTitle: parsed.metaTitle,
			metaDescription: parsed.metaDescription,
			status: parsed.status,
			publishedAt: new Date(),
		});

		return {
			success: true,
			message: "Product created successfully",
		};
	});

export const $archiveProduct = createServerFn({
	method: "POST",
})
	.middleware([adminMiddleware])
	.validator(
		z.object({
			productId: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		const { productId } = data;

		// Archive the product
		await db
			.update(product)
			.set({ status: "archived" })
			.where(eq(product.id, productId));

		return {
			success: true,
			message: "Product archived successfully",
		};
	});

export const $restoreProduct = createServerFn({
	method: "POST",
})
	.middleware([adminMiddleware])
	.validator(
		z.object({
			productId: z.string().min(1),
		}),
	)
	.handler(async ({ data }) => {
		const { productId } = data;

		// Archive the product
		await db
			.update(product)
			.set({ status: "active" })
			.where(eq(product.id, productId));

		return {
			success: true,
			message: "Product restored successfully",
		};
	});
