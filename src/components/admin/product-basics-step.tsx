import { IconCircleXFill } from "@intentui/icons";
import { Badge } from "@ui/badge";
import { Button as UIButton } from "@ui/button";
import { DropZone } from "@ui/drop-zone";
import { NumberField } from "@ui/number-field";
import { Select } from "@ui/select";
import { TextField } from "@ui/text-field";
import { useId } from "react";
import { Button, FileTrigger, isFileDropItem } from "react-aria-components";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useSuspenseQueryDeferred } from "@/hooks/use-suspense-query-deferred";
import { getExistingCategoriesQueryOptions } from "@/lib/query-options";
import type { ProductFormData } from "@/lib/schema";
import { IconImageUpload } from "../icons/image-upload";
import { MetricCard } from "./metric-card";
import { RichTextEditor } from "./rich-text-editor";

const formatOptions = {
	style: "currency",
	currency: "NGN",
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
	compactDisplay: "short",
	currencyDisplay: "narrowSymbol",
} satisfies Intl.NumberFormatOptions;

export const ProductBasicsStep = () => {
	const { data: categories } = useSuspenseQueryDeferred(
		getExistingCategoriesQueryOptions(),
	);
	useId();

	const {
		control,
		watch,
		setValue,
		formState: { errors },
	} = useFormContext<ProductFormData>();

	const uploadedImages = watch("images");

	return (
		<>
			<MetricCard
				title="Basic Information"
				description="Enter the basic information for the product."
				classNames={{
					content: "h-full",
				}}
			>
				<div className="flex flex-col gap-4">
					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<TextField
								label="Product Name"
								{...field}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							/>
						)}
					/>
					<Controller
						control={control}
						name="price"
						render={({ field, fieldState }) => (
							<NumberField
								label="Price"
								formatOptions={formatOptions}
								{...field}
								onChange={(value) =>
									field.onChange(typeof value !== "number" ? 100 : value)
								}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							/>
						)}
					/>
					<Controller
						control={control}
						name="description"
						render={({ field, fieldState }) => (
							<RichTextEditor
								label="Description"
								{...field}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							/>
						)}
					/>
					<Controller
						control={control}
						name="categoryId"
						render={({ field, fieldState }) => (
							<Select
								label="Category"
								description="Choose a category for your product"
								placeholder="Select category"
								{...field}
								selectedKey={field.value}
								onSelectionChange={field.onChange}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							>
								<Select.Trigger />
								<Select.List items={categories}>
									{(item) => (
										<Select.Option id={item.id} textValue={item.name}>
											<Select.Label className="capitalize">
												{item.name.toLowerCase()}
											</Select.Label>
										</Select.Option>
									)}
								</Select.List>
							</Select>
						)}
					/>
				</div>
			</MetricCard>
			<div>
				<MetricCard
					title="Product Images"
					description="Upload images for your product. You can add multiple images."
				>
					<Controller
						control={control}
						name="images"
						render={({ field }) => (
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

									// Get all dropped files
									const files = await Promise.all(
										imageItems.map((item) => item.getFile()),
									);

									const existingFiles = field.value;
									const newFiles: Array<File> = [];
									const duplicateFiles: Array<string> = [];

									files.forEach((file) => {
										const isDuplicate = existingFiles.some(
											(existing) => existing.name === file.name,
										);
										if (isDuplicate) {
											duplicateFiles.push(file.name);
										} else {
											newFiles.push(file);
										}
									});

									if (duplicateFiles.length > 0) {
										if (duplicateFiles.length === 1) {
											toast.error(
												`File "${duplicateFiles[0]}" is already uploaded`,
											);
										} else {
											toast.error(
												`${duplicateFiles.length} files are already uploaded`,
											);
										}
									}

									if (newFiles.length > 0) {
										field.onChange([...field.value, ...newFiles]);
									}
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
												onSelect={(files) => {
													if (!files) return;
													const validFiles = Array.from(files);
													if (validFiles.length === 0) return;

													const existingFiles = field.value;
													const newFiles: Array<File> = [];
													const duplicateFiles: Array<string> = [];

													validFiles.forEach((file) => {
														const isDuplicate = existingFiles.some(
															(existing) => existing.name === file.name,
														);

														if (isDuplicate) {
															duplicateFiles.push(file.name);
														} else {
															newFiles.push(file);
														}
													});

													if (duplicateFiles.length > 0) {
														if (duplicateFiles.length === 1) {
															toast.error(
																`File "${duplicateFiles[0]}" is already uploaded`,
															);
														} else {
															toast.error(
																`${duplicateFiles.length} files are already uploaded`,
															);
														}
													}

													if (newFiles.length > 0) {
														field.onChange([...field.value, ...newFiles]);
													}
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
						)}
					/>
					<p className="text-muted-fg text-sm/5.5 group-disabled:opacity-50 mt-2 block sm:text-xs">
						Supports PNG, JPG, and WEBP formats. Maximum 2MB per image.
					</p>
					{errors.images && (
						<p className="text-base/6 text-danger group-disabled:opacity-50 sm:text-sm/6 forced-colors:text-[Mark]">
							{errors.images.message}
						</p>
					)}
					{uploadedImages.length > 0 ? (
						<div className="mt-4 flex flex-wrap gap-2">
							{uploadedImages.map((img) => {
								const imageUrl = URL.createObjectURL(img);
								return (
									<MetricCard
										classNames={{
											card: "size-32 md:size-40 flex",
											content:
												"p-0 overflow-hidden flex-1 flex isolate relative",
										}}
										key={img.name}
									>
										<img
											src={imageUrl}
											alt={img.name}
											className="w-full h-full object-cover flex-shrink-0"
											onLoad={() => URL.revokeObjectURL(imageUrl)}
										/>
										<UIButton
											size="sq-xs"
											intent="danger"
											className="absolute top-1 right-1 z-10 rounded-full"
											onPress={() => {
												setValue(
													"images",
													uploadedImages.filter(
														(file) => file.name !== img.name,
													),
													{
														shouldValidate: true,
													},
												);
												URL.revokeObjectURL(imageUrl);
											}}
										>
											<IconCircleXFill />
										</UIButton>
									</MetricCard>
								);
							})}
						</div>
					) : null}
					<div className="mt-4">
						<Controller
							control={control}
							name="tags"
							render={({
								field: { value, onChange, ...field },
								fieldState,
							}) => (
								<>
									<TextField
										label="Tags"
										placeholder="Add tags, separated by commas"
										value={value?.join(", ")}
										onChange={(value) => {
											const tags = value.split(",").map((tag) => tag.trim());
											onChange(tags);
										}}
										{...field}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
									<div className="flex flex-wrap gap-1 mt-2">
										{value?.filter(Boolean).map((tag) => (
											<Badge key={tag} className="capitalize">
												{tag.toLowerCase()}
												<IconCircleXFill
													onClick={() => {
														onChange(value?.filter((t) => t !== tag));
													}}
												/>
											</Badge>
										))}
									</div>
								</>
							)}
						/>
					</div>
				</MetricCard>
				<MetricCard
					title="Inventory"
					description="Set available stock for this product."
					classNames={{
						card: "mt-4",
					}}
				>
					<div className="flex flex-col gap-4">
						<Controller
							control={control}
							name="stockCount"
							render={({ field, fieldState }) => (
								<NumberField
									label="Stock Count"
									minValue={1}
									{...field}
									onChange={(value) =>
										field.onChange(Number.isNaN(value) ? 1 : value)
									}
									isInvalid={fieldState.invalid}
									errorMessage={fieldState.error?.message}
								/>
							)}
						/>
					</div>
				</MetricCard>
			</div>
		</>
	);
};
