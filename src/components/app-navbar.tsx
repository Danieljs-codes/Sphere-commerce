import { MetricCard } from "@components/admin/metric-card";
import {
	IconDashboard,
	IconHeart,
	IconLogout,
	IconSearch,
	IconShoppingBag,
} from "@intentui/icons";
import { $signOut } from "@server/auth";
import type { Product } from "@server/db/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Blurhash } from "react-blurhash";
import { toast } from "sonner";
import { Button, buttonStyles } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import type { NavbarProps } from "@/components/ui/navbar";
import {
	Navbar,
	NavbarGap,
	NavbarItem,
	NavbarMobile,
	NavbarProvider,
	NavbarSection,
	NavbarSeparator,
	NavbarSpacer,
	NavbarStart,
	NavbarTrigger,
} from "@/components/ui/navbar";
import { Separator } from "@/components/ui/separator";
import { useDebouncedValue } from "@/hooks/use-debounce-value";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import {
	getCartQueryOptions,
	searchProductsQueryOptions,
} from "@/lib/query-options";
import { cn, formatMoney, getNameInitials } from "@/lib/utils";
import type { User } from "@/types";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { CommandMenu } from "./ui/command-menu";
import { Menu } from "./ui/menu";

type AppNavbarProps = NavbarProps & {
	user: User | null;
};

function UserMenu({ user }: { user: User }) {
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { mutateAsync: signOut } = useMutation({
		mutationKey: ["auth", "sign-out"],
		mutationFn: () => $signOut(),
		onSuccess: async () => {
			await queryClient.resetQueries();
			await navigate({ to: "/" });
			await router.invalidate();
		},
		throwOnError: true,
	});

	return (
		<Menu>
			<Menu.Trigger>
				<Avatar initials={getNameInitials(user.name)} />
			</Menu.Trigger>
			<Menu.Content
				popover={{
					placement: "bottom right",
				}}
				className="min-w-48"
			>
				<Menu.Header separator>
					<span className="block">{user.name}</span>
					<span
						className={cn(
							"font-normal text-muted-fg",
							user.isAdmin === true ? "uppercase" : "lowercase",
						)}
					>
						{user.isAdmin === true && (
							<Badge intent="success" isCircle className="mt-1">
								Admin
							</Badge>
						)}
						{user.isAdmin === false && user.email.toLowerCase()}
					</span>
				</Menu.Header>
				<Menu.Section>
					<Menu.Link to="/admin/dashboard">
						<IconDashboard />
						<Menu.Label>Dashboard</Menu.Label>
					</Menu.Link>
					<Menu.Link to="/orders">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							color="#000000"
							fill="none"
							data-slot="icon"
						>
							<path
								d="M8 16H15.2632C19.7508 16 20.4333 13.1808 21.261 9.06908C21.4998 7.88311 21.6192 7.29013 21.3321 6.89507C21.045 6.5 20.4947 6.5 19.3941 6.5H19M6 6.5H8"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							></path>
							<path
								d="M11 5.5C11.4915 4.9943 12.7998 3 13.5 3M16 5.5C15.5085 4.9943 14.2002 3 13.5 3M13.5 3V11"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							></path>
							<path
								d="M8 16L5.37873 3.51493C5.15615 2.62459 4.35618 2 3.43845 2H2.5"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							></path>
							<path
								d="M8.88 16H8.46857C7.10522 16 6 17.1513 6 18.5714C6 18.8081 6.1842 19 6.41143 19H17.5"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							></path>
							<circle
								cx="10.5"
								cy="20.5"
								r="1.5"
								stroke="currentColor"
								strokeWidth="1.5"
							></circle>
							<circle
								cx="17.5"
								cy="20.5"
								r="1.5"
								stroke="currentColor"
								strokeWidth="1.5"
							></circle>
						</svg>
						<Menu.Label>Orders</Menu.Label>
					</Menu.Link>
					<Menu.Link to="/wishlist">
						<IconHeart />
						<Menu.Label>Wishlist</Menu.Label>
					</Menu.Link>
					<Menu.Separator />
					<Menu.Item
						onPress={() =>
							toast.promise(signOut, {
								loading: "Signing you out...",
								success: "You have been signed out.",
								error: "Failed to sign out. Please try again.",
							})
						}
						isDanger
					>
						<IconLogout />
						Log out
					</Menu.Item>
				</Menu.Section>
			</Menu.Content>
		</Menu>
	);
}

