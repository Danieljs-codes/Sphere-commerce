import { MetricCard } from "@components/admin/metric-card";
import { IconImageUpload } from "@components/icons/image-upload";
import { StarRating } from "@components/star-rating";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCircleXFill } from "@intentui/icons";
import { $createProductReview } from "@server/customers/reviews";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { DropZone } from "@ui/drop-zone";
import { Label } from "@ui/field";
import { Loader } from "@ui/loader";
import { Modal } from "@ui/modal";
import { Textarea } from "@ui/textarea";
import {
	FileTrigger,
	isFileDropItem,
	Button as UnstyledButton,
} from "react-aria-components";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getProductByIdQueryOptions } from "@/lib/query-options";
import {
	type NewReviewFormDataIn,
	type NewReviewFormDataOut,
	newReviewSchema,
} from "@/lib/schema";

export const NewReviewModal = () => {
	const queryClient = useQueryClient();
	const search = useSearch({ from: "/(customer)/store/$id" });
	const navigate = useNavigate({ from: "/store/$id" });
	const params = useParams({ from: "/(customer)/store/$id" });
	const isOpen = search.newReview;

	const { handleSubmit, setError, clearErrors, control, reset } = useForm<
		NewReviewFormDataIn,
		undefined,
		NewReviewFormDataOut
	>({
		resolver: zodResolver(newReviewSchema),
		defaultValues: {
			image: [],
			review: "",
			rating: 0,
		},
	});

	const { mutate: reviewProduct, isPending } = useMutation({
		mutationFn: async (data: NewReviewFormDataOut) => {
			// Convert to formdata
			const formData = new FormData();
			formData.append("productId", params.id);
			formData.append("rating", data.rating.toString());
			formData.append("review", data.review);
			data.image.forEach((file) => formData.append("image", file));
			await $createProductReview({
				data: formData,
			});
		},
		onError: (error) => toast.error(error.message),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: getProductByIdQueryOptions(params.id).queryKey,
			});
			reset();
			toast.success("Review submitted successfully");
			navigate({
				search: (prev) => ({ ...prev, newReview: false }),
				replace: true,
			});
		},
	});

	const onSubmit = (data: NewReviewFormDataOut) => {
		reviewProduct(data);
	};

	const MAX_IMAGES = 4;
	const MAX_SIZE = 2 * 1024 * 1024; // 2MB

	const addFiles = async (
		incoming: File[] | File,
		existing: File[] | undefined,
		onChange?: (v: File[] | File) => void,
	) => {
		clearErrors("image");
		const incomingFiles = Array.isArray(incoming) ? incoming : [incoming];
		if (incomingFiles.length === 0) return;
		// filter allowed image types
		const allowed = incomingFiles.filter((f) =>
			[
				f.type === "image/jpeg",
				f.type === "image/png",
				f.type === "image/webp",
			].some(Boolean),
		);
		if (allowed.length === 0) return;
		// filter out oversized files and report which were dropped
		const oversized = allowed.filter((f) => f.size > MAX_SIZE);
		if (oversized.length > 0) {
			setError("image", {
				type: "size",
				message: `Some images exceed 2MB and were not added.`,
			});
		}
		const valid = allowed.filter((f) => f.size <= MAX_SIZE);
		// merge with existing files, avoiding duplicates by name+lastModified
		const existingFiles = Array.isArray(existing) ? existing : [];
		const merged = [...existingFiles];
		for (const f of valid) {
			if (
				!merged.some(
					(e) => e.name === f.name && e.lastModified === f.lastModified,
				)
			) {
				merged.push(f);
			}
		}
		if (merged.length > MAX_IMAGES) {
			setError("image", {
				type: "max",
				message: `You can upload up to ${MAX_IMAGES} images.`,
			});
			onChange?.(merged.slice(0, MAX_IMAGES));
			return;
		}
		onChange?.(merged);
	};

	return (
		<Modal>
			<Modal.Content
				isOpen={isOpen}
				onOpenChange={(isOpen) => {
					clearErrors();
					navigate({
						search: (prev) => ({ ...prev, newReview: isOpen }),
						replace: true,
					});
				}}
				isBlurred
				size="xl"
			>
				<Modal.Header>
					<Modal.Title>Write a Review</Modal.Title>
					<Modal.Description>
						Your feedback is valuable to us. Please share your thoughts about
						this product.
					</Modal.Description>
				</Modal.Header>
				<Modal.Body>
					<form
						className="flex flex-col gap-4 justify-between"
						id="review-form"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div>
							<Controller
								name="rating"
								control={control}
								render={({ field, fieldState }) => (
									<div className="flex gap-2 text-right  items-center w-full mb-2">
										<StarRating
											rating={field.value}
											onChange={field.onChange}
											interactive
										/>
										{fieldState.error && (
											<p className="text-danger text-sm flex-1">
												{fieldState.error.message}
											</p>
										)}
									</div>
								)}
							/>
							<Controller
								control={control}
								name="review"
								render={({ field, fieldState }) => (
									<Textarea
										placeholder="Write your review here..."
										className="min-h-20"
										label="Review"
										{...field}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>
						</div>
						<Controller
							control={control}
							name="image"
							render={({ field, fieldState }) => {
								return (
									<div>
										<Label className="mb-1 font-medium">Upload an image</Label>
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
												const files: File[] = [];
												for (const item of imageItems) {
													const f = await item.getFile();
													if (f) files.push(f);
												}
												if (files.length === 0) return;
												addFiles(files, field.value, field.onChange);
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
															allowsMultiple={true}
															onSelect={(file) => {
																if (!file) return;
																const validFiles = Array.from(file);
																if (validFiles.length === 0) return;
																addFiles(
																	validFiles,
																	field.value,
																	field.onChange,
																);
															}}
														>
															<UnstyledButton className="text-primary underline">
																Choose images
															</UnstyledButton>{" "}
														</FileTrigger>
														to upload
													</div>
												</div>
											</div>
										</DropZone>
										<p className="text-muted-fg text-sm/5.5 group-disabled:opacity-50 mt-0.5 block sm:text-xs">
											Supports PNG, JPG, and WEBP formats. Maximum 2MB per
											image.
										</p>
										{fieldState.error && (
											<p className="text-base/6 text-danger group-disabled:opacity-50 sm:text-sm/6 forced-colors:text-[Mark]">
												{fieldState.error.message}
											</p>
										)}
										<div className="flex gap-2 shrink-0 flex-wrap mt-2">
											{Array.isArray(field.value) &&
												field.value.map((file) => (
													<MetricCard
														classNames={{
															card: "size-32 md:size-40 flex",
															content:
																"p-0 overflow-hidden flex-1 flex isolate relative",
														}}
														key={`${file.name}-${file.lastModified}`}
													>
														<img
															src={URL.createObjectURL(file)}
															alt={file.name}
															className="w-full h-full object-cover flex-shrink-0"
															onLoad={(e) =>
																URL.revokeObjectURL(e.currentTarget.src)
															}
														/>
														<Button
															size="sq-xs"
															intent="danger"
															className="absolute top-1 right-1 z-10 rounded-full"
															onPress={() => {
																const filtered =
																	field.value?.filter((f) => f !== file) || [];
																field.onChange(filtered);
																if (filtered.length === 0) clearErrors("image");
															}}
														>
															<IconCircleXFill />
														</Button>
													</MetricCard>
												))}
										</div>
									</div>
								);
							}}
						/>
					</form>
				</Modal.Body>
				<Modal.Footer>
					<Modal.Close>Close</Modal.Close>
					<Button type="submit" form="review-form" isPending={isPending}>
						{isPending && <Loader />}
						{isPending ? "Submitting..." : "Submit"}
					</Button>
				</Modal.Footer>
			</Modal.Content>
		</Modal>
	);
};
