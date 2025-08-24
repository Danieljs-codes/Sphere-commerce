import { IconStarFill } from "@intentui/icons";
import { useState } from "react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
	rating: number; // Current rating (0–5, supports decimals in display mode)
	onChange?: (value: number) => void; // Callback when user selects rating
	interactive?: boolean; // Whether it's for display or user input
	max?: number; // Default 5 stars
	classNames?: {
		container?: string;
		star?: string;
	};
};

export const StarRating = ({
	rating,
	onChange,
	interactive = false,
	max = 5,
	classNames,
}: StarRatingProps) => {
	const [hover, setHover] = useState<number | null>(null);

	const displayValue = hover !== null ? hover : rating;

	return (
		<div className={cn("flex items-center", classNames?.container)}>
			{Array.from({ length: max }, (_, i) => {
				const starIndex = i + 1;
				const isFilled = starIndex <= displayValue;

				return (
					<IconStarFill
						key={starIndex}
						className={cn(
							"size-5 cursor-pointer transition-colors",
							isFilled ? "text-yellow-500 fill-yellow-500" : "text-muted-fg",
							interactive && "hover:scale-110",
							classNames?.star,
						)}
						onMouseEnter={() => interactive && setHover(starIndex)}
						onMouseLeave={() => interactive && setHover(null)}
						onClick={() => interactive && onChange?.(starIndex)}
					/>
				);
			})}
		</div>
	);
};
