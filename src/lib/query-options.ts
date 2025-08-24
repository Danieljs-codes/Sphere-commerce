import { $getSignedInUser } from "@server/auth";
import {
	$getExistingCategories,
	$getExistingCategoriesWithPagination,
} from "@server/categories";
import { $getCart } from "@server/customers/carts";
import { $getUserOrderHistory } from "@server/customers/orders";
import {
	$getHighestAndLowestPrice,
	$getProductById,
	$getProducts,
} from "@server/customers/product";
import { $searchProducts } from "@server/customers/search";
import { $getDiscounts } from "@server/discounts";
import { $getOrder, $getOrders } from "@server/orders";
import { $getOverviewData, $getRecentSalesData } from "@server/overview";
import { $getProductPage, $getProductStats } from "@server/products";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

export const getSignedUserQueryOptions = () =>
	queryOptions({
		queryKey: ["user"],
		queryFn: async () => {
			const user = await $getSignedInUser();

			return user;
		},
		staleTime: 30 * 1000, // 30 Seconds
	});

export const getOverviewStatsQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard", "overview"],
		queryFn: async () => {
			const data = await $getOverviewData();

			return data;
		},
	});

export const getRecentSalesDataQueryOptions = ({
	from,
	to,
}: {
	from: string;
	to: string;
}) =>
	queryOptions({
		queryKey: ["dashboard", "recent-sales", from, to],
		queryFn: async () => {
			const data = await $getRecentSalesData({ data: { from, to } });

			return data;
		},
	});

export const getProductStatsQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard", "product-stats"],
		queryFn: async () => {
			const data = await $getProductStats();

			return data;
		},
	});
export const getProductPageQueryOptions = ({
	offset,
	numItems,
	filter,
}: {
	offset: number;
	numItems: number;
	filter?: "active" | "draft" | "scheduled";
}) =>
	queryOptions({
		queryKey: ["dashboard", "product-page", offset, numItems, filter],
		queryFn: async () => {
			const data = await $getProductPage({
				data: {
					offset: 0,
					numItems: 10,
					filter: undefined,
				},
			});

			return data;
		},
	});

export const getExistingCategoriesQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard", "categories"],
		queryFn: async () => {
			const data = await $getExistingCategories();

			return data;
		},
	});

export const getOrdersQueryOptions = ({
	page,
	limit,
	status,
}: {
	page: number;
	limit: number;
	status?: "processing" | "shipped" | "delivered";
}) =>
	queryOptions({
		queryKey: ["dashboard", "orders"],
		queryFn: async () => {
			const data = await $getOrders({
				data: {
					page,
					limit,
					status,
				},
			});

			return data;
		},
	});

export const getOrderQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["dashboard", "order", id],
		queryFn: async () => {
			const data = await $getOrder({ data: { id } });

			return data;
		},
	});

export const getExistingCategoriesWithPaginationQueryOptions = ({
	page,
	limit,
}: {
	page: number;
	limit: 10 | 20 | 30 | 40 | 50;
}) =>
	queryOptions({
		queryKey: ["dashboard", "categories"],
		queryFn: async () => {
			const data = await $getExistingCategoriesWithPagination({
				data: { page, limit },
			});

			return data;
		},
	});

export const searchProductsQueryOptions = (search: string) =>
	queryOptions({
		queryKey: ["dashboard", "search-products", search],
		queryFn: async () => {
			if (search.length > 0) {
				const data = await $searchProducts({
					data: {
						search,
					},
				});
				return data;
			} else {
				return null;
			}
		},
	});

export const getHighestAndLowestPriceQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard", "highest-and-lowest-price"],
		queryFn: async () => {
			const data = await $getHighestAndLowestPrice();

			return data;
		},
	});

export const getProductsQueryOptions = ({
	minPrice,
	maxPrice,
	category = [],
	sort = "high-to-low",
	page = 1,
	limit = 24,
}: {
	minPrice?: number;
	maxPrice?: number;
	category?: string[];
	sort?: "high-to-low" | "low-to-high";
	page?: number;
	limit?: number;
}) =>
	queryOptions({
		queryKey: [
			"store",
			"products",
			minPrice,
			maxPrice,
			category.join(","),
			sort,
			page,
			limit,
		],
		queryFn: async () => {
			const data = await $getProducts({
				data: {
					minPrice,
					maxPrice,
					category,
					sort,
					page,
					limit,
				},
			});

			return data;
		},
	});

export const getCartQueryOptions = () =>
	queryOptions({
		queryKey: ["cart"],
		queryFn: async () => {
			const data = await $getCart();

			return data;
		},
		staleTime: 30 * 2 * 1000,
	});

export const getDiscountsQueryOptions = ({
	page,
	limit,
}: {
	page: number;
	limit: 10 | 20 | 30 | 40 | 50;
}) =>
	queryOptions({
		queryKey: ["dashboard", "discounts", page, limit],
		queryFn: async () => {
			return await $getDiscounts({
				data: {
					limit,
					page,
				},
			});
		},
	});

export const getUserOrderHistoryQueryOptions = ({ limit }: { limit: number }) =>
	infiniteQueryOptions({
		queryKey: ["user", "order-history", limit],
		queryFn: async ({ pageParam }) => {
			const data = await $getUserOrderHistory({
				data: {
					cursor: pageParam,
					limit,
				},
			});

			return data;
		},
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) => {
			return lastPage.nextCursor;
		},
	});

export const getProductByIdQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["product", id],
		queryFn: async () => {
			const data = await $getProductById({ data: { id } });

			return data;
		},
	});
