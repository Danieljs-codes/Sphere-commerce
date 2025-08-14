import { db } from "@server/db";
import * as schema from "@server/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg", // or "mysql", "sqlite"
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 3 * 60, // 3 minutes
		},
	},
	user: {
		additionalFields: {
			isAdmin: {
				type: "boolean",
				input: false,
				defaultValue: false,
			},
		},
	},
});

export default auth;
