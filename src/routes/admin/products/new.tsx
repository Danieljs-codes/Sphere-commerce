import { ProductBasicsStep } from "@components/admin/product-basics-step";
import ProductVariantsPublishStep from "@components/admin/product-variants-publish-step";
import { zodResolver } from "@hookform/resolvers/zod";
import { $createProduct } from "@server/products";
import { IconCircleChevronLeftFilled } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button, buttonStyles } from "@ui/button";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	getExistingCategoriesQueryOptions,
	getOverviewStatsQueryOptions,
	getProductPageQueryOptions,
	getProductStatsQueryOptions,
} from "@/lib/query-options";
import { type ProductFormData, productFormSchema } from "@/lib/schema";

export const Route = createFileRoute("/admin/products/new")({
	loader: async ({ context }) => {
		context.queryClient.ensureQueryData(getExistingCategoriesQueryOptions());
		return {
			title: "New Product",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const form = useForm<ProductFormData>({
		resolver: zodResolver(productFormSchema),
		defaultValues: {
			name: "",
			price: 1000,
			description: "",
			tags: [],
			images: [],
			status: "active",
			stockCount: 50,
			categoryId: "",
			metaTitle: "",
			metaDescription: "",
		},
		mode: "onChange",
	});

	const { mutate: createProduct, isPending } = useMutation({
		mutationKey: ["dashboard", "product"],
		mutationFn: async (data: ProductFormData) => {
			const formData = new FormData();
			Object.entries(data).forEach(([key, value]) => {
				if (key === "images" && Array.isArray(value)) {
					(value as File[]).forEach((file) => {
						formData.append("images", file);
					});
				} else if (Array.isArray(value)) {
					formData.append(key, JSON.stringify(value));
				} else {
					formData.append(key, value as any);
				}
			});

			return await $createProduct({ data: formData });
		},
		onSuccess: async (data) => {
			toast.success(data.message);
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: getProductStatsQueryOptions().queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: getProductPageQueryOptions({ numItems: 10, offset: 0 })
						.queryKey,
				}),
				queryClient.invalidateQueries({
					queryKey: getOverviewStatsQueryOptions().queryKey,
				}),
			]);
			navigate({
				to: "/admin/products",
			});
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<div>
			<div className="mb-8">
				<Link
					to=".."
					className={buttonStyles({ size: "sm", intent: "outline" })}
				>
					<IconCircleChevronLeftFilled data-slot="icon" />
					Back
				</Link>
			</div>
			<FormProvider {...form}>
				<div className="space-y-8">
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<ProductBasicsStep />
						<ProductVariantsPublishStep />
					</div>
					<div className="flex items-center justify-end pt-6 border-t gap-2">
						<Button
							type="button"
							intent="secondary"
							onPress={() => {
								const formData = form.getValues();
								console.log("Saving draft:", formData);
							}}
						>
							Save Draft
						</Button>
						<Button
							type="button"
							isPending={isPending}
							onPress={async () => {
								const isValid = await form.trigger();
								console.log(isValid, form.getValues());

								if (!isValid) {
									/* toast + return */
									return;
								}

								// Use FormData for file upload
								createProduct(form.getValues());
							}}
						>
							{isPending && <Loader />}
							{isPending ? "Creating product..." : "Create product"}
						</Button>
					</div>
				</div>
			</FormProvider>
		</div>
	);
}
