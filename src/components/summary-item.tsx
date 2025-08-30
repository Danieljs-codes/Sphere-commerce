import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SummaryItemProps = {
	label: string;
	value: ReactNode;
	classNames?: {
		container?: string;
		label?: string;
		value?: string;
	};
};

export const SummaryItem = ({ label, value, classNames }: SummaryItemProps) => {
	return (
		<div
			className={cn(
				"grid items-center grid-cols-[auto_1fr_auto] text-sm",
				classNames?.container,
			)}
		>
			<div className={cn("text-muted-fg", classNames?.label)}>{label}</div>
			<div className="mx-2 after:block after:h-[1.5px] after:grow after:bg-[repeating-linear-gradient(to_right,theme(--color-muted-fg/50%)_0,theme(--color-muted-fg/50%)_1.5px,_transparent_1.5px,_transparent_6px)] after:bg-repeat-x after:content-['']" />
			<div className={cn("text-sm tabular-nums text-right", classNames?.value)}>
				{value}
			</div>
		</div>
	);
};
