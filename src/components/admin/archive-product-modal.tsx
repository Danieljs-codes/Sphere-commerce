import type { Product } from "@server/db/schema";
import { $archiveProduct } from "@server/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	getProductPageQueryOptions,
	getProductStatsQueryOptions,
} from "@/lib/query-options";
import { IconArchive } from "../icons/archive";
import { Button } from "../ui/button";
import { Loader } from "../ui/loader";
import { Modal } from "../ui/modal";

type ArchiveProductModalProps = {
	product: Product | null;
	onOpenChange: (isOpen: boolean) => void;
};

export const ArchiveProductModal = ({
	product,
	onOpenChange,
}: ArchiveProductModalProps) => {
	const search = useSearch({ from: "/admin/products/" });
	const queryClient = useQueryClient();
	const { mutate: archiveProduct, isPending } = useMutation({
		mutationFn: async (productId: string) => {
			return $archiveProduct({
				data: { productId },
			});
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: getProductStatsQueryOptions().queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: getProductPageQueryOptions({
						numItems: search.numItems,
						offset: search.page * search.numItems - search.numItems,
						filter: search.filter,
					}).queryKey,
				}),
			]);
			toast.success("Product archived successfully");
			onOpenChange(false);
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<Modal>
			<Modal.Content
				isOpen={!!product}
				onOpenChange={onOpenChange}
				role="alertdialog"
				isBlurred
			>
				<Modal.Header>
					<Modal.Title>Archive Product</Modal.Title>
					<Modal.Description className="text-sm">
						Are you sure you want to archive this product? This will remove it
						from your store and customers will no longer be able to view or
						purchase it. You can restore it later if needed.
					</Modal.Description>
				</Modal.Header>
				<Modal.Footer className="flex-col">
					<Modal.Close isDisabled={isPending}>Cancel</Modal.Close>
					<Button
						intent="danger"
						isDisabled={isPending}
						onPress={() => archiveProduct(product?.id!)}
					>
						{isPending ? <Loader /> : <IconArchive />}
						{isPending ? "Archiving..." : "Archive"}
					</Button>
				</Modal.Footer>
			</Modal.Content>
		</Modal>
	);
};
