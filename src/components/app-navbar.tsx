import {
	IconCube,
	IconDashboard,
	IconHeart,
	IconHome,
	IconLogout,
	IconNotes,
	IconSearch,
	IconShoppingBag,
} from "@intentui/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
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
import { authClient } from "@/lib/auth-client";
import { cn, getNameInitials } from "@/lib/utils";
import type { User } from "@/types";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { CommandMenu } from "./ui/command-menu";
import { Menu } from "./ui/menu";

const categories = [
	{ id: 1, label: "Electronics", url: "#" },
	{ id: 2, label: "Fashion", url: "#" },
	{ id: 3, label: "Home & Kitchen", url: "#" },
	{ id: 4, label: "Sports", url: "#" },
	{ id: 5, label: "Books", url: "#" },
	{ id: 6, label: "Beauty & Personal Care", url: "#" },
	{ id: 7, label: "Grocery", url: "#" },
	{ id: 8, label: "Toys & Games", url: "#" },
	{ id: 9, label: "Automotive", url: "#" },
	{ id: 10, label: "Health & Wellness", url: "#" },
];

// Simple label → slug for query params like ?category=electronics
function toSlug(label: string) {
	return label
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

type AppNavbarProps = NavbarProps & {
	user: User | null;
};

function UserMenu({ user }: { user: User }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const handleSignOut = async () => {
		await authClient.signOut({
			// fetchOptions: {
			// 	onSuccess: () => {
			// 		queryClient.removeQueries({
			// 			queryKey: convexQuery(api.user.getSignedInUser, {}).queryKey,
			// 		});
			// 		router.invalidate();
			// 	},
			// },
		});
	};

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
							toast.promise(handleSignOut, {
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
						to="/products"
						isCurrent={pathname.toLowerCase() === "/products"}
					>
						Shop
					</NavbarItem>

					{/* Helpful top-level pages */}
					<NavbarItem
						to="/about"
						isCurrent={pathname.toLowerCase() === "/about"}
					>
						About
					</NavbarItem>

					{/* Quick category shortcuts (adjust or expand as needed) */}
					{categories.slice(0, 4).map((c) => (
						// @ts-expect-error - To be fixed
						<NavbarItem key={c.id} to={`/products?category=${toSlug(c.label)}`}>
							{c.label}
						</NavbarItem>
					))}

					{/* Optional: restore later when routes exist
          <NavbarItem to="/">Offers</NavbarItem>
          <NavbarItem to="/">Orders</NavbarItem>
          */}
				</NavbarSection>
				<NavbarSpacer />
				<NavbarSection className="max-md:hidden">
					<SearchCommandMenu />
					<Button intent="plain" size="sq-sm" isCircle aria-label="Your Bag">
						<IconShoppingBag />
					</Button>
					<ThemeToggle />
					<Separator orientation="vertical" className="mr-3 ml-1 h-5" />
					{user ? (
						<UserMenu user={user} />
					) : (
						<Link
							to="/sign-in"
							className={buttonStyles({
								isCircle: true,
								size: "sm",
							})}
						>
							Sign in
						</Link>
					)}
				</NavbarSection>
			</Navbar>
			<NavbarMobile>
				<NavbarTrigger />
				<NavbarSpacer />
				<SearchCommandMenu />
				<Button intent="plain" size="sq-sm" isCircle aria-label="Your Bag">
					<IconShoppingBag />
				</Button>
				<ThemeToggle />
				<NavbarSeparator className="mr-2.5" />
				{user ? (
					<UserMenu user={user} />
				) : (
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
				)}
			</NavbarMobile>
		</NavbarProvider>
	);
}

function SearchCommandMenu() {
	const [isOpen, setIsOpen] = useState(false);
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
			>
				<CommandMenu.Search
					className="inset-ring-border mb-(--gutter) sm:inset-ring sm:rounded-(--cmd-radius) sm:bg-bg"
					placeholder="Quick search products..."
				/>
				<CommandMenu.List className="inset-ring-border rounded-(--cmd-radius) border-t bg-bg sm:inset-ring sm:border-t-0">
					<CommandMenu.Section title="Pages">
						<CommandMenu.Item textValue="Home" href="#">
							<IconHome />
							<CommandMenu.Label>Home</CommandMenu.Label>
						</CommandMenu.Item>
						<CommandMenu.Item textValue="Docs" href="#">
							<IconNotes />
							<CommandMenu.Label>Docs</CommandMenu.Label>
							<CommandMenu.Keyboard keys="⌘k" />
						</CommandMenu.Item>
						<CommandMenu.Item textValue="Components" href="#">
							<IconCube />
							<CommandMenu.Label>Components</CommandMenu.Label>
						</CommandMenu.Item>
					</CommandMenu.Section>
					<CommandMenu.Section title="Team">
						{users.map((user) => (
							<CommandMenu.Item textValue={user.name} key={user.id}>
								<Avatar src={user.image_url} />
								<CommandMenu.Label>{user.name}</CommandMenu.Label>
							</CommandMenu.Item>
						))}
					</CommandMenu.Section>
				</CommandMenu.List>
			</CommandMenu>
		</>
	);
}

const users = [
	{
		id: 1,
		name: "Barbara Kirlin Sr.",
		image_url: "https://i.pravatar.cc/150?img=1",
	},
	{
		id: 2,
		name: "Rosemarie Koch",
		image_url: "https://i.pravatar.cc/150?img=2",
	},
	{
		id: 3,
		name: "Mrs. Reva Heaney Jr.",
		image_url: "https://i.pravatar.cc/150?img=3",
	},
	{ id: 5, name: "Bria Ziemann", image_url: "https://i.pravatar.cc/150?img=5" },
	{
		id: 6,
		name: "Heloise Borer Sr.",
		image_url: "https://i.pravatar.cc/150?img=6",
	},
];
