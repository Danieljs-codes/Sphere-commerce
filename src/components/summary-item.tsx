type SummaryItemProps = {
	label: string;
	value: string | number;
};

export const SummaryItem = ({ label, value }: SummaryItemProps) => {
	return (
		<div className="grid items-center grid-cols-[auto_1fr_auto] text-sm">
			<div className="text-muted-fg">{label}</div>
			<div className="mx-2 after:block after:h-[1.5px] after:grow after:bg-[repeating-linear-gradient(to_right,theme(--color-muted-fg/50%)_0,theme(--color-muted-fg/50%)_1.5px,_transparent_1.5px,_transparent_6px)] after:bg-repeat-x after:content-['']" />
			<div className="text-sm tabular-nums">{value}</div>
		</div>
	);
};
