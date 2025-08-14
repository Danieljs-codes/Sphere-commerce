import { IconCircleHalf } from "@intentui/icons";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	return (
		<Tooltip delay={300} closeDelay={100}>
			<Button
				intent="plain"
				size="sq-sm"
				isCircle
				onPress={() =>
					setTheme(
						theme === "light" ? "dark" : theme === "dark" ? "system" : "light",
					)
				}
				aria-label="Toggle theme"
			>
				<IconCircleHalf />
			</Button>
			<Tooltip.Content intent="default" className="text-sm" showArrow={false}>
				Current theme:{" "}
				<span className="font-semibold">
					{theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "System"}
				</span>
			</Tooltip.Content>
		</Tooltip>
	);
};
