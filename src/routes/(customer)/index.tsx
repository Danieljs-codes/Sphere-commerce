import { MetricCard } from "@components/admin/metric-card";
import { Logo } from "@components/logo";
import { ProgressiveBlur } from "@components/progressive-blur";
import { IconBrandX } from "@intentui/icons";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@ui/badge";
import { buttonStyles } from "@ui/button";
import { Carousel } from "@ui/carousel";
import { Link } from "@ui/link";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getExistingCategoriesQueryOptions } from "@/lib/query-options";

export const Route = createFileRoute("/(customer)/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			getExistingCategoriesQueryOptions(),
		);
	},
	component: App,
});

function App() {
	const { data: categories } = useSuspenseQueryDeferred(
		getExistingCategoriesQueryOptions(),
	);

	console.log(categories);

	return (
		<div className="py-6 sm:pt-24">
			<div className="mx-auto w-full max-w-screen-xl">
				{/* HERO SECTION */}
				<div className="max-w-3xl">
					<Badge className="inset-ring-primary/30" intent="primary">
						Free shipping on orders over $50
					</Badge>
					<h1 className="mt-4 text-pretty text-4xl text-fg tracking-tight sm:text-6xl font-medium">
						Discover products you’ll love — quality, value, delivered fast.
					</h1>
					<p className="mt-4 text-base sm:text-lg text-muted-fg text-pretty">
						Curated collections for home, tech, and everyday essentials —
						quality you can trust. Fast shipping, easy returns, and secure
						checkout. New arrivals added weekly.
					</p>
					<Link
						to="/store"
						className={buttonStyles({
							intent: "primary",
							size: "lg",
							className: "mt-6 lg:mt-8",
						})}
					>
						Shop Now
					</Link>
				</div>
				{/* HERO SECTION */}
				{/* SHOP BY CATEGORY */}
				<div className="mt-20">
					<h2 className="text-lg md:text-2xl font-semibold mb-4 md:mb-6">
						Shop By Categories
					</h2>
					<Carousel className="w-full" opts={{ loop: true }}>
						<Carousel.Content>
							{categories.map((category) => (
								<Carousel.Item
									key={category.id}
									className="basis-full md:basis-1/4 overflow-hidden isolate"
								>
									<AspectRatio ratio={1 / 1} className="relative">
										<img
											src={category.image ?? undefined}
											alt={category.name}
											className="rounded-xl object-cover size-full"
										/>

										{/* Noise overlay */}
										<div
											className="hidden md:block absolute inset-0 z-10 rounded-xl pointer-events-none"
											style={{
												backgroundImage:
													"url('https://grainy-gradients.vercel.app/noise.svg')",
												backgroundRepeat: "repeat",
												opacity: 1,
												mixBlendMode: "multiply",
											}}
										/>
										<div
											className="md:hidden pointer-events-none absolute bottom-0 left-0 z-20 h-[50%] w-full rounded-xl"
											style={{
												background:
													"linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
											}}
										/>
										<div className="hidden md:block">
											<ProgressiveBlur
												className="pointer-events-none absolute bottom-0 left-0 z-20 h-[50%] w-full rounded-xl"
												blurIntensity={6}
											/>
										</div>

										<div className="absolute bottom-0 left-0 z-30">
											<div className="flex flex-col items-start gap-0 px-5 py-4">
												<h3 className="text-base font-medium text-white capitalize">
													{category.name.toLowerCase()}
												</h3>
												<span className="mb-2 text-sm text-white/70 line-clamp-2">
													{category.description}
												</span>
											</div>
										</div>
										<Link
											to="/store"
											search={{
												category: [category.name.toLowerCase()],
											}}
											className="z-50 absolute inset-0"
										/>
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
				<div className="mt-20">
					<h3 className="text-xl font-semibold mb-4 md:mb-6">
						Why Shop With Us?
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
						<MetricCard
							title="Fast Shipping"
							classNames={{
								header: "p-2 block flex items-center justify-between",
								title:
									"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
								action: "w-fit",
								content: "mt-0 h-full",
							}}
						>
							<p className="text-sm text-muted-fg">
								We ship same or next day so you get your order fast. End-to-end
								tracking keeps you updated every step of the way. Most orders
								arrive within 2–4 business days.
							</p>
						</MetricCard>
						<MetricCard
							title="Secure Payments"
							classNames={{
								header: "p-2 block flex items-center justify-between",
								title:
									"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
								action: "w-fit",
								content: "mt-0 h-full",
							}}
						>
							<p className="text-sm text-muted-fg">
								All payments are encrypted and processed by trusted gateways. We
								support multiple payment methods for convenience. Your financial
								data is never shared.
							</p>
						</MetricCard>
						<MetricCard
							title="Hassle Free Returns"
							classNames={{
								header: "p-2 block flex items-center justify-between",
								title:
									"pl-0 font-mono font-medium! text-muted-fg text-xs sm:text-xs uppercase font-normal tracking-tight",
								action: "w-fit",
								content: "mt-0 h-full",
							}}
						>
							<p className="text-sm text-muted-fg">
								Easy 30-day returns with prepaid labels and fast refunds. Start
								a return online and get a prepaid label no restocking fees.
								Refunds are processed fast and our support team is ready to
								help.
							</p>
						</MetricCard>
					</div>
				</div>
				<footer className="flex items-center justify-between  -mb-12 mt-10">
					<div className="flex items-center gap-2">
						<Logo className="size-10" />
						<p className="text-lg font-medium">
							Shop <span className="text-muted-fg font-normal">Sphere</span>
						</p>
					</div>
					<p className="text-sm text-muted-fg">
						&copy; {new Date().getFullYear()} Your Company. All rights reserved.
					</p>
					<a
						href="https://x.com/Olamide_js"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 text-fg"
					>
						<IconBrandX className="size-6" />
						<p>Built By Olamide</p>
					</a>
				</footer>
			</div>
		</div>
	);
}
