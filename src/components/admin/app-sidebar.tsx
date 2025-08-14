import {
	IconBuildingFill,
	IconChevronsY,
	IconCircleHalf,
	IconCircleQuestionmarkFill,
	IconDashboardFill,
	IconDotsHorizontal,
	IconMessageFill,
	IconNotesFill,
	IconSettingsFill,
	IconShieldFill,
	IconTicketFill,
	IconTruckFill,
} from "@intentui/icons";
import {
	IconCategoryFilled,
	IconDiscountFilled,
	IconSettingsFilled,
} from "@tabler/icons-react";
import { useLocation } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Link } from "@/components/ui/link";
import { Menu } from "@/components/ui/menu";
import {
	Sidebar,
	SidebarContent,
	SidebarDisclosure,
	SidebarDisclosureGroup,
	SidebarDisclosurePanel,
	SidebarDisclosureTrigger,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
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
	const { theme, setTheme } = useTheme();
	const pathname = useLocation({
		select: (s) => s.pathname,
	});
	const { setIsOpenOnMobile } = useSidebar();

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

					<SidebarDisclosureGroup defaultExpandedKeys={[1]}>
						<SidebarDisclosure id={1}>
							<SidebarDisclosureTrigger>
								<IconDotsHorizontal />
								<SidebarLabel>Support</SidebarLabel>
							</SidebarDisclosureTrigger>
							<SidebarDisclosurePanel>
								<SidebarItem href="#" tooltip="Tickets">
									<IconTicketFill />
									<SidebarLabel>Tickets</SidebarLabel>
								</SidebarItem>
								<SidebarItem href="#" tooltip="Chat Support">
									<IconMessageFill />
									<SidebarLabel>Chat Support</SidebarLabel>
								</SidebarItem>
								<SidebarItem href="#" tooltip="FAQ">
									<IconCircleQuestionmarkFill />
									<SidebarLabel>FAQ</SidebarLabel>
								</SidebarItem>
								<SidebarItem href="#" tooltip="Documentation">
									<IconNotesFill />
									<SidebarLabel>Documentation</SidebarLabel>
								</SidebarItem>
							</SidebarDisclosurePanel>
						</SidebarDisclosure>
					</SidebarDisclosureGroup>
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
						<Menu.Item href="#logout">
							<IconLogoutSquare />
							Log out
						</Menu.Item>
					</Menu.Content>
				</Menu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
