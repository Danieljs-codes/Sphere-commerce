import { IconAddToCartFill } from "@intentui/icons";
import type { Product } from "@server/db/schema";
import { Badge } from "@ui/badge";
import { Button, buttonStyles } from "@ui/button";
import { Carousel } from "@ui/carousel";
import { Link } from "@ui/link";
import { Modal } from "@ui/modal";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState } from "react";
import { Blurhash } from "react-blurhash";
import { formatMoney } from "@/lib/utils";

export const PreviewProductModal = ({
	product,
	onOpenChange,
}: {
	product: (Product & { categoryName: string | null }) | null;
	onOpenChange: (isOpen: boolean) => void;
}) => {
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	const plugin = useRef(Autoplay({ delay: 1000, stopOnInteraction: true }));

	const handleImageLoad = (url: string) => {
		setLoadedImages((prev) => ({
			...prev,
			[url]: true,
		}));
	};

	return (
		<Modal>
			<Modal.Content size="4xl" isOpen={!!product} onOpenChange={onOpenChange}>
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
										className={`text-muted-fg! mt-4 text-sm leading-[1.6] line-clamp-3`}
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
									<div className="flex flex-wrap gap-x-2 gap-y-1.5 mt-6">
										{product?.tags.map((tag) => (
											<Badge key={tag} className="capitalize">
												{tag.toLowerCase()}
											</Badge>
										))}
									</div>
								</div>
								<div className="mt-6 mb-2 grid grid-cols-2 gap-2">
									<Button size="lg">
										<IconAddToCartFill />
										Add to cart
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
