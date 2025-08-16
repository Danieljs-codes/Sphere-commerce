import { MetricCard } from "@components/admin/metric-card";
import { IconImageUpload } from "@components/icons/image-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCirclePlus, IconCircleXFill } from "@intentui/icons";
import { $createCategory } from "@server/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button as UIButton } from "@ui/button";
import { DropZone } from "@ui/drop-zone";
import { Label } from "@ui/field";
import { Loader } from "@ui/loader";
import { Modal } from "@ui/modal";
import { TextField } from "@ui/text-field";
import { Textarea } from "@ui/textarea";
import { Button, FileTrigger, isFileDropItem } from "react-aria-components";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	getExistingCategoriesQueryOptions,
	getExistingCategoriesWithPaginationQueryOptions,
} from "@/lib/query-options";
import {
	type CreateCategoryFormData,
	createCategorySchema,
} from "@/lib/schema";

export const NewCategoryModal = () => {
	const queryClient = useQueryClient();
	const newCategory = useSearch({
		from: "/admin/categories",
		select: (s) => s.new,
	});
	const navigate = useNavigate({ from: "/admin/categories" });

	const { control, handleSubmit, clearErrors, reset } =
		useForm<CreateCategoryFormData>({
			resolver: zodResolver(createCategorySchema),
			defaultValues: {
				name: "",
				description: "",
				file: undefined,
			},
		});

	const { mutateAsync: createCategory, isPending: isCreating } = useMutation({
		mutationKey: ["create-category"],
		mutationFn: async (data: CreateCategoryFormData) => {
			const formData = new FormData();
			formData.append("name", data.name);
			formData.append("description", data.description);
			formData.append("file", data.file);
			return $createCategory({
				data: formData,
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: getExistingCategoriesWithPaginationQueryOptions({
					page: 1,
					limit: 10 as const,
				}).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: getExistingCategoriesQueryOptions().queryKey,
			});
			reset();
			navigate({ search: (prev) => ({ ...prev, new: false }) });
		},
		throwOnError: true,
	});

	const onSubmit = (data: CreateCategoryFormData) => {
		toast.promise(createCategory(data), {
			loading: "Creating category...",
			success: "Category created successfully",
			error: "Failed to create category",
		});
	};

	return (
		<Modal>
			<Modal.Content
				isOpen={!!newCategory}
				onOpenChange={(isOpen) => {
					navigate({ search: (prev) => ({ ...prev, new: isOpen }) });
					if (!isOpen) {
						clearErrors();
					}
				}}
				isBlurred
			>
				<Modal.Header>
					<Modal.Title>New Category</Modal.Title>
					<Modal.Description>
						Enter a name for your new category. This will create a new category
						with no products.
					</Modal.Description>
				</Modal.Header>
				<Modal.Body>
					<form
						className="flex flex-col gap-4"
						onSubmit={handleSubmit(onSubmit)}
						id="new-category-form"
					>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextField label="Category Name" {...field} />
							)}
						/>
						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<Textarea label="Description" {...field} />
							)}
						/>
						<Controller
							control={control}
							name="file"
							render={({ field, fieldState }) => (
								<div className="flex flex-col gap-y-1">
									<Label>Category image</Label>
									<DropZone
										getDropOperation={(types) =>
											types.has("image/jpeg") ||
											types.has("image/png") ||
											types.has("image/webp")
												? "copy"
												: "cancel"
										}
										className="group/drop-zone relative z-10 flex max-h-56 items-center justify-center overflow-hidden rounded-lg p-6"
										onDrop={async (e) => {
											// Filter for valid image files
											const imageItems = e.items
												.filter(isFileDropItem)
												.filter(
													(dropItem) =>
														dropItem.type === "image/jpeg" ||
														dropItem.type === "image/png" ||
														dropItem.type === "image/webp",
												);

											if (imageItems.length === 0) return;

											const file = await imageItems[0].getFile();

											field.onChange(file);
										}}
									>
										<div className="grid space-y-3 py-6">
											<IconImageUpload className="mx-auto size-8 text-muted-fg" />
											<div className="flex items-center gap-x-2 text-center text-sm/6">
												<div className="leading-normal">
													Drag and drop to upload or <br />
													<FileTrigger
														acceptedFileTypes={[
															"image/png",
															"image/jpeg",
															"image/webp",
														]}
														allowsMultiple={false}
														onSelect={(file) => {
															if (!file) return;
															const validFiles = Array.from(file);
															if (validFiles.length === 0) return;
															field.onChange(validFiles[0]);
														}}
													>
														<Button className="text-primary underline">
															Choose images
														</Button>{" "}
													</FileTrigger>
													to upload
												</div>
											</div>
										</div>
									</DropZone>
									<p className="text-muted-fg text-sm/5.5 group-disabled:opacity-50 mt-0.5 block sm:text-xs">
										Supports PNG, JPG, and WEBP formats. Maximum 2MB per image.
									</p>
									{fieldState.error && (
										<p className="text-base/6 text-danger group-disabled:opacity-50 sm:text-sm/6 forced-colors:text-[Mark]">
											{fieldState.error.message}
										</p>
									)}
									{field.value && (
										<MetricCard
											classNames={{
												card: "size-32 md:size-40 flex",
												content:
													"p-0 overflow-hidden flex-1 flex isolate relative",
											}}
											key={field.value.lastModified}
										>
											<img
												src={URL.createObjectURL(field.value)}
												alt={field.value.name}
												className="w-full h-full object-cover flex-shrink-0"
												onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
											/>
											<UIButton
												size="sq-xs"
												intent="danger"
												className="absolute top-1 right-1 z-10 rounded-full"
												onPress={() => {
													field.onChange(undefined);
												}}
											>
												<IconCircleXFill />
											</UIButton>
										</MetricCard>
									)}
								</div>
							)}
						/>
					</form>
				</Modal.Body>
				<Modal.Footer>
					<Modal.Close>Cancel</Modal.Close>
					<UIButton
						type="submit"
						form="new-category-form"
						isPending={isCreating}
					>
						{isCreating ? <Loader /> : <IconCirclePlus />}
						{isCreating ? "Saving..." : "Save"}
					</UIButton>
				</Modal.Footer>
			</Modal.Content>
		</Modal>
	);
};
