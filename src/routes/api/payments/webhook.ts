import { createHmac } from "node:crypto";
import { processPaymentOrder } from "@server/utils/payment";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { env } from "@/env";

// Separate function for webhook payment processing (no auth required)
async function processWebhookPayment(reference: string) {
	return processPaymentOrder(reference, "webhook");
}

export const ServerRoute = createServerFileRoute(
	"/api/payments/webhook",
).methods({
	POST: async ({ request }) => {
		console.log("Received webhook event");
		try {
			const body = await request.json();

			// Create HMAC hash for signature verification
			const hash = createHmac("sha512", env.PAYSTACK_SECRET_KEY)
				.update(JSON.stringify(body))
				.digest("hex");

			const signature = request.headers.get("x-paystack-signature");
			if (!signature || hash !== signature) {
				console.error("Invalid webhook signature");
				return new Response("Invalid signature", { status: 401 });
			}

			// Handle the webhook event
			const event = body;

			// @ts-expect-error - I don't know the types
			switch (event.event) {
				case "charge.success":
					// @ts-expect-error - I don't know the types

					await processWebhookPayment(event.data.reference);
					break;

				default:
					// @ts-expect-error - I don't know the types
					console.log(`Unhandled webhook event: ${event.event}`);
			}

			return new Response(null, { status: 200 });
		} catch (error) {
			console.error("Webhook processing error:", error);
			return new Response("Internal server error", { status: 500 });
		}
	},
	GET: async () => {
		// Handle GET requests if needed
		return new Response("GET request received", { status: 200 });
	},
});
