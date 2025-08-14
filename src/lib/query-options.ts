import { $getSignedInUser } from "@server/auth";
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
