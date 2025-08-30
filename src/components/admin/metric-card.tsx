import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StrictOmit } from "@/types";

type MetricCardProps = {
	title?: ReactNode;
	description?: string;
	action?: ReactNode;
	classNames?: {
		card?: string;
		header?: string;
		title?: string;
		description?: string;
		action?: string;
		content?: string;
	};
	children?: ReactNode;
} & StrictOmit<ComponentPropsWithoutRef<"div">, "title">;

export function MetricCard({
	title,
	description,
	action,
	classNames,
	children,
	...props
}: MetricCardProps) {
	return (
		<Card
			className={cn("gap-y-0 bg-secondary/40 py-0", classNames?.card)}
			{...props}
		>
			{(title || description) && (
				<Card.Header className={cn("px-4 pt-2.5 pb-2", classNames?.header)}>
					<Card.Title className={cn("text-base/5", classNames?.title)}>
						{title}
					</Card.Title>
					{description && (
						<Card.Description
							className={cn("text-sm/5 text-muted-fg", classNames?.description)}
						>
							{description}
						</Card.Description>
					)}
					{action && (
						<Card.Action
							className={cn(
								"hidden self-end sm:grid w-full",
								classNames?.action,
							)}
						>
							{action}
						</Card.Action>
					)}
				</Card.Header>
			)}
			<Card.Content
				className={cn(
					"m-1 rounded-[calc(var(--radius-lg)-2.5px)] bg-bg p-(--card-spacing) ring ring-border",
					classNames?.content,
				)}
			>
				{children}
			</Card.Content>
		</Card>
	);
}
