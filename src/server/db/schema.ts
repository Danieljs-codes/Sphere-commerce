import { createId } from "@paralleldrive/cuid2";
import type { InferSelectModel } from "drizzle-orm";
import {
	type AnySQLiteColumn,
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", {
		mode: "boolean",
	})
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer("updated_at", {
		mode: "timestamp",
	})
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
		.notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", {
		mode: "timestamp",
	}).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$onUpdateFn(() => new Date()),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	impersonatedBy: text("impersonated_by"),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$onUpdateFn(() => new Date()),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", {
		mode: "timestamp",
	}).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

// ===== CATEGORIES =====
export const categories = sqliteTable(
	"categories",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		description: text("description").notNull(),
		parentId: text("parent_id").references(
			(): AnySQLiteColumn => categories.id,
		),
		image: text("image"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("categories_by_slug").on(t.slug),
		index("categories_by_parent").on(t.parentId),
	],
);

export const product = sqliteTable(
	"product",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description").notNull(),
		categoryId: text("category_id").references(() => categories.id, {
			onDelete: "set null",
		}),
		price: integer("price").notNull(),
		stock: integer("stock").notNull(),
		sellerId: text("seller_id").references(() => user.id, {
			onDelete: "cascade",
		}),
		images: text("images", { mode: "json" })
			.$type<
				{
					url: string;
					blurhash: string;
				}[]
			>()
			.notNull(),
		tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
		metaTitle: text("meta_title"),
		metaDescription: text("meta_description"),
		status: text("status", {
			enum: ["draft", "scheduled", "active", "archived"],
		}),
		publishedAt: integer("published_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("products_by_slug").on(t.slug),
		index("products_by_status").on(t.status),
		index("products_by_category").on(t.categoryId),
		index("products_by_seller").on(t.sellerId),
		index("products_by_scheduled").on(t.status, t.publishedAt),
		index("products_by_price").on(t.price),
	],
);

export const discount = sqliteTable(
	"discount",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		code: text("code").notNull(),
		description: text("description"),
		type: text("type", { enum: ["percentage", "fixed_amount"] }).notNull(),
		value: integer("value").notNull(),
		minimumOrderAmount: integer("minimum_order_amount"),
		maximumDiscountAmount: integer("maximum_discount_amount"),
		usageLimit: integer("usage_limit"),
		usageCount: integer("usage_count").notNull().default(0),
		startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp" }),
		isActive: integer("is_active", { mode: "boolean" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		uniqueIndex("discounts_by_code").on(t.code),
		index("discounts_by_active_dates").on(t.isActive, t.startsAt, t.expiresAt),
	],
);

export const cart = sqliteTable(
	"cart",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.references(() => user.id)
			.notNull()
			.unique(),
		total: integer("sub_total").notNull().default(0),
		discountId: text("discount_id").references(() => discount.id),
		discountCode: text("discount_code"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [index("carts_by_user").on(t.userId)],
);

export const cartItems = sqliteTable(
	"cart_items",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		cartId: text("cart_id")
			.references(() => cart.id)
			.notNull(),
		productId: text("product_id")
			.references(() => product.id)
			.notNull(),
		quantity: integer("quantity").notNull(),
		priceAtAdd: integer("price_at_add").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		index("cart_items_by_cart").on(t.cartId),
		index("cart_items_by_cart_product").on(t.cartId, t.productId),
		uniqueIndex("cart_items_by_cart_product_unique").on(t.cartId, t.productId),
	],
);

export const order = sqliteTable(
	"order",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		userId: text("user_id")
			.references(() => user.id)
			.notNull(),
		orderNumber: integer("order_number").notNull(),
		subtotal: integer("subtotal").notNull(),
		discountAmount: integer("discount_amount").notNull(),
		shippingFee: integer("shipping_fee").notNull(),
		taxAmount: integer("tax_amount").notNull(),
		total: integer("total").notNull(),
		discountId: text("discount_id").references(() => discount.id),
		discountCode: text("discount_code", { length: 100 }),
		status: text("status", {
			enum: ["processing", "shipped", "delivered"],
		}).notNull(),
		shippingAddress: text("shipping_address", { mode: "json" })
			.$type<{
				street: string;
				city: string;
				state: string;
				country: string;
				zip: string;
			}>()
			.notNull(),
		paymentReference: text("payment_reference").unique(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
		shippedAt: integer("shipped_at", { mode: "timestamp" }),
		deliveredAt: integer("delivered_at", { mode: "timestamp" }),
	},
	(t) => [
		index("orders_by_user").on(t.userId),
		index("orders_by_status").on(t.status),
		uniqueIndex("orders_by_order_number").on(t.orderNumber),
		index("orders_by_created_at").on(t.createdAt),
		index("orders_by_discount").on(t.discountId),
		index("orders_by_payment_reference").on(t.paymentReference),
		index("orders_by_created_at_id").on(t.createdAt, t.id),
	],
);

// ===== ORDER ITEMS =====
export const orderItem = sqliteTable(
	"order_item",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		orderId: text("order_id")
			.references(() => order.id)
			.notNull(),
		productId: text("product_id")
			.references(() => product.id)
			.notNull(),
		quantity: integer("quantity").notNull(),
		productName: text("product_name").notNull(),
		pricePerItem: integer("price_per_item").notNull(),
		totalPrice: integer("total_price").notNull(),
	},
	(t) => [
		index("order_items_by_order").on(t.orderId),
		index("order_items_by_product").on(t.productId),
	],
);

export const scheduledTasks = sqliteTable(
	"scheduled_tasks",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		type: text("type", {
			enum: ["publish_product", "activate_discount", "deactivate_discount"],
		}).notNull(),
		entityId: text("entity_id", { length: 255 }).notNull(),
		scheduledFunctionId: text("scheduled_function_id").notNull(),
		scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
		status: text("status", {
			enum: ["pending", "completed", "failed"],
		}).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		completedAt: integer("completed_at", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
		error: text("error"),
	},
	(t) => [
		index("scheduled_tasks_by_scheduled").on(t.status, t.scheduledFor),
		index("scheduled_tasks_by_type_entity").on(t.type, t.entityId),
	],
);

export const payment = sqliteTable(
	"payment",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),

		orderId: text("order_id").references(() => order.id, {
			onDelete: "cascade",
		}),

		reference: text("reference").notNull().unique(),

		provider: text("provider").notNull().default("paystack"),

		status: text("status", {
			enum: ["pending", "success", "failed"],
		})
			.notNull()
			.default("pending"),

		amount: integer("amount").notNull(),

		currency: text("currency").notNull().default("NGN"),

		rawResponse: text("raw_response", { mode: "json" }).$type<
			Record<string, unknown>
		>(),

		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),

		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date()),
	},
	(t) => [
		index("payment_by_order").on(t.orderId),
		uniqueIndex("payment_by_reference").on(t.reference),
	],
);

export type User = InferSelectModel<typeof user>;
export type Product = InferSelectModel<typeof product>;
export type Category = InferSelectModel<typeof categories>;
export type Order = InferSelectModel<typeof order>;
export type Discount = InferSelectModel<typeof discount>;
export type OrderItem = InferSelectModel<typeof orderItem>;
