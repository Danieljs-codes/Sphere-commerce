import {
	IconBuildingFill,
	IconChevronsY,
	IconCircleHalf,
	IconDashboardFill,
	IconSettingsFill,
	IconShieldFill,
	IconTruckFill,
} from "@intentui/icons";
import { $signOut } from "@server/auth";
import {
	IconCategoryFilled,
	IconDiscountFilled,
	IconSettingsFilled,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { Loader } from "@ui/loader";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Link } from "@/components/ui/link";
import { Menu } from "@/components/ui/menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarLabel,
	SidebarLink,
	SidebarRail,
	SidebarSection,
	SidebarSectionGroup,
	useSidebar,
} from "@/components/ui/sidebar";
import { getNameInitials } from "@/lib/utils";
import type { User } from "@/types";
import { IconLogoutSquare } from "../icons/logout-square";
import { Logo } from "../logo";

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
	user: User;
};

export default function AppSidebar({ user, ...props }: AppSidebarProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate({ from: "/admin" });
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const pathname = useLocation({
		select: (s) => s.pathname,
	});
	const { setIsOpenOnMobile } = useSidebar();

	const { mutateAsync: signOut, isPending } = useMutation({
		mutationKey: ["auth", "sign-out"],
		mutationFn: () => $signOut(),
		onSuccess: async () => {
			await queryClient.resetQueries();
			await navigate({ to: "/sign-in" });
			await router.invalidate();
		},
		throwOnError: true,
	});

	// Listen to when pathname changes and close the sidebar
	// biome-ignore lint/correctness/useExhaustiveDependencies: I know what I am doing!!
	useEffect(() => {
		setIsOpenOnMobile(false);
	}, [pathname]);

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<Link
					className="flex items-center gap-x-2 group-data-[collapsible=dock]:size-10 group-data-[collapsible=dock]:justify-center"
					to="/"
				>
					<Logo className="size-6" />
					<SidebarLabel className="font-bold">
						Shop <span className="text-muted-fg font-normal">Sphere</span>
					</SidebarLabel>
				</Link>
			</SidebarHeader>
			<SidebarContent className="mask-b-from-95% mask-t-from-95%">
				<SidebarSectionGroup>
					<SidebarSection>
						<SidebarLink
							isCurrent={pathname.toLowerCase() === "/admin/dashboard"}
							to="/admin/dashboard"
							tooltip="Overview"
						>
							<IconDashboardFill />
							<SidebarLabel>Overview</SidebarLabel>
						</SidebarLink>

						<SidebarLink
							isCurrent={pathname.startsWith("/admin/products")}
							to="/admin/products"
							// search={(prev) => ({
							// 	numItems: prev.numItems || 10,
							// 	page: prev.page || 1,
							// 	filter: prev.filter || undefined,
							// })}
							tooltip="Products"
						>
							<IconBuildingFill />
							<SidebarLabel>Products</SidebarLabel>
						</SidebarLink>
						<SidebarLink
							isCurrent={pathname.toLowerCase() === "/admin/orders"}
							to="/admin/orders"
							tooltip="Orders"
						>
							<IconTruckFill />
							<SidebarLabel>Orders</SidebarLabel>
						</SidebarLink>
						<SidebarLink
							isCurrent={pathname.toLowerCase() === "/admin/categories"}
							to="/admin/categories"
							tooltip="Categories"
						>
							<IconCategoryFilled data-slot="icon" />
							<SidebarLabel>Categories</SidebarLabel>
						</SidebarLink>
						<SidebarLink
							isCurrent={pathname.toLowerCase() === "/admin/discounts"}
							to="/admin/discounts"
							tooltip="Discounts"
						>
							<IconDiscountFilled data-slot="icon" />
							<SidebarLabel>Discounts</SidebarLabel>
						</SidebarLink>
						<SidebarLink
							isCurrent={pathname.toLowerCase() === "/admin/settings"}
							to="/admin/settings"
							tooltip="Settings"
						>
							<IconSettingsFilled data-slot="icon" />
							<SidebarLabel>Settings</SidebarLabel>
						</SidebarLink>
					</SidebarSection>
				</SidebarSectionGroup>
			</SidebarContent>

			<SidebarFooter>
				<Menu>
					<Menu.Trigger className="group" aria-label="Profile">
						<Avatar isSquare initials={getNameInitials(user.name)} />
						<div className="in-data-[sidebar-collapsible=dock]:hidden text-sm">
							<SidebarLabel className="capitalize">
								{user.name.toLowerCase()}
							</SidebarLabel>
							<span className="-mt-0.5 block text-muted-fg lowercase w-[85%] truncate">
								{user.email.toLowerCase()}
							</span>
						</div>
						<IconChevronsY data-slot="chevron" />
					</Menu.Trigger>
					<Menu.Content
						className="in-data-[sidebar-collapsible=collapsed]:min-w-56 min-w-(--trigger-width)"
						placement="bottom right"
						dependencies={[isPending]}
					>
						<Menu.Section>
							<Menu.Header separator>
								<span className="block capitalize">
									{user.name.toLowerCase()}
								</span>
								<span className="font-normal text-muted-fg lowercase">
									{user.email.toLowerCase()}
								</span>
							</Menu.Header>
						</Menu.Section>

						<Menu.Item href="#dashboard">
							<IconDashboardFill />
							Dashboard
						</Menu.Item>
						<Menu.Item href="#settings">
							<IconSettingsFill />
							Settings
						</Menu.Item>
						<Menu.Item href="#security">
							<IconShieldFill />
							Security
						</Menu.Item>
						<Menu.Separator />

						<Menu.Item
							className="capitalize"
							onAction={() =>
								setTheme(
									theme === "light"
										? "dark"
										: theme === "dark"
											? "system"
											: "light",
								)
							}
						>
							<IconCircleHalf />
							Switch Theme ({theme})
						</Menu.Item>
						<Menu.Separator />
						<Menu.Item
							isDanger
							onAction={() =>
								toast.promise(signOut, {
									loading: "Signing you out...",
									success: "You have been signed out.",
									error: "Failed to sign out. Please try again.",
								})
							}
							isDisabled={isPending}
						>
							{isPending ? <Loader /> : <IconLogoutSquare />}
							Log out
						</Menu.Item>
					</Menu.Content>
				</Menu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
