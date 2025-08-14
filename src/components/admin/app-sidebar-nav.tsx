"use client";

import {
	IconCircleHalf,
	IconCommandRegular,
	IconDashboard,
	IconSettings,
} from "@intentui/icons";
import { IconMinusVertical } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { SidebarNav, SidebarTrigger } from "@/components/ui/sidebar";
import { getNameInitials } from "@/lib/utils";
import type { User } from "@/types";
import { IconLogoutSquare } from "../icons/logout-square";

export default function AppSidebarNav({
	title,
	user,
}: {
	title: string;
	user: User;
}) {
	return (
		<SidebarNav>
			<span className="flex items-center gap-x-0">
				<SidebarTrigger className="-ml-2" />
				<div className="flex items-center gap-x-2">
					<IconMinusVertical data-slot="icon" className="text-fg/70" />
					<span className="text-base font-semibold capitalize">
						{title.toLowerCase()}
					</span>
				</div>
			</span>
			<UserMenu user={user} />
		</SidebarNav>
	);
}

function UserMenu({ user }: { user: User }) {
	const { theme, setTheme } = useTheme();
	return (
		<Menu>
			<Menu.Trigger className="ml-auto md:hidden" aria-label="Open Menu">
				<Avatar
					isSquare
					alt={user.name}
					initials={getNameInitials(user.name)}
				/>
			</Menu.Trigger>
			<Menu.Content popover={{ placement: "bottom end" }} className="min-w-64">
				<Menu.Section>
					<Menu.Header separator>
						<span className="block capitalize">{user.name.toLowerCase()}</span>
						<span className="font-normal text-muted-fg lowercase">
							{user.email.toLowerCase()}
						</span>
					</Menu.Header>
				</Menu.Section>
				<Menu.Item href="#dashboard">
					<IconDashboard />
					<Menu.Label>Dashboard</Menu.Label>
				</Menu.Item>
				<Menu.Item href="#settings">
					<IconSettings />
					<Menu.Label>Settings</Menu.Label>
				</Menu.Item>
				<Menu.Separator />
				<Menu.Item>
					<IconCommandRegular />
					<Menu.Label>Command Menu</Menu.Label>
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
					<Menu.Label>Log out</Menu.Label>
				</Menu.Item>
			</Menu.Content>
		</Menu>
	);
}
