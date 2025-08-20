import { Paystack } from "paystack-sdk";

// biome-ignore lint/style/noNonNullAssertion: I know
export const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);
