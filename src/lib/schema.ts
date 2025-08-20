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

export const createCategorySchema = z.object({
	name: z.string().min(1, "Please enter a name for the category"),
	description: z.string().min(1, "Please enter a description for the category"),
	file: z
		.file({
			error: "Please upload an image for the category",
		})
		.refine((file) => file !== undefined, {
			message: "Please upload an image for the category",
		}),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export const createDiscountSchema = z
	.object({
		name: z.string().min(1, "Please enter a name for the discount"),
		code: z
			.string()
			.min(1, "Please enter a code for the discount")
			.max(30, "Code must be at most 30 characters"),
		value: z
			.number({
				error: "Please enter a value for the discount",
			})
			.min(1, "Please enter a value for the discount"),
		description: z
			.string()
			.min(1, "Please enter a description for the discount")
			.max(40, "Description must be at most 60 characters")
			.optional(),
		dates: z
			.object({
				startsAt: z.date(),
				expiresAt: z.date().optional().nullable(),
			})
			.superRefine(({ startsAt, expiresAt }, ctx) => {
				// If there's an expiry date, it must be after startsAt and at least 1 hour later
				if (expiresAt) {
					if (expiresAt <= startsAt) {
						ctx.addIssue({
							code: "custom",
							message: "Expiration date must be after the start date",
							path: ["expiresAt"],
						});
					} else if (
						expiresAt.getTime() - startsAt.getTime() <
						60 * 60 * 1000
					) {
						ctx.addIssue({
							code: "custom",
							message:
								"Expiration date must be at least 1 hour after the start date",
							path: ["expiresAt"],
						});
					}
				}
			}),
		minimumOrderAmount: z
			.number()
			.min(100, "Minimum order amount must be at least ₦100")
			.or(z.null()),
		maximumDiscountAmount: z
			.number()
			.min(100, "Maximum discount amount must be at least ₦100")
			.or(z.null()),
		usageLimit: z
			.number()
			.min(1, "Usage limit must be at least 1")
			.or(z.null()),
		type: z.enum(["percentage", "fixed_amount"], {
			error: "Invalid discount type",
		}),
	})
	.superRefine(({ type, value }, ctx) => {
		if (type === "percentage" && (value < 1 || value > 100)) {
			ctx.addIssue({
				code: "custom",
				message: "Percentage value must be between 1 and 100",
				path: ["value"],
			});
		} else if (type === "fixed_amount" && value < 100) {
			ctx.addIssue({
				code: "custom",
				message: "Fixed amount must be at least ₦100",
				path: ["value"],
			});
		}
	});

export type CreateDiscountFormData = z.infer<typeof createDiscountSchema>;

export const checkoutSchema = z
	.object({
		firstName: z
			.string()
			.min(2, "First name must be at least 2 characters")
			.max(100, "First name must not exceed 100 characters"),
		lastName: z
			.string()
			.min(2, "Last name must be at least 2 characters")
			.max(100, "Last name must not exceed 100 characters"),
		street: z
			.string()
			.min(2, "Street address must be at least 2 characters")
			.max(100, "Street address must not exceed 100 characters"),
		city: z
			.string()
			.min(2, "City must be at least 2 characters")
			.max(100, "City must not exceed 100 characters"),
		state: z
			.string()
			.min(2, "State must be at least 2 characters")
			.max(100, "State must not exceed 100 characters"),
		postalCode: z
			.string()
			.min(2, "Postal code must be at least 2 characters")
			.max(100, "Postal code must not exceed 100 characters"),
		country: z
			.string()
			.min(2, "Country must be at least 2 characters")
			.max(100, "Country must not exceed 100 characters"),
	})
	.superRefine(({ postalCode }, ctx) => {
		if (!/^\d{5}$/.test(postalCode)) {
			ctx.addIssue({
				code: "custom",
				message: "Invalid postal code. Must be 5 digits.",
				path: ["postalCode"],
			});
		}
	});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
