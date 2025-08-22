import { $handlePayment } from "@server/customers/checkout";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod/v4";

export const Route = createFileRoute("/(customer)/payment-callback")({
	validateSearch: z.object({
		trxref: z.string().min(1).optional(),
		reference: z.string().min(1),
	}),
	loaderDeps: ({ search }) => ({ ...search }),
	loader: async ({ deps }) => {
		if (!deps.reference) {
			throw new Error("Reference is required for payment callback");
		}

		const response = await $handlePayment({
			data: {
				trxref: deps.trxref,
				reference: deps.reference,
			},
		});

		return;
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/(customer)/payment-callback"!</div>;
}
