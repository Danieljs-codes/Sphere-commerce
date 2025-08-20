import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { Controller, useFormContext } from "react-hook-form";
import { Select } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import type { ProductFormData } from "@/lib/schema";
import { DatePicker } from "../ui/date-picker";
import { MetricCard } from "./metric-card";

function ProductVariantsPublishStep() {
	const { control, watch } = useFormContext<ProductFormData>();
	const status = watch("status");

	return (
		<>
			<MetricCard
				title="Publishing"
				description="Set product status. Schedule publishing to go live later."
				classNames={{
					content: "h-full",
				}}
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-1">
					<Controller
						control={control}
						name="status"
						render={({ field, fieldState }) => (
							<Select
								label="Status"
								selectedKey={field.value}
								onSelectionChange={(key) => field.onChange(key)}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							>
								<Select.Trigger />
								<Select.List
									items={[
										{ id: "draft", name: "Draft" },
										{ id: "active", name: "Active" },
										{ id: "scheduled", name: "Scheduled" },
									]}
								>
									{(item) => (
										<Select.Option id={item.id} textValue={item.name}>
											<Select.Label className="capitalize">
												{item.name}
											</Select.Label>
										</Select.Option>
									)}
								</Select.List>
							</Select>
						)}
					/>

					{status === "scheduled" && (
						<Controller
							control={control}
							name="publishAt"
							render={({ field }) => (
								<DatePicker
									label="Publish At"
									description="Choose the date to publish"
									value={
										field.value
											? parseDate(
													new Date(field.value).toISOString().slice(0, 10),
												)
											: null
									}
									onChange={(date) =>
										field.onChange(date?.toDate(getLocalTimeZone()).getTime())
									}
								/>
							)}
						/>
					)}
				</div>
			</MetricCard>

			<MetricCard title="SEO" description="Search engine metadata">
				<div className="grid grid-cols-1 gap-4">
					<Controller
						control={control}
						name="metaTitle"
						render={({ field, fieldState }) => (
							<TextField
								label="Meta Title"
								{...field}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							/>
						)}
					/>
					<Controller
						control={control}
						name="metaDescription"
						render={({ field, fieldState }) => (
							<Textarea
								label="Meta Description"
								{...field}
								isInvalid={fieldState.invalid}
								errorMessage={fieldState.error?.message}
							/>
						)}
					/>
				</div>
			</MetricCard>
		</>
	);
}

export default ProductVariantsPublishStep;
