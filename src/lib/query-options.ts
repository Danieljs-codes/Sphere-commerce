import { $getSignedInUser } from "@server/auth";
import {
	$getExistingCategories,
	$getExistingCategoriesWithPagination,
} from "@server/categories";
import { $getCart } from "@server/customers/carts";
import {
	$getHighestAndLowestPrice,
	$getProducts,
} from "@server/customers/product";
import { $searchProducts } from "@server/customers/search";
import { $getDiscounts } from "@server/discounts";
import { $getOrder, $getOrders } from "@server/orders";
import { $getOverviewData, $getRecentSalesData } from "@server/overview";
import { $getProductPage, $getProductStats } from "@server/products";
import { queryOptions } from "@tanstack/react-query";

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

/**
 * Information about a country.
 */
export interface Country {
	/**
	 * Name of the country.
	 */
	name: string;
	/**
	 * Top level domain(s) of the country.
	 */
	topLevelDomain: string[];
	/**
	 * Alpha-2 code of the country.
	 */
	alpha2Code: string;
	/**
	 * Alpha-3 code of the country.
	 */
	alpha3Code: string;
	/**
	 * Calling code(s) of the country.
	 */
	callingCodes: string[];
	/**
	 * Capital city of the country.
	 */
	capital: string;
	/**
	 * Alternative spellings of the country name.
	 */
	altSpellings: string[];
	/**
	 * Subregion of the country.
	 */
	subregion: string;
	/**
	 * Region of the country.
	 */
	region: string;
	/**
	 * Population of the country.
	 */
	population: number;
	/**
	 * Latitude and longitude of the country.
	 */
	latlng: number[];
	/**
	 * Demonym for the country's people.
	 */
	demonym: string;
	/**
	 * Area of the country in square kilometers.
	 */
	area: number;
	/**
	 * Timezone(s) of the country.
	 */
	timezones: string[];
	/**
	 * Bordering countries.
	 */
	borders: string[];
	/**
	 * Native name of the country.
	 */
	nativeName: string;
	/**
	 * Numeric code of the country.
	 */
	numericCode: string;
	/**
	 * Flags of the country.
	 */
	flags: {
		/**
		 * SVG format flag URL.
		 */
		svg: string;
		/**
		 * PNG format flag URL.
		 */
		png: string;
	};
	/**
	 * Currencies used in the country.
	 */
	currencies: {
		/**
		 * Currency code.
		 */
		code: string;
		/**
		 * Currency name.
		 */
		name: string;
		/**
		 * Currency symbol.
		 */
		symbol: string;
	}[];
	/**
	 * Languages spoken in the country.
	 */
	languages: {
		/**
		 * ISO 639-1 language code.
		 */
		iso639_1: string;
		/**
		 * ISO 639-2 language code.
		 */
		iso639_2: string;
		/**
		 * Language name.
		 */
		name: string;
		/**
		 * Native name of the language.
		 */
		nativeName: string;
	}[];
	/**
	 * Translations of the country name.
	 */
	translations: {
		[key: string]: string;
	};
	/**
	 * URL of the country's flag.
	 */
	flag: string;
	/**
	 * Regional blocs the country is part of.
	 */
	regionalBlocs: {
		/**
		 * Acronym of the regional bloc.
		 */
		acronym: string;
		/**
		 * Name of the regional bloc.
		 */
		name: string;
	}[];
	/**
	 * Country code for the International Olympic Committee.
	 */
	cioc: string;
	/**
	 * Whether the country is independent.
	 */
	independent: boolean;
}

export const getCountriesQueryOptions = () =>
	queryOptions({
		queryKey: ["countries"],
		queryFn: async () => {
			const response = await fetch("https://www.apicountries.com/countries");
			return (await response.json()) as Country[];
		},
		select: (data) => {
			return data.map((country) => ({
				name: country.name,
				flag: country.flags.png,
			}));
		},
	});
