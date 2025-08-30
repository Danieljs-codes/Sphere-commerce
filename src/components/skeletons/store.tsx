import { IconFilterFill } from "@intentui/icons";
import { IconEyeFilled, IconHeartFilled } from "@tabler/icons-react";
import { Button } from "@ui/button";
import {
	Disclosure,
	DisclosureGroup,
	DisclosurePanel,
	DisclosureTrigger,
} from "@ui/disclosure";
import { Description, Label } from "@ui/field";
import { Separator } from "@ui/separator";
import { Sheet } from "@ui/sheet";
import { Skeleton } from "@ui/skeleton";

const StoreSkeleton = () => {
	return (
		<div className="mx-auto w-full max-w-(--breakpoint-xl)">
			<div>
				<Skeleton className="h-9 w-80 mb-2" />
				<Skeleton className="h-4 w-full max-w-[60ch]" />
			</div>
			<Separator className="-mx-[calc(50dvw_-_49.5%)] w-dvw my-6 sm:my-12" />
			<div className="flex justify-end">
				<Button
					size="sm"
					className="mb-4 lg:hidden"
					intent="outline"
					isDisabled
				>
					Filters
					<IconFilterFill />
				</Button>
			</div>
			<div className="grid-cols-1 lg:grid-cols-4 gap-16 lg:grid">
				<div className="hidden lg:block">
					<div className="flex flex-col gap-6">
						<DisclosureGroup defaultExpandedKeys={[1]}>
							<Disclosure id={1} className="border-0">
								<DisclosureTrigger>Categories</DisclosureTrigger>
								<DisclosurePanel>
									<div className="space-y-3 px-1">
										{Array.from({ length: 5 }, (_, i) => (
											<div key={i} className="flex items-center gap-2">
												<Skeleton className="h-4 w-4 rounded" />
												<Skeleton className="h-4 w-20" />
											</div>
										))}
									</div>
								</DisclosurePanel>
							</Disclosure>
						</DisclosureGroup>
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-full" />
						</div>
						<div className="gap-y-2 flex flex-col">
							<Label>Sort Prices</Label>
							<Description>Sort the products by price</Description>
							<div className="space-y-2">
								{Array.from({ length: 2 }, (_, i) => (
									<div key={i} className="flex items-center gap-2">
										<Skeleton className="h-4 w-4 rounded-full" />
										<div className="space-y-1">
											<Skeleton className="h-4 w-16" />
											<Skeleton className="h-3 w-32" />
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
				<div className="lg:col-span-3">
					<div className="py-6">
						<h2 className="sr-only">Products</h2>
						<div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{Array.from({ length: 12 }, (_, i) => (
								<div key={i} className="group relative">
									<div className="absolute top-2 right-2 z-10 flex translate-x-2 flex-col gap-y-1 opacity-0">
										<Button
											size="sq-xs"
											intent="secondary"
											className="rounded-full"
											isDisabled
										>
											<IconHeartFilled data-slot="icon" />
										</Button>
										<Button
											size="sq-xs"
											intent="secondary"
											className="rounded-full"
											isDisabled
										>
											<IconEyeFilled data-slot="icon" />
										</Button>
									</div>
									<div className="aspect-square w-full overflow-hidden rounded-2xl border border-fg/15">
										<Skeleton className="size-full" />
									</div>
									<div className="mt-4 text-sm">
										<div className="space-y-1">
											<Skeleton className="h-5 w-32" />
											<Skeleton className="h-4 w-full" />
										</div>
										<div className="mt-2 flex items-center justify-between">
											<Skeleton className="h-5 w-16" />
											<Skeleton className="h-4 w-20" />
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="flex items-center gap-2 justify-end">
						<Skeleton className="h-4 w-48" />
						<Separator orientation="vertical" className="h-4" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="h-8 w-12" />
						</div>
					</div>
				</div>
			</div>
			<Sheet>
				<Sheet.Content isOpen={false}>
					<Sheet.Header>
						<Sheet.Title>Filters</Sheet.Title>
					</Sheet.Header>
					<Sheet.Body>
						<div className="flex flex-col gap-6">
							<DisclosureGroup defaultExpandedKeys={[1]}>
								<Disclosure id={1} className="border-0">
									<DisclosureTrigger>Categories</DisclosureTrigger>
									<DisclosurePanel>
										<div className="space-y-3 px-1">
											{Array.from({ length: 5 }, (_, i) => (
												<div key={i} className="flex items-center gap-2">
													<Skeleton className="h-4 w-4 rounded" />
													<Skeleton className="h-4 w-20" />
												</div>
											))}
										</div>
									</DisclosurePanel>
								</Disclosure>
							</DisclosureGroup>
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-full" />
							</div>
							<div className="gap-y-3 flex flex-col">
								<Label>Sort Prices</Label>
								<Description>Sort the products by price</Description>
								<div className="space-y-2">
									{Array.from({ length: 2 }, (_, i) => (
										<div key={i} className="flex items-center gap-2">
											<Skeleton className="h-4 w-4 rounded-full" />
											<div className="space-y-1">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-3 w-32" />
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</Sheet.Body>
				</Sheet.Content>
			</Sheet>
		</div>
	);
};

export { StoreSkeleton };
