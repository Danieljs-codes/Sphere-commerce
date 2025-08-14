import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/schema";

export const $signIn = createServerFn({
	response: "raw",
	method: "POST",
})
	.validator(signInSchema)
	.handler(async ({ data }) => {
		const response = await auth.api.signInEmail({
			body: {
				email: data.email,
				password: data.password,
				rememberMe: data.rememberMe,
			},
			asResponse: true,
		});

		return response;
	});

export const $signUp = createServerFn({
	response: "raw",
	method: "POST",
})
	.validator(signUpSchema)
	.handler(async ({ data }) => {
		const response = await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
			},
			asResponse: true,
		});

		return response;
	});
