import { IconAddToCartFill } from "@intentui/icons";
import type { Product } from "@server/db/schema";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { Button, buttonStyles } from "@ui/button";
import { Carousel } from "@ui/carousel";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { Modal } from "@ui/modal";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState } from "react";
import { Blurhash } from "react-blurhash";
import { toast } from "sonner";
import { addToCart } from "@/lib/carts";
import { getCartQueryOptions } from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";

export const PreviewProductModal = ({
	product,
	onOpenChange,
}: {
	product: (Product & { categoryName: string | null }) | null;
	onOpenChange: (isOpen: boolean) => void;
}) => {
	const queryClient = useQueryClient();
	const context = useRouteContext({ from: "/(customer)" });
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	const plugin = useRef(Autoplay({ delay: 1000, stopOnInteraction: true }));
	const { data: cart } = useSuspenseQuery(getCartQueryOptions());

	const { mutate: addToCartMutation, isPending } = useMutation({
		mutationFn: async (productId: string) => {
			await addToCart(productId, 1, !!context.user);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: getCartQueryOptions().queryKey,
			});
			toast.success(`${product?.name} added to cart`);
		},
		onError: (error) => toast.error(error.message),
	});

	const handleImageLoad = (url: string) => {
		setLoadedImages((prev) => ({
			...prev,
			[url]: true,
		}));
	};

	const handleAddToCart = () => {
		if (!product) return;

		const existingItem = cart.find((item) => item.product.id === product.id);

		// If product exists in cart and we're trying to add more than available
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
		<Modal>
			<Modal.Content
				size="4xl"
				isOpen={!!product}
				onOpenChange={onOpenChange}
				isBlurred
			>
				<div>
					<div className="grid lg:grid-cols-2">
						<Carousel
							className="group relative isolate"
							onMouseEnter={plugin.current.stop}
							onMouseLeave={plugin.current.reset}
							plugins={[plugin.current]}
							opts={{
								loop: true,
								align: "center",
							}}
						>
							<Carousel.Content>
								{product?.images.map((image) => (
									<Carousel.Item
										className="xd24r group relative min-w-0 shrink-0 grow-0 basis-full focus:outline-hidden focus-visible:outline-hidden h-[33rem] pl-4"
										key={image.url}
									>
										<div className="relative size-full">
											{!loadedImages[image.url] && image.blurhash && (
												<div className="absolute inset-0">
													<Blurhash
														hash={image.blurhash}
														width="100%"
														height="100%"
														style={{ display: "block" }}
													/>
												</div>
											)}
											<img
												className={`size-full object-cover object-center transition-opacity duration-300 ${
													loadedImages[image.url] ? "opacity-100" : "opacity-0"
												}`}
												src={image.url}
												alt={product.name}
												onLoad={() => handleImageLoad(image.url)}
												width={400}
												height={300}
											/>
										</div>
									</Carousel.Item>
								))}
							</Carousel.Content>
							<div className="opacity-0 group-hover:opacity-100 z-10 transition-opacity duration-300 ease-outl">
								<Carousel.Button
									intent="secondary"
									segment="previous"
									className="-translate-y-1/2 absolute top-1/2 left-2 transform z-50"
								/>
								<Carousel.Button
									intent="secondary"
									segment="next"
									className="-translate-y-1/2 absolute top-1/2 right-2 transform z-50"
								/>
							</div>
						</Carousel>
						<div className="p-6">
							<div className="h-full flex flex-col">
								<div className="h-full">
									<div className="flex flex-col">
										<h2 className="flex items-center font-medium text-2xl leading-none tracking-tight mb-1">
											{product?.name}
										</h2>
										<p className="text-muted-fg mb-2">
											{product?.categoryName}
										</p>
										<p className="font-semibold text-xl tabular-nums font-mono">
											{formatMoney(product?.price ?? 0)}
										</p>
									</div>
									<div
										className={`prose prose-sm prose-muted-fg! mt-4 line-clamp-3`}
										// biome-ignore lint/security/noDangerouslySetInnerHtml: I know
										dangerouslySetInnerHTML={{
											__html: product?.description ?? "",
										}}
									/>
									<Link
										to="/store/$id"
										params={{ id: product?.id! }}
										className="text-sm font-medium cursor-pointer text-fg underline"
									>
										Read more
									</Link>
									<div className="mt-6">
										<p className="text-muted-fg text-sm font-medium">Tags</p>
										<div className="flex flex-wrap gap-x-2 gap-y-1.5 mt-2">
											{product?.tags.map((tag) => (
												<Badge
													key={tag}
													className="capitalize"
													intent="secondary"
												>
													{tag.toLowerCase()}
												</Badge>
											))}
										</div>
									</div>
								</div>
								<div className="mt-6 mb-2 grid grid-cols-2 gap-2">
									<Button
										size="lg"
										onPress={handleAddToCart}
										isPending={isPending}
										isDisabled={
											cart.some(
												(item) =>
													item.product.id === product?.id &&
													item.quantity >= product?.stock,
											) || product?.stock <= 0
										}
									>
										{isPending ? <Loader /> : <IconAddToCartFill />}
										{product?.stock <= 0
											? "Out of Stock"
											: isPending
												? "Adding to cart..."
												: "Add to cart"}
									</Button>
									<Link
										to="/store/$id"
										params={{ id: product?.id! }}
										className={buttonStyles({ intent: "outline" })}
									>
										View Details
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Modal.Content>
		</Modal>
	);
};
