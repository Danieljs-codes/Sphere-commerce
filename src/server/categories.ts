import { createId } from "@paralleldrive/cuid2";
import { adminMiddleware } from "@server/auth";
import { db } from "@server/db";
import { categories } from "@server/db/schema";
import { utapi } from "@server/uploadthing";
import { createServerFn } from "@tanstack/react-start";
import { asc, sql } from "drizzle-orm";
import sharp from "sharp";
import z from "zod/v4";

export const $getExistingCategories = createServerFn().handler(async () => {
	const categoriesRows = await db
		.select({
			id: categories.id,
			name: categories.name,
			slug: categories.slug,
			description: categories.description,
			parentId: categories.parentId,
			image: categories.image,
			createdAt: categories.createdAt,
		})
		.from(categories)
		.orderBy(asc(categories.createdAt));

	return categoriesRows;
});

export const $getExistingCategoriesWithPagination = createServerFn()
	.middleware([adminMiddleware])
	.validator(
		z.object({
			page: z.number().min(1).default(1).catch(1),
			limit: z
				.union([
					z.literal(10),
					z.literal(20),
					z.literal(30),
					z.literal(40),
					z.literal(50),
				])
				.default(10)
				.catch(10),
		}),
	)
	.handler(async ({ data: { page, limit } }) => {
		const offset = (page - 1) * limit;

		const items = await db
			.select({
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
				description: categories.description,
				parentId: categories.parentId,
				image: categories.image,
				createdAt: categories.createdAt,
			})
			.from(categories)
			.orderBy(asc(categories.createdAt))
			.limit(limit)
			.offset(offset);

		const [countRow] = await db
			.select({ count: sql<number>`count(*)` })
			.from(categories);
		const total = Number(countRow?.count ?? 0);
		const pageCount = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			page,
			limit,
			total,
			pageCount,
		};
	});

// Only one image

const categoryForm = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	file: z.file(),
});
export const $createCategory = createServerFn({
	method: "POST",
})
	.middleware([adminMiddleware])
	.validator(z.instanceof(FormData))
	.handler(async ({ data }) => {
		const formData = Object.fromEntries(data.entries());

		const parsedData = categoryForm.safeParse(formData);

		if (!parsedData.success) {
			throw new Error("Validation failed");
		}

		const { name, description, file } = parsedData.data;

		console.log(name, description, file, file instanceof File);

		const inputBuffer = Buffer.from(await file.arrayBuffer());

		if (!inputBuffer) {
			throw new Error("Failed to process image");
		}

		// Resize main image
		const outputBuffer = await sharp(inputBuffer)
			.resize({ width: 1200 })
			.webp({ quality: 80 })
			.toBuffer();

		// Convert Buffer back to File for UploadThing
		const uint8 = new Uint8Array(outputBuffer);
		const processedFile = new File([uint8], file.name, {
			type: "image/webp",
		});

		const uploadedFile = await utapi.uploadFiles(processedFile);

		if (uploadedFile.error) {
			throw new Error("Failed to upload image");
		}

		// Create category
		await db.insert(categories).values({
			name,
			description,
			slug: createId(),
			image: uploadedFile.data.ufsUrl,
			parentId: null,
		});

		return {
			success: true,
			message: "Category created successfully",
		};
	});
