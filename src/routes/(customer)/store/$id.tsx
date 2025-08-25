import { MetricCard } from "@components/admin/metric-card";
import { NewReviewModal } from "@components/new-review-modal";
import { StarRating } from "@components/star-rating";
import {
	IconAddToCartFill,
	IconHeartFill,
	IconPencilBoxFill,
	IconStarFill,
} from "@intentui/icons";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Avatar } from "@ui/avatar";
import { Button, buttonStyles } from "@ui/button";
import { Card } from "@ui/card";
import { Carousel } from "@ui/carousel";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { ProgressBar } from "@ui/progress-bar";
import { format } from "date-fns";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react";
import { Blurhash } from "react-blurhash";
import { toast } from "sonner";
import z from "zod/v4";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { addToCart } from "@/lib/carts";
import {
	getCartQueryOptions,
	getProductByIdQueryOptions,
} from "@/lib/query-options";
import { formatMoney, getNameInitials } from "@/lib/utils";

const searchParamSchema = z.object({
	newReview: z.boolean().optional().default(false).catch(false),
});

export const Route = createFileRoute("/(customer)/store/$id")({
	validateSearch: searchParamSchema,
	loader: ({ context, params }) => {
		context.queryClient.ensureQueryData(getProductByIdQueryOptions(params.id));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const context = Route.useRouteContext();
	const params = Route.useParams();
	const queryClient = useQueryClient();
	const {
		data: { product, relatedProducts: _relatedProducts, reviews, category },
	} = useSuspenseQuery(getProductByIdQueryOptions(params.id));
	const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));
	const { data: cart } = useSuspenseQueryDeferred(getCartQueryOptions());

	// Track which images have finished loading so we can show the Blurhash until then
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

	// track the last element we made fullscreen so we can restore styles on exit
	const lastFullscreenElRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		function handleFsChange() {
			if (!document.fullscreenElement && lastFullscreenElRef.current) {
				const el = lastFullscreenElRef.current as HTMLElement & {
					dataset: DOMStringMap;
				};
				// restore previous objectFit if stored
				if (el.dataset && typeof el.dataset.prevObjectFit === "string") {
					el.style.objectFit = el.dataset.prevObjectFit || "";
					delete (el.dataset as DOMStringMap).prevObjectFit;
				}
				lastFullscreenElRef.current = null;
			}
		}

		document.addEventListener("fullscreenchange", handleFsChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFsChange);
	}, []);

	function activateImage(img: HTMLImageElement) {
		try {
			// store previous objectFit so we can restore after exit
			img.dataset.prevObjectFit = img.style.objectFit || "";
			img.style.objectFit = "contain";
			lastFullscreenElRef.current = img;
			if (document.fullscreenElement === img) {
				document.exitFullscreen();
			} else {
				img.requestFullscreen().catch((err) => console.error(err));
			}
		} catch (err) {
			console.error(err);
		}
	}

	const handleImageLoad = (url: string) => {
		setLoadedImages((prev) => ({
			...prev,
			[url]: true,
		}));
	};

	const handleImageError = (url: string) => {
		// mark as loaded so we don't keep showing the placeholder forever
		setLoadedImages((prev) => ({
			...prev,
			[url]: true,
		}));
	};

	const { mutate: addToCartMutation, isPending } = useMutation({
		mutationFn: async (productId: string) => {
			await addToCart(productId, 1, !!context.user);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: getCartQueryOptions().queryKey,
			});
			toast.success(`${product.name} added to cart`);
		},
		onError: (error) => toast.error(error.message),
	});

	const handleAddToCart = () => {
		const existingItem = cart.find((item) => item.product.id === product.id);

		// If product exists in cart, and we're trying to add more than available
		if (existingItem) {
			if (existingItem.quantity >= product.stock) {
				toast.error(
					`Cannot add more. Only ${product.stock} ${product.name} available in stock.`,
				);
				return;
			}

			if (existingItem.quantity + 1 > product.stock) {
				const available = product.stock - existingItem.quantity;
				toast.error(
					`Only ${available} more ${product.name} available in stock.`,
				);
				return;
			}
		}

		// If product doesn't exist in cart but is out of stock
		if (!existingItem && product.stock <= 0) {
			toast.error(`${product.name} is out of stock.`);
			return;
		}

		addToCartMutation(product.id);
	};

	return (
		<div>
			<div className="max-w-screen-xl mx-auto px-4">
				<div className="grid gap-y-2 py-0 lg:grid-cols-2 lg:gap-16 lg:py-10">
					<div className="-mx-4 -mb-6 -mt-4 sm:mb-0 md:mx-0 lg:mt-0">
						<Carousel
							className="relative"
							onMouseEnter={plugin.current.stop}
							onMouseLeave={plugin.current.reset}
							plugins={[plugin.current]}
							opts={{
								loop: true,
								align: "center",
							}}
						>
							<Carousel.Content>
								{product.images.map((image) => (
									<Carousel.Item
										className="md:basis-1/2 md:pl-6 lg:basis-full lg:pl-4"
										key={image.url}
									>
										<AspectRatio ratio={1}>
											{/* make a relative container so we can overlay the Blurhash */}
											<div className="relative size-full">
												{!loadedImages[image.url] && image.blurhash && (
													<div className="absolute inset-0">
														<Blurhash
															hash={image.blurhash}
															width="100%"
															height="100%"
															style={{ display: "block" }}
															className="md:rounded-lg lg:rounded-2xl"
														/>
													</div>
												)}
												<img
													src={image.url}
													alt={product.name}
													className={`size-full rounded-none object-cover object-center md:rounded-lg lg:rounded-2xl transition-opacity duration-300 ${
														loadedImages[image.url]
															? "opacity-100"
															: "opacity-0"
													}`}
													onLoad={() => handleImageLoad(image.url)}
													onError={() => handleImageError(image.url)}
												/>
											</div>
										</AspectRatio>
									</Carousel.Item>
								))}
							</Carousel.Content>
							<Carousel.Handler>
								<Carousel.Button segment="previous" />
								<Carousel.Button segment="next" />
							</Carousel.Handler>
						</Carousel>
					</div>
					<div className="mt-6 flex flex-col md:mt-0">
						<div className="flex-1 space-y-4">
							<h1 className="font-medium text-3xl leading-none tracking-tight lg:text-4xl mt-0">
								{product.name}
							</h1>
							<p className="text-muted-fg">{category?.name}</p>
							<p className="font-semibold text-2xl lg:text-3xl">
								{formatMoney(product.price)}
							</p>
							<div
								className="prose !text-sm/[1.6] tracking-normal lg:!text-base/[1.7] !text-muted-fg"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: I know
								dangerouslySetInnerHTML={{ __html: product.description }}
							/>
						</div>
						<div className="mt-6 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
							<Button
								size="lg"
								onPress={handleAddToCart}
								isPending={isPending}
								isDisabled={
									cart.some(
										(item) =>
											item.product.id === product.id &&
											item.quantity >= product.stock,
									) || product.stock <= 0
								}
							>
								{isPending ? <Loader /> : <IconAddToCartFill />}
								{product.stock <= 0
									? "Out of Stock"
									: isPending
										? "Adding to cart..."
										: "Add to cart"}
							</Button>
							<Button size="lg" intent="outline">
								<IconHeartFill />
								Add to Wishlist
							</Button>
						</div>
					</div>
				</div>
				{/*Reviews*/}
				<div className="mx-auto max-w-2xl py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8 lg:px-8 lg:py-32">
					<div className="lg:col-span-4">
						<h2 className="font-semibold text-2xl tracking-tight">
							Customer Reviews
						</h2>
						<div className="mt-3 flex items-center">
							<StarRating rating={product.avgRating ?? 0} />
							<p className="ml-2 text-sm">
								Based on {product.totalReviews} reviews
							</p>
						</div>
						<div className="mt-6">
							<dl className="flex flex-col gap-y-3">
								{[5, 4, 3, 2, 1].map((star) => {
									// compute percent from product counts and totalReviews
									const countKey =
										star === 5
											? product.count5StarReviews
											: star === 4
												? product.count4StarReviews
												: star === 3
													? product.count3StarReviews
													: star === 2
														? product.count2StarReviews
														: product.count1StarReviews;
									const percent =
										product.totalReviews > 0
											? Math.round((countKey / product.totalReviews) * 100)
											: 0;

									return (
										<div key={star} className="flex items-center text-sm">
											<dt className="flex flex-1 items-center">
												<p className="w-3 font-medium">{star}</p>
												<div className="ml-1 flex flex-1 items-center">
													<IconStarFill className="text-yellow-400 h-5 w-5 shrink-0" />
													<div className="relative ml-3 flex-1">
														<ProgressBar
															aria-label={`Rating: ${star} stars`}
															value={percent}
															className="**:data-[slot=progress-content]:bg-yellow-400"
														/>
													</div>
												</div>
											</dt>
										</div>
									);
								})}
							</dl>
						</div>
						<div className="mt-10">
							<Card.Header>
								<Card.Title>Share your experience</Card.Title>
								<Card.Description>
									Help other shoppers by leaving a short review — mention fit,
									quality, and delivery. Reviews with photos are especially
									helpful.
								</Card.Description>
							</Card.Header>
							<Link
								className={buttonStyles({
									size: "lg",
									className: "mt-6 w-full",
								})}
								from="/store/$id"
								to="/store/$id"
								search={(prev) => ({
									...prev,
									newReview: true,
								})}
							>
								<IconPencilBoxFill />
								Write a Review
							</Link>
						</div>
					</div>
					<div className="mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
						<div className="flow-root -my-12 divide-y">
							{reviews && reviews.length > 0 ? (
								reviews.map((r) => (
									<div key={r.id} className="py-8">
										<div className="flex items-center">
											<Avatar
												src={r.author.image}
												alt={r.author.name}
												size="lg"
												isSquare
												initials={getNameInitials(r.author.name)}
											/>
											<div className="flex flex-1 justify-between">
												<div className="ml-4">
													<p className="font-semibold">{r.author.name}</p>
													<p className="text-sm text-muted-fg">
														{format(new Date(r.createdAt), "MMM d, yyyy")}
													</p>
												</div>
												<div>
													<StarRating
														classNames={{ star: "size-4.5" }}
														rating={r.rating}
													/>
												</div>
											</div>
										</div>
										<div className="mt-4">
											<p className="text-sm leading-[1.7]">{r.comment}</p>
											<div className="flex gap-2 mt-2">
												{r.images?.map((image) => (
													<MetricCard
														classNames={{
															card: "size-28 md:size-32 flex",
															content:
																"p-0 overflow-hidden flex-1 flex isolate relative",
														}}
														key={image}
													>
														<button
															type="button"
															aria-label="Open image in fullscreen"
															className="p-0 m-0 w-full h-full bg-transparent border-0"
															onClick={(e) => {
																const btn =
																	e.currentTarget as HTMLButtonElement;
																const imgEl = btn.querySelector("img");
																if (imgEl)
																	activateImage(imgEl as HTMLImageElement);
															}}
															onKeyDown={(e) => {
																if (e.key === "Enter" || e.key === " ") {
																	e.preventDefault();
																	const btn =
																		e.currentTarget as HTMLButtonElement;
																	const imgEl = btn.querySelector("img");
																	if (imgEl)
																		activateImage(imgEl as HTMLImageElement);
																}
															}}
														>
															<img
																src={image}
																alt={product.name}
																className="w-full h-full object-cover flex-shrink-0"
															/>
														</button>
													</MetricCard>
												))}
											</div>
										</div>
									</div>
								))
							) : (
								<div className="py-8 text-sm text-muted-fg">No reviews yet</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<NewReviewModal />
		</div>
	);
}
