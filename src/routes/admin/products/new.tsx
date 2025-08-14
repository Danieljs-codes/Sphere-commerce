import { ProductBasicsStep } from "@components/admin/product-basics-step";
import ProductVariantsPublishStep from "@components/admin/product-variants-publish-step";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCircleChevronLeftFilled } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, buttonStyles } from "@ui/button";
import { Link } from "@ui/link";
import { Loader } from "@ui/loader";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { getExistingCategoriesQueryOptions } from "@/lib/query-options";
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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = Route.useNavigate();
	const form = useForm<ProductFormData>({
		resolver: zodResolver(productFormSchema),
		defaultValues: {
			name: "",
			price: 0,
			description: "",
			tags: [],
			images: [],
			status: "draft" as const,
			stockCount: 0,
			categoryId: "",
			metaTitle: "",
			metaDescription: "",
		},
		mode: "onChange",
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
							isPending={isSubmitting}
							// onPress={async () => {
							// 	const isValid = await form.trigger();
							// 	if (!isValid) {
							// 		/* toast + return */
							// 	}

							// 	setIsSubmitting(true);
							// 	try {
							// 		const values = form.getValues();

							// 		// Upload images sequentially (avoids flicker and rate spikes)
							// 		const storageIds: string[] = [];
							// 		for (const file of values.images) {
							// 			// const postUrl = await generateUploadUrl({});
							// 			const res = await fetch(postUrl, {
							// 				method: "POST",
							// 				headers: { "Content-Type": file.type },
							// 				body: file,
							// 			});
							// 			const json = (await res.json()) as {
							// 				storageId: string;
							// 			};
							// 			storageIds.push(json.storageId);
							// 		}

							// 		const priceKobo = Math.round(Number(values.price) * 100);

							// 		await createProduct({
							// 			name: values.name,
							// 			price: priceKobo,
							// 			description: values.description,
							// 			categoryId:
							// 				(values.categoryId as Id<"categories">) || undefined,
							// 			tags: values.tags || [],
							// 			images: storageIds as Array<Id<"_storage">>,
							// 			stockCount: Number(values.stockCount) || 0,
							// 			status: values.status,
							// 			publishAtMs: values.publishAt,
							// 			metaTitle: values.metaTitle || undefined,
							// 			metaDescription: values.metaDescription || undefined,
							// 		});
							// 	} finally {
							// 		setIsSubmitting(false);
							// 	}
							// }}
						>
							{isSubmitting && <Loader />}
							{isSubmitting ? "Creating product..." : "Create product"}
						</Button>
					</div>
				</div>
			</FormProvider>
		</div>
	);
}
