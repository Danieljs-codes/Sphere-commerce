import { zodResolver } from "@hookform/resolvers/zod";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { $createDiscount } from "@server/discounts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@ui/button";
import { DatePicker } from "@ui/date-picker";
import { Modal } from "@ui/modal";
import { NumberField } from "@ui/number-field";
import { Select } from "@ui/select";
import { TextField } from "@ui/text-field";
import { Textarea } from "@ui/textarea";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getDiscountsQueryOptions } from "@/lib/query-options";
import {
	type CreateDiscountFormData,
	createDiscountSchema,
} from "@/lib/schema";

const items = [
	{ id: "percentage", label: "Percentage" },
	{ id: "fixed_amount", label: "Fixed amount" },
] as const;

export const NewDiscountModal = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate({ from: "/admin/discounts" });
	const search = useSearch({ from: "/admin/discounts" });
	const { control, handleSubmit, reset, clearErrors } =
		useForm<CreateDiscountFormData>({
			resolver: zodResolver(createDiscountSchema),
			defaultValues: {
				code: "",
				name: "",
				dates: {
					startsAt: new Date(),
					expiresAt: undefined,
				},
				description: "",
				type: undefined,
				value: Number.NaN,
				maximumDiscountAmount: null,
				minimumOrderAmount: null,
				usageLimit: null,
			},
		});
	const { mutate: createDiscount, isPending: isCreatingDiscount } = useMutation(
		{
			mutationFn: (data: CreateDiscountFormData) => $createDiscount({ data }),
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: getDiscountsQueryOptions(search).queryKey,
				});
				toast.success("Discount created successfully!");
				navigate({
					search: (prev) => ({ ...prev, new: false }),
					replace: true,
				});
				reset();
			},
			onError: (error) => toast.error(error.message),
		},
	);

	const onSubmit = (data: CreateDiscountFormData) => {
		createDiscount(data);
	};

	return (
		<Modal>
			<Modal.Content
				isOpen={search.new}
				onOpenChange={(isOpen) => {
					if (!isOpen) clearErrors();
					navigate({
						search: (prev) => ({ ...prev, new: isOpen }),
						replace: true,
					});
				}}
				isBlurred
				size="2xl"
				isDismissable={false}
			>
				<Modal.Header className="space-y-0">
					<Modal.Title>Create Discount</Modal.Title>
					<Modal.Description>
						Use this form to create a new discount code and configure its rules.
					</Modal.Description>
				</Modal.Header>
				<Modal.Body>
					<form
						id="create-discount-form"
						className="flex flex-col gap-4 pb-4"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="flex items-center gap-4">
							<Controller
								control={control}
								name="name"
								render={({ field, fieldState }) => (
									<TextField
										className="flex-1"
										{...field}
										label="Discount name"
										placeholder="e.g. Holiday Sale"
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
										// description={
										// 	isMobile
										// 		? undefined
										// 		: "Human-friendly name shown in the admin (e.g. Holiday Sale)"
										// }
									/>
								)}
							/>
							<Controller
								control={control}
								name="code"
								render={({ field, fieldState }) => (
									<TextField
										className="flex-1"
										{...field}
										onChange={(val) => field.onChange(val.toUpperCase())}
										label="Discount code"
										placeholder="e.g. SUMMER10"
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
										// description={
										// 	isMobile
										// 		? undefined
										// 		: "Code customers enter at checkout. It will be saved in uppercase."
										// }
									/>
								)}
							/>
						</div>
						<Controller
							control={control}
							name="description"
							render={({ field, fieldState }) => (
								<Textarea
									className="flex-1"
									{...field}
									label="Description"
									placeholder="e.g. This is a limited time offer."
									isInvalid={fieldState.invalid}
									errorMessage={fieldState.error?.message}
								/>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<Controller
								control={control}
								name="type"
								render={({ field, fieldState }) => (
									<Select
										className="col-span-1"
										label="Type"
										placeholder="Select type"
										{...field}
										onSelectionChange={(val) =>
											field.onChange(val as (typeof items)[number]["id"])
										}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									>
										<Select.Trigger />
										<Select.List items={items}>
											{(item) => (
												<Select.Option id={item.id} textValue={item.label}>
													{item.label}
												</Select.Option>
											)}
										</Select.List>
									</Select>
								)}
							/>

							<Controller
								control={control}
								name="value"
								render={({ field, fieldState }) => (
									<NumberField
										{...field}
										label="Value"
										placeholder="50"
										description={
											(field.value && typeof field.value === "number") ||
											fieldState.invalid
												? undefined
												: "Enter percentage (e.g. 20) or amount in naira"
										}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Controller
								control={control}
								name="minimumOrderAmount"
								render={({ field, fieldState }) => (
									<NumberField
										{...field}
										label="Minimum order amount"
										placeholder="e.g. 1000"
										value={field.value ? field.value : Number.NaN}
										onChange={(val) =>
											field.onChange(Number.isNaN(val) ? null : val)
										}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>

							<Controller
								control={control}
								name="maximumDiscountAmount"
								render={({ field, fieldState }) => (
									<NumberField
										{...field}
										label="Maximum discount amount"
										placeholder="e.g. 5000"
										value={field.value ? field.value : Number.NaN}
										onChange={(val) =>
											field.onChange(Number.isNaN(val) ? null : val)
										}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>
						</div>
						<Controller
							control={control}
							name="usageLimit"
							render={({ field, fieldState }) => (
								<NumberField
									{...field}
									value={field.value ?? Number.NaN}
									onChange={(val) => {
										field.onChange(Number.isNaN(val) ? null : val);
									}}
									label="Usage limit"
									placeholder="e.g. 100"
									isInvalid={fieldState.invalid}
									errorMessage={fieldState.error?.message}
								/>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<Controller
								control={control}
								name="dates.startsAt"
								render={({ field, fieldState }) => (
									<DatePicker
										label="Starts At"
										value={parseDate(field.value.toISOString().slice(0, 10))}
										onChange={(val) =>
											field.onChange(val?.toDate(getLocalTimeZone()))
										}
										onBlur={field.onBlur}
										isDisabled={field.disabled}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>
							<Controller
								control={control}
								name="dates.expiresAt"
								render={({ field, fieldState }) => (
									<DatePicker
										label="Expires At"
										value={
											field.value
												? parseDate(field.value.toISOString().slice(0, 10))
												: null
										}
										onChange={(val) =>
											field.onChange(val?.toDate(getLocalTimeZone()))
										}
										onBlur={field.onBlur}
										isDisabled={field.disabled}
										isInvalid={fieldState.invalid}
										errorMessage={fieldState.error?.message}
									/>
								)}
							/>
						</div>
					</form>
				</Modal.Body>
				<Modal.Footer className="border-t border-dashed">
					<Modal.Close>Cancel</Modal.Close>
					<Button
						type="submit"
						form="create-discount-form"
						isPending={isCreatingDiscount}
					>
						Create Discount
					</Button>
				</Modal.Footer>
			</Modal.Content>
		</Modal>
	);
};
