import { $getSignedInUser } from "@server/auth";
import { $getOverviewData, $getRecentSalesData } from "@server/overview";
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
