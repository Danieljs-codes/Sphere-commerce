import { setFlashCookie } from "@server/utils";
import { redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
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

export const $getSignedInUser = createServerFn({
	method: "GET",
}).handler(async () => {
	const request = getWebRequest();
	return await auth.api.getSession({
		headers: request.headers,
	});
});

export const $signOut = createServerFn({
	method: "POST",
	response: "raw",
}).handler(async () => {
	return await auth.api.signOut({
		headers: getWebRequest().headers,
		asResponse: true,
	});
});

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const session = await auth.api.getSession({
			headers: getWebRequest().headers,
		});

		return next({
			context: {
				session,
			},
		});
	},
);

export const adminMiddleware = createMiddleware({ type: "function" })
	.middleware([authMiddleware])
	.server(async ({ context, next }) => {
		if (!context.session) {
			setFlashCookie({
				intent: "error",
				message: "You must be signed in to access this page.",
			});
			throw redirect({
				to: "/sign-in",
			});
		}

		if (!context.session.user.isAdmin) {
			setFlashCookie({
				intent: "error",
				message: "You must be an admin to access this page.",
			});
			throw redirect({
				to: "/",
			});
		}

		return next({
			context: {
				session: context.session,
			},
		});
	});
