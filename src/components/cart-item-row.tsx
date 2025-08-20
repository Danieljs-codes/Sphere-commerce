import { IconMinus, IconPlus, IconX } from "@intentui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@ui/avatar";
import { Button } from "@ui/button";
import { Card } from "@ui/card";
import { Loader } from "@ui/loader";
import { useState } from "react";
import { toast } from "sonner";
import { addToCart, removeFromCart } from "@/lib/carts";
import { getCartQueryOptions } from "@/lib/query-options";
import { formatMoney } from "@/lib/utils";
import type { Session } from "@/types";

interface CartItemRowProps {
	item: {
		productId: string;
		quantity: number;
		product: {
			name: string;
			price: number;
			images: { url: string }[];
			stock: number;
		};
	};
	user: Session | null;
}

export function CartItemRow({ item, user }: CartItemRowProps) {
	const queryClient = useQueryClient();
	const [removingAll, setRemovingAll] = useState(false);

	// ➕ Add one item
	const { mutate: addMutate, isPending: isAdding } = useMutation({
		mutationKey: ["addToCart", item.productId],
		mutationFn: async () => {
			await addToCart(item.productId, 1, !!user);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: getCartQueryOptions().queryKey,
			});
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: removeMutate, isPending: isRemoving } = useMutation({
		mutationKey: ["removeFromCart", item.productId],
		mutationFn: async (removeAll: boolean = false) => {
			setRemovingAll(removeAll);
			await removeFromCart(item.productId, 1, !!user, removeAll);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: getCartQueryOptions().queryKey,
			});
		},
		onSettled: () => {
			setRemovingAll(false);
		},
	});

	return (
		<div className="relative flex md:items-center md:flex-row sm:py-8 py-6 gap-2 flex-col border-b last:border-b-0">
			<div className="flex items-center flex-grow gap-x-4">
				<Avatar
					className="sm:size-14 sm:*:size-14 size-12 *:size-12"
					isSquare
					size="lg"
					src={item.product.images[0].url}
				/>
				<Card.Header>
					<Card.Title className="text-balance text-base">
						{item.product.name}
					</Card.Title>
					<Card.Description className="text-pretty text-sm/6">
						{formatMoney(item.product.price)}
					</Card.Description>
				</Card.Header>
			</div>

			<div className="flex gap-x-2 justify-end md:justify-between items-center">
				{/* Quantity controls */}
				<div className="flex items-center overflow-hidden rounded-full border p-0.5 font-mono text-[0.8125rem] tabular-nums">
					<Button
						size="sq-sm"
						intent="plain"
						isCircle
						onPress={() => removeMutate(false)}
						isPending={isRemoving && !removingAll}
						isDisabled={item.quantity === 1}
					>
						{isRemoving && !removingAll ? <Loader /> : <IconMinus />}
					</Button>
					<span className="px-2 text-center font-medium">{item.quantity}</span>
					<Button
						size="sq-sm"
						intent="plain"
						isCircle
						onPress={() => addMutate()}
						isPending={isAdding}
						isDisabled={item.quantity === item.product.stock}
					>
						{isAdding ? <Loader /> : <IconPlus />}
					</Button>
				</div>

				<div className="shrink-0">
					<Button
						size="sm"
						intent="plain"
						onPress={() => removeMutate(true)}
						isPending={isRemoving && removingAll}
					>
						{isRemoving && removingAll ? <Loader /> : <IconX />}
					</Button>
				</div>
			</div>
		</div>
	);
}
