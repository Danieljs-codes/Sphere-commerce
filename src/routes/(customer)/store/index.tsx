import { PreviewProductModal } from "@components/preview-product-modal";
import type { Product } from "@server/db/schema";
import { IconEyeFilled, IconHeartFilled } from "@tabler/icons-react";
import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { Checkbox, CheckboxGroup } from "@ui/checkbox";
import {
	Disclosure,
	DisclosureGroup,
	DisclosurePanel,
	DisclosureTrigger,
} from "@ui/disclosure";
import { Description, Label } from "@ui/field";
import { Link } from "@ui/link";
import { Radio, RadioGroup } from "@ui/radio";
import { Separator } from "@ui/separator";
import { Slider } from "@ui/slider";
import { useEffect, useState } from "react";
import { z } from "zod/v4";
import { useDebouncedValue } from "@/hooks/use-debounce-value";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import {
	getExistingCategoriesQueryOptions,
	getHighestAndLowestPriceQueryOptions,
	getProductsQueryOptions,
} from "@/lib/query-options";
import { cn, formatMoney, stripHtmlTags, willTextWrap } from "@/lib/utils";

const searchParamSchema = z.object({
	minPrice: z.coerce.number().optional().default(0).catch(0),
	maxPrice: z.coerce.number().optional(),
	category: z.array(z.string()).optional().default([]).catch([]),
	sort: z
		.enum(["high-to-low", "low-to-high"])
		.optional()
		.default("high-to-low")
		.catch("high-to-low"),
});

export const Route = createFileRoute("/(customer)/store/")({
	validateSearch: searchParamSchema,
	loaderDeps: ({ search }) => ({ ...search }),
	loader: async ({ context, deps }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(getExistingCategoriesQueryOptions()),
			context.queryClient.ensureQueryData(
				getHighestAndLowestPriceQueryOptions(),
			),
		]);
		context.queryClient.ensureQueryData(getProductsQueryOptions(deps));
		return {
			title: "Store",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const [{ data: categories }, { data: prices }] = useSuspenseQueries({
		queries: [
			getExistingCategoriesQueryOptions(),
			getHighestAndLowestPriceQueryOptions(),
		],
	});
	const { data: productsPage, isSuspending } = useSuspenseQueryDeferred(
		getProductsQueryOptions(search),
	);

	const [product, setProduct] = useState<
		(Product & { categoryName: string | null }) | null
	>(null);
	const [priceRange, setPriceRange] = useState<[number, number]>([
		prices.lowestPrice / 100,
		prices.highestPrice / 100,
	]);
	const [sort, setSort] = useState(search.sort);
	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		search.category ?? [],
	);

	const [debouncedRange] = useDebouncedValue(priceRange, 1000);
	const [debouncedCategories] = useDebouncedValue(selectedCategories, 500);
	const [debouncedSort] = useDebouncedValue(sort, 500);

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

	useEffect(() => {
		navigate({
			search: (prev) => ({
				...prev,
				sort: debouncedSort,
			}),
		});
	}, [debouncedSort, navigate]);

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
			<Separator className="-mx-[calc(50dvw_-_49.5%)] w-dvw my-6 sm:my-12" />
			<div className="grid-cols-4 gap-16 lg:grid">
				<div>
					<div className="flex flex-col gap-6">
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
							maxValue={prices.highestPrice / 100 + 1000}
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
						<RadioGroup
							name="sort"
							value={sort}
							onChange={(val) => setSort(val as "high-to-low" | "low-to-high")}
						>
							<Label>Sort Prices</Label>
							<Description>Sort the products by price</Description>
							<Radio value="high-to-low">
								<Label>High to Low</Label>
								<Description>
									Sort the products by price from high to low
								</Description>
							</Radio>
							<Radio value="low-to-high">
								<Label>Low to High</Label>
								<Description>
									Sort the products by price from low to high
								</Description>
							</Radio>
						</RadioGroup>
					</div>
				</div>
				<div className="col-span-3">
					<div className="py-6">
						<h2 className="sr-only">Products</h2>
						<div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{productsPage.items.map((product) => (
								<div key={product.id} className="group relative">
									<div className="group-hover:-translate-x-0 absolute top-2 right-2 z-10 flex translate-x-2 flex-col gap-y-1 opacity-0 transition ease-linear group-hover:opacity-100">
										<Button size="sq-xs" intent="secondary" isCircle>
											<IconHeartFilled data-slot="icon" />
										</Button>
										<Button
											size="sq-xs"
											intent="secondary"
											isCircle
											onPress={() => setProduct(product)}
										>
											<IconEyeFilled data-slot="icon" />
										</Button>
									</div>
									<Link to="/store/$id" params={{ id: product.id }}>
										<div className="aspect-square w-full overflow-hidden rounded-2xl border border-fg/15">
											<img
												className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
												src={product.images[0].url}
												alt={product.name}
											/>
										</div>
										<div className="mt-4 text-sm">
											<div className="space-y-1">
												<h3 className="font-semibold">{product.name}</h3>
												<p
													className={cn(
														"text-muted-fg line-clamp-1 text-[13px]",
														{
															"line-clamp-2": !willTextWrap(product.name, 20),
														},
													)}
												>
													{stripHtmlTags(product.description)}
												</p>
											</div>
											<div className="mt-2 flex items-center justify-between">
												<p className="tabular-nums font-medium text-base text-fg">
													{/* Remove the kobo part */}
													{formatMoney(product.price).split(".")[0]}
												</p>
												<p className="text-muted-fg text-[13px]">
													{product.categoryName}
												</p>
											</div>
										</div>
									</Link>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			<PreviewProductModal
				product={product}
				onOpenChange={(isOpen) => {
					if (!isOpen) setProduct(null);
				}}
			/>
		</div>
	);
}
