import { isAuthenticatedMiddleware } from "@server/auth";
import { db } from "@server/db";
import { order, orderItem, product, review } from "@server/db/schema";
import { utapi } from "@server/uploadthing";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import z from "zod/v4";
import { newReviewSchema } from "@/lib/schema";

const granularSchema = z.object({
	productId: z.string().min(1),
	...newReviewSchema.shape,
});

/**
 * Parse and validate incoming FormData for creating a product review.
 * - Extracts productId, rating, review and image files
 * - Enforces server-side image rules: allowed mime types, max 2MB per file, max 4 images
 * - Returns the parsed & validated object according to `granularSchema`
 *
 * Throws zod.ValidationError on failure.
 */
export async function parseReviewFormData(formData: FormData) {
	const MAX_IMAGES = 4;
	const MAX_SIZE = 2 * 1024 * 1024; // 2MB
	const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

	const productIdRaw = formData.get("productId");
	const ratingRaw = formData.get("rating");
	const reviewRaw = formData.get("review");

	const productId =
		typeof productIdRaw === "string"
			? productIdRaw
			: String(productIdRaw ?? "");
	const rating =
		ratingRaw == null ? undefined : Number(ratingRaw as unknown as string);
	const review =
		typeof reviewRaw === "string" ? reviewRaw : String(reviewRaw ?? "");

	// Collect files submitted under the field name 'image' (supports multiple)
	const rawImages = formData.getAll("image");
	type FileLike = {
		size: number;
		name: string;
		type?: string;
		lastModified?: number;
	};

	const files: File[] = rawImages
		.filter((v): v is File => {
			if (typeof File !== "undefined" && v instanceof File) return true;
			// fallback duck-typing for environments where File may not be global
			return (
				!!v &&
				typeof (v as FileLike).size === "number" &&
				typeof (v as FileLike).name === "string"
			);
		})
		.map((f) => f as File);

	// Filter by allowed type and size
	const validFiles = files.filter(
		(f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE,
	);

	// If there were files dropped that exceed size or type, we trim them silently here
	// and rely on zod validation (or this function's trimming) to enforce final constraints.
	const images = validFiles.slice(0, MAX_IMAGES);

	const parsed = granularSchema.parse({
		productId,
		rating,
		review,
		image: images,
	});

	return parsed;
}

/* updateProductReviewMetrics is defined inside the server handler below so it can be
	called with either the top-level `db` or a transaction client without type-mismatch issues. */

export const $createProductReview = createServerFn({
	method: "POST",
})
	.middleware([isAuthenticatedMiddleware])
	.validator(z.instanceof(FormData))
	.handler(async ({ context, data }) => {
		// --- small helper functions for clarity ---
		const user = context.session.user;

		const parsed = await parseReviewFormData(data as unknown as FormData);

		async function ensureUserOrdered() {
			const rows = await db
				.select()
				.from(orderItem)
				.innerJoin(order, eq(orderItem.orderId, order.id))
				.where(
					and(
						eq(order.userId, user.id),
						eq(orderItem.productId, parsed.productId),
						eq(order.status, "delivered"),
					),
				)
				.limit(1);
			if (!rows || rows.length === 0) {
				throw new Error(
					"You can only leave a review for products you have purchased and received.",
				);
			}
		}

		async function findExisting() {
			const rows = await db
				.select()
				.from(review)
				.where(
					and(
						eq(review.userId, user.id),
						eq(review.productId, parsed.productId),
					),
				)
				.limit(1);
			return rows && rows.length > 0 ? rows[0] : null;
		}

		async function processAndUploadImages(files: File[]) {
			const processed = await Promise.all(
				files.map(async (imgFile) => {
					const buf = Buffer.from(await imgFile.arrayBuffer());
					const out = await sharp(buf)
						.resize({ width: 1200 })
						.toFormat("webp", { quality: 80 })
						.toBuffer();
					const uint8 = new Uint8Array(out);
					const baseName = imgFile.name.replace(/\.[^.]+$/, "") || imgFile.name;
					return new File([uint8], `${baseName}.webp`, { type: "image/webp" });
				}),
			);
			return utapi.uploadFiles(processed);
		}

		// local helper so we can call it with either db or a transaction client
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async function updateProductReviewMetricsLocal(
			productId: string,
			client: any = db,
		) {
			const [m] = await client
				.select({
					total: count(review.id),
					avg: sql<number>`AVG(${review.rating})`,
					c1: sql<number>`SUM(CASE WHEN ${review.rating} = 1 THEN 1 ELSE 0 END)`,
					c2: sql<number>`SUM(CASE WHEN ${review.rating} = 2 THEN 1 ELSE 0 END)`,
					c3: sql<number>`SUM(CASE WHEN ${review.rating} = 3 THEN 1 ELSE 0 END)`,
					c4: sql<number>`SUM(CASE WHEN ${review.rating} = 4 THEN 1 ELSE 0 END)`,
					c5: sql<number>`SUM(CASE WHEN ${review.rating} = 5 THEN 1 ELSE 0 END)`,
				})
				.from(review)
				.where(eq(review.productId, productId));

			const total = Number(m?.total ?? 0);
			const avgRaw = m?.avg == null ? 0 : Number(m.avg);
			const avgRating = Math.round(total > 0 ? avgRaw : 0);

			await client
				.update(product)
				.set({
					avgRating: avgRating,
					totalReviews: total,
					count1StarReviews: Number(m?.c1 ?? 0),
					count2StarReviews: Number(m?.c2 ?? 0),
					count3StarReviews: Number(m?.c3 ?? 0),
					count4StarReviews: Number(m?.c4 ?? 0),
					count5StarReviews: Number(m?.c5 ?? 0),
				})
				.where(eq(product.id, productId));
		}

		// --- handler flow with transaction for atomicity ---
		await ensureUserOrdered();
		const existing = await findExisting();

		// Process images if present
		let uploadedUrls: string[] | null = null;
		if (parsed.image && parsed.image.length > 0) {
			const uploaded = await processAndUploadImages(parsed.image);
			uploadedUrls = uploaded
				.map((f) => f.data?.ufsUrl)
				.filter(Boolean) as string[];
		}

		const result = await db.transaction(async (tx) => {
			if (existing) {
				const [updated] = await tx
					.update(review)
					.set({
						rating: parsed.rating,
						comment: parsed.review,
						images: uploadedUrls,
					})
					.where(eq(review.id, existing.id))
					.returning();
				await updateProductReviewMetricsLocal(parsed.productId, tx);
				return updated;
			} else {
				const [created] = await tx
					.insert(review)
					.values({
						userId: user.id,
						productId: parsed.productId,
						rating: parsed.rating,
						comment: parsed.review,
						images: uploadedUrls,
					})
					.returning();
				await updateProductReviewMetricsLocal(parsed.productId, tx);
				return created;
			}
		});

		return result;
	});
