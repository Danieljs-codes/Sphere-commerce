import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Checkbox, CheckboxGroup } from "@ui/checkbox";
import {
	Disclosure,
	DisclosureGroup,
	DisclosurePanel,
	DisclosureTrigger,
} from "@ui/disclosure";
import { Separator } from "@ui/separator";
import { Slider } from "@ui/slider";
import { useEffect, useState } from "react";
import { z } from "zod/v4";
import { useDebouncedValue } from "@/hooks/use-debounce-value";
import {
	getExistingCategoriesQueryOptions,
	getHighestAndLowestPriceQueryOptions,
} from "@/lib/query-options";

const searchParamSchema = z.object({
	minPrice: z.coerce.number().optional().default(0).catch(0),
	maxPrice: z.coerce.number().optional(),
	category: z.array(z.string()).optional().default([]).catch([]),
});

export const Route = createFileRoute("/(customer)/store/")({
	validateSearch: searchParamSchema,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(getExistingCategoriesQueryOptions()),
			context.queryClient.ensureQueryData(
				getHighestAndLowestPriceQueryOptions(),
			),
		]);
		return {
			title: "Store",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const [{ data: categories }, { data: prices }] = useSuspenseQueries({
		queries: [
			getExistingCategoriesQueryOptions(),
			getHighestAndLowestPriceQueryOptions(),
		],
	});
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [priceRange, setPriceRange] = useState<[number, number]>([
		prices.lowestPrice / 100,
		prices.highestPrice / 100,
	]);

	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		search.category ?? [],
	);

	const [debouncedRange] = useDebouncedValue(priceRange, 1000);
	const [debouncedCategories] = useDebouncedValue(selectedCategories, 500);

	useEffect(() => {
		console.log(priceRange);
	}, [priceRange]);

	useEffect(() => {
		navigate({
			search: (prev) => ({
				...prev,
				minPrice: debouncedRange[0],
				maxPrice: debouncedRange[1],
			}),
		});
	}, [debouncedRange, navigate]);

	useEffect(() => {
		navigate({
			search: (prev) => ({
				...prev,
				category: debouncedCategories,
			}),
		});
	}, [debouncedCategories, navigate]);

	return (
		<div className="mx-auto w-full max-w-(--breakpoint-xl)">
			<div>
				<h1 className="font-semibold text-3xl text-fg tracking-tight">
					Discover Unique Collections
				</h1>
				<p className="mt-2 max-w-[60ch] text-balance text-muted-fg text-sm leading-relaxed">
					Explore our latest collections and find unique pieces for your
					wardrobe. Discover unexpected finds that elevate your style.
				</p>
			</div>
			<Separator className="-mx-[calc(50dvw_-_50%)] w-dvw my-6 sm:my-12" />
			<div className="grid-cols-4 gap-16 lg:grid">
				<div>
					<div className="flex flex-col gap-4">
						<DisclosureGroup defaultExpandedKeys={[1]}>
							<Disclosure id={1} className="border-0">
								<DisclosureTrigger>Categories</DisclosureTrigger>
								<DisclosurePanel>
									<CheckboxGroup
										className="space-y-3 px-1"
										value={selectedCategories}
										onChange={setSelectedCategories}
									>
										{categories.map((category) => (
											<Checkbox
												labelClassName="text-muted-fg"
												key={category.id}
												value={category.name.toLowerCase()}
											>
												{category.name}
											</Checkbox>
										))}
									</CheckboxGroup>
								</DisclosurePanel>
							</Disclosure>
						</DisclosureGroup>
						<Slider
							minValue={prices.lowestPrice / 100}
							maxValue={prices.highestPrice / 100}
							defaultValue={priceRange}
							onChange={(val) => {
								setPriceRange(val as [number, number]);
							}}
							valueFormatter={(value) => {
								if (value >= 1000000) {
									return `${(value / 1000000).toFixed(1)}M`;
								}
								if (value >= 1000) {
									return `${(value / 1000).toFixed(1)}K`;
								}
								return `₦${value.toLocaleString()}`;
							}}
							label="Price Range"
						/>
					</div>
				</div>
				<div className="col-span-4"></div>
			</div>
		</div>
	);
}
