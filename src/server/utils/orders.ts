import crypto from "node:crypto";
import { z } from "zod/v4";
import { env } from "@/env";

const cursorSchema = z.object({
	createdAt: z.string().datetime(),
	id: z.string(),
});

type Cursor = z.infer<typeof cursorSchema>;

export function encodeCursor(data: Cursor): string {
	const parsed = cursorSchema.parse(data);

	const payload = JSON.stringify(parsed);
	const signature = crypto
		.createHmac("sha256", env.CURSOR_SIGNING_KEY)
		.update(payload)
		.digest("hex");

	return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}

export function decodeCursor(token: string): Cursor | null {
	try {
		const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
		const { payload, signature } = decoded as {
			payload: string;
			signature: string;
		};

		const expected = crypto
			.createHmac("sha256", env.CURSOR_SIGNING_KEY)
			.update(payload)
			.digest("hex");

		if (signature !== expected) return null;

		const cursor = cursorSchema.parse(JSON.parse(payload));
		return cursor;
	} catch {
		return null; // invalid token or malformed
	}
}