export function AppNavbar({ user, ...props }: AppNavbarProps) {
	const pathname = useLocation({
		select: (s) => s.pathname,
	});

	const { data: cart } = useSuspenseQueryDeferred(getCartQueryOptions());
	return (
		<NavbarProvider>
			<Navbar {...props}>
				<NavbarStart className="p-0 md:p-0">
					<Link
						className="flex items-center gap-x-2 font-medium"
						aria-label="Go to homepage"
						to="/"
					>
						<Logo className="size-7" />
					</Link>
				</NavbarStart>
				<NavbarGap />
				<NavbarSection>
					<NavbarItem to="/" isCurrent={pathname.toLowerCase() === "/"}>
						Home
					</NavbarItem>

					{/* Main shop landing */}
					<NavbarItem
						to="/store"
						isCurrent={pathname.toLowerCase().includes("/store")}
					>
						Store
					</NavbarItem>

					<NavbarItem to="/orders" isCurrent={pathname === "/orders"}>
						Orders
					</NavbarItem>
					<NavbarItem to="/cart" isCurrent={pathname === "/cart"}>
						Cart
					</NavbarItem>
				</NavbarSection>
				<NavbarSpacer />
				<NavbarSection className="max-md:hidden">
					<SearchCommandMenu />
					<Link
						to="/cart"
						className={buttonStyles({
							isCircle: true,
							intent: "plain",
							size: "sq-sm",
							className: cn(
								pathname === "/cart" &&
									"[--btn-icon:var(--btn-fg)] [--btn-bg:var(--btn-overlay)]",
								"relative",
							),
						})}
						aria-label="Your Bag"
					>
						{cart.length > 0 && (
							<span className="absolute text-white bg-primary text-[10px] rounded-full size-4 -right-1 -top-1.5 flex items-center justify-center">
								{cart.map((item) => item.quantity).reduce((a, b) => a + b, 0)}
							</span>
						)}
						<IconShoppingBag />
					</Link>
					<ThemeToggle />
					<Separator orientation="vertical" className="mr-3 ml-1 h-5" />
					{user?.isAdmin === true ? (
						<UserMenu user={user} />
					) : user == null ? (
						<Link
							to="/sign-in"
							className={buttonStyles({
								isCircle: true,
								size: "sm",
							})}
						>
							Sign in
						</Link>
					) : null}
				</NavbarSection>
			</Navbar>
			<NavbarMobile>
				<NavbarTrigger />
				<NavbarSpacer />
				<SearchCommandMenu />
				<Link
					to="/cart"
					className={buttonStyles({
						isCircle: true,
						intent: "plain",
						size: "sq-sm",
						className: cn(
							pathname === "/cart" &&
								"[--btn-icon:var(--btn-fg)] [--btn-bg:var(--btn-overlay)]",
							"relative",
						),
					})}
					aria-label="Your Bag"
				>
					{cart.length > 0 && (
						<span className="absolute text-white bg-primary text-[10px] rounded-full size-4 -right-1 -top-1.5 flex items-center justify-center">
							{cart.map((item) => item.quantity).reduce((a, b) => a + b, 0)}
						</span>
					)}
					<IconShoppingBag />
				</Link>
				<ThemeToggle />
				<NavbarSeparator className="mr-2.5" />
				{user?.isAdmin === true ? (
					<UserMenu user={user} />
				) : user == null ? (
					<Link
						to="/sign-in"
						className={buttonStyles({
							isCircle: true,
							size: "xs",
							className: "rounded-full",
						})}
					>
						Sign in
					</Link>
				) : null}
			</NavbarMobile>
		</NavbarProvider>
	);
}

function SearchCommandMenu() {
	const navigate = useNavigate({ from: "/" });
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const { data, isSuspending } = useSuspenseQueryDeferred(
		searchProductsQueryOptions(debouncedSearch),
	);

	useEffect(() => {
		navigate({
			search: (prev) => ({ ...prev, search: debouncedSearch }),
		});
	}, [debouncedSearch, navigate]);

	return (
		<>
			<Button
				intent="plain"
				size="sq-sm"
				isCircle
				aria-label="Search for products"
				onPress={() => setIsOpen(true)}
			>
				<IconSearch />
			</Button>
			<CommandMenu
				className="bg-zinc-100 p-(--gutter) [--cmd-radius:calc(var(--radius-xl)-1px)] dark:bg-zinc-900 sm:[--gutter:--spacing(0.7)]"
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				isBlurred
				inputValue={search}
				onInputChange={(value) => setSearch(value)}
				isPending={isSuspending}
				shortcut="/"
			>
				<CommandMenu.Search
					className="inset-ring-border mb-(--gutter) sm:inset-ring sm:rounded-(--cmd-radius) sm:bg-bg"
					placeholder="Quick search products..."
				/>
				<CommandMenu.List className="inset-ring-border rounded-(--cmd-radius) border-t bg-bg sm:inset-ring sm:border-t-0">
					<CommandMenu.Section title="Products">
						{data?.map((product) => (
							<CommandMenu.Item
								textValue={product.name}
								key={product.id}
								className="gap-2 cursor-pointer"
								onPress={async () => {
									await navigate({
										to: "/store/$id",
										params: {
											id: product.id,
										},
									});
									setIsOpen(false);
								}}
							>
								<MetricCard
									classNames={{
										card: "size-10 flex",
										content: "p-0 overflow-hidden flex-1 flex isolate relative",
									}}
								>
									<ProductImage product={product} />
								</MetricCard>
								<div className="flex justify-between items-center">
									<CommandMenu.Label className="text-muted-fg truncate max-w-[20ch] md:max-w-[40ch]">
										{product.name}
									</CommandMenu.Label>
									<p className="text-sm font-medium tabular-nums">
										{formatMoney(product.price)}
									</p>
								</div>
							</CommandMenu.Item>
						))}
					</CommandMenu.Section>
				</CommandMenu.List>
			</CommandMenu>
		</>
	);
}

function ProductImage({ product }: { product: Product }) {
	const [imageLoaded, setImageLoaded] = useState(false);
	return (
		<>
			<img
				src={product.images[0].url}
				alt={product.name}
				className="size-full object-cover object-center"
				onLoad={() => setImageLoaded(true)}
			/>
			{!imageLoaded && (
				<Blurhash
					hash={product.images[0].blurhash}
					className="size-full object-cover object-center"
				/>
			)}
		</>
	);
}
