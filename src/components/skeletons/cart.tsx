import { Card } from "@ui/card";
import { DescriptionList } from "@ui/description-list";
import { Link } from "@ui/link";
import { Skeleton } from "@ui/skeleton";

const CartSkeleton = () => {
	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-8">
				<Skeleton className="h-8 w-64 mb-2" />
				<Skeleton className="h-4 w-full max-w-xl" />
			</div>
			<div className="grid lg:gap-12 lg:grid-cols-2 gap-6 items-start grid-cols-1">
				<div>
					<div>
						{Array.from({ length: 3 }, (_, i) => (
							<div
								className="relative flex md:items-center md:flex-row sm:py-8 py-6 gap-2 flex-col border-b last:border-b-0"
								key={i}
							>
								<div className="flex items-center flex-grow gap-x-4">
									<Skeleton className="sm:size-14 sm:*:size-14 size-12 *:size-12 rounded-lg" />
									<div>
										<Skeleton className="h-5 w-48 mb-1" />
										<Skeleton className="h-4 w-20" />
									</div>
								</div>
								<div className="flex gap-x-2 justify-end md:justify-between items-center">
									<div className="flex items-center overflow-hidden rounded-full border p-0.5">
										<Skeleton className="size-8 rounded-full" />
										<Skeleton className="h-4 w-8 mx-2" />
										<Skeleton className="size-8 rounded-full" />
									</div>
									<Skeleton className="size-8" />
								</div>
							</div>
						))}
					</div>
					<div className="flex items-center sm:justify-end justify-center mt-4">
						<Link
							to="/store"
							className="lg:block text-primary-subtle-fg text-sm font-medium cursor-pointer hidden hover:underline"
						>
							Continue Shopping
						</Link>
					</div>
				</div>
				<div>
					<Card.Header className="mb-4">
						<Card.Title>
							<Skeleton className="h-6 w-32" />
						</Card.Title>
						<Card.Description>
							<Skeleton className="h-4 w-64" />
						</Card.Description>
					</Card.Header>
					<div>
						<DescriptionList className="mb-4">
							<DescriptionList.Term>
								<Skeleton className="h-4 w-16" />
							</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								<Skeleton className="h-4 w-20" />
							</DescriptionList.Details>
							<DescriptionList.Term>
								<Skeleton className="h-4 w-16" />
							</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								<Skeleton className="h-4 w-20" />
							</DescriptionList.Details>
							<DescriptionList.Term>
								<Skeleton className="h-4 w-16" />
							</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								<Skeleton className="h-4 w-20" />
							</DescriptionList.Details>
							<DescriptionList.Term>
								<Skeleton className="h-4 w-16" />
							</DescriptionList.Term>
							<DescriptionList.Details className="sm:text-right font-semibold">
								<Skeleton className="h-4 w-20" />
							</DescriptionList.Details>
						</DescriptionList>
						<Skeleton className="h-12 w-full mb-2" />
						<Skeleton className="h-4 w-64 mx-auto" />
					</div>
				</div>
			</div>
		</div>
	);
};

export { CartSkeleton };
