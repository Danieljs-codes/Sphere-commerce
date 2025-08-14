import { createId } from "@paralleldrive/cuid2";
import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { product } from "@server/db/schema";
import { utapi } from "@server/uploadthing";
import { createServerFn } from "@tanstack/react-start";
import { encode } from "blurhash";
import { File } from "buffer";
import { and, eq, sql } from "drizzle-orm";
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

		return {
			page: results.slice(0, numItems),
			hasNextPage,
		};
	});

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
		const processedImages: File[] = [];
		const blurhashes: string[] = [];
		let imageIndex = 0;

		for (const file of parsed.images as any[]) {
			let inputBuffer: Buffer | undefined;
			const originalName =
				file?.originalname || file?.name || `image_${imageIndex}.jpg`;

			if (file instanceof Buffer) {
				inputBuffer = file;
			} else if (file?.buffer instanceof Buffer) {
				inputBuffer = file.buffer;
			} else if (typeof file.arrayBuffer === "function") {
				inputBuffer = Buffer.from(await file.arrayBuffer());
			}

			if (!inputBuffer) continue;

			// Resize main image
			const outputBuffer = await sharp(inputBuffer)
				.resize({ width: 1200 })
				.webp({ quality: 80 })
				.toBuffer();

			// Generate small version for blurhash (e.g., 32x32)
			const smallBuffer = await sharp(inputBuffer)
				.resize(32, 32, { fit: "inside" })
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			const { data: raw, info } = smallBuffer;

			// Encode Blurhash
			const hash = encode(
				new Uint8ClampedArray(raw),
				info.width,
				info.height,
				4,
				4,
			);

			blurhashes.push(hash);

			// Convert Buffer back to File for UploadThing
			const processedFile = new File([outputBuffer], originalName, {
				type: "image/webp",
			});

			processedImages.push(processedFile);
			imageIndex++;
		}

		// Upload processed files to UploadThing
		const uploadedFiles = await utapi.uploadFiles(processedImages);

		const imagesWithHash = uploadedFiles.map((file, index) => ({
			url: file.data!.ufsUrl,
			blurhash: blurhashes[index],
		}));

		// Generate slug (simple example, you may want to use a slugify library)
		const slug = parsed.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)+/g, "");

		// Insert into database
		// TODO: Handle scheduled products
		await db.insert(product).values({
			name: parsed.name,
			slug: createId(),
			description: parsed.description,
			categoryId: parsed.categoryId,
			price: parsed.price,
			stock: parsed.stockCount,
			sellerId: context.session.user.id,
			images: imagesWithHash,
			tags: parsed.tags,
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
	.handler(async ({ data, context }) => {
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
	.handler(async ({ data, context }) => {
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
