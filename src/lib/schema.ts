import z from "zod/v4";

export const signUpSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.regex(
			/^[a-zA-Z]+\s+[a-zA-Z]+.*$/,
			"Please enter your first and last name separated by a space",
		),
	email: z.email("Invalid email address").min(1, "Email is required"),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
	email: z.email("Invalid email address").min(1, "Email is required"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean().default(false),
});

export type SignInSchema = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
	email: z.email("Invalid email address").min(1, "Email is required"),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters long"),
		confirmPassword: z.string().min(8, "Confirm Password is required"),
	})
	.superRefine(({ password, confirmPassword }, ctx) => {
		if (password !== confirmPassword) {
			// Only add error to confirmPassword field
			ctx.addIssue({
				code: "custom",
				message: "Passwords must match",
				path: ["confirmPassword"],
			});
		}
	});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// Step 1: Product Details (combines basics + images)
export const productDetailsSchema = z.object({
	name: z.string().min(3, "Product name must be at least 3 characters"),
	price: z.number().min(100, "Price must be at least ₦100"),
	description: z
		.string()
		.min(
			10,
			"Please provide a more detailed description (at least 10 characters)",
		),
	categoryId: z.string().min(1, "Category is required"),
	tags: z.array(z.string()),
	images: z
		.array(
			z
				.file()
				.refine(
					(file) => file.size <= 2 * 1024 * 1024, // 2MB
					{ message: "Each image must be less than 2MB" },
				)
				.mime(["image/png", "image/jpeg", "image/webp"]),
		)
		.min(1, "At least one image is required"),
});

// Step 2: Inventory & Publishing (simplified)
export const productVariantsPublishSchema = z
	.object({
		stockCount: z.number().min(1, "Stock count must be at least 1"),
		status: z.enum(["draft", "active", "scheduled"]),
		publishAt: z
			.number()
			.int()
			.positive("Publish date must be a valid Unix epoch (in seconds)")
			.optional(),
		metaTitle: z.string().optional(),
		metaDescription: z.string().optional(),
	})
	.superRefine(({ status, publishAt }, ctx) => {
		if (
			status === "scheduled" &&
			(publishAt === undefined || Number.isNaN(publishAt))
		) {
			ctx.addIssue({
				code: "custom",
				message: "Publish date is required when status is Scheduled",
				path: ["publishAt"],
			});
		}
	});

// Combined schema

export const productFormSchema = z.object({
	...productDetailsSchema.shape,
	...productVariantsPublishSchema.shape,
});

// Backend schema for parsing FormData
export const productFormBackendSchema = z.object({
	name: z.string().min(3, "Product name must be at least 3 characters"),
	price: z
		.string()
		.transform((val) => Number(val))
		.refine((val) => !isNaN(val) && val >= 100, {
			message: "Price must be at least ₦100",
		}),
	description: z
		.string()
		.min(
			10,
			"Please provide a more detailed description (at least 10 characters)",
		),
	categoryId: z.string().min(1, "Category is required"),
	tags: z.string().transform((val) => {
		try {
			const arr = JSON.parse(val);
			return Array.isArray(arr) ? arr : [];
		} catch {
			return [];
		}
	}),
	images: z.any().array().nonempty("At least one image is required"), // Accept files from FormData
	stockCount: z
		.string()
		.transform((val) => Number(val))
		.refine((val) => !Number.isNaN(val) && val >= 1, {
			message: "Stock count must be at least 1",
		}),
	status: z.enum(["draft", "active", "scheduled"]),
	publishAt: z
		.string()
		.optional()
		.transform((val) => (val ? Number(val) : undefined)),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

export type ProductFormBackendData = z.infer<typeof productFormBackendSchema>;

export type ProductFormData = z.infer<typeof productFormSchema>;
