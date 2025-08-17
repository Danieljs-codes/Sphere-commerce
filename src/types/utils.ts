import { createIsomorphicFn } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";

export const getFlashCookie = createIsomorphicFn()
	.server(() => {
		const toastCookie = getCookie("toast");

		if (!toastCookie) return null;

		const toastContents = JSON.parse(toastCookie) as {
			intent: "success" | "error" | "info" | "warning";
			message: string;
			description?: string;
		};

		deleteCookie("toast");

		return toastContents;
	})
	.client(() => {
		const toastCookie = document.cookie
			.split("; ")
			.find((row) => row.startsWith("toast="))
			?.split("=")[1];

		if (!toastCookie) return null;

		const toastContents = JSON.parse(decodeURIComponent(toastCookie)) as {
			intent: "success" | "error" | "info" | "warning";
			message: string;
			description?: string;
		};

		if ("cookieStore" in window) {
			window.cookieStore.delete("toast");
		} else {
			// biome-ignore lint/suspicious/noDocumentCookie: <explanation>
			document.cookie = "toast=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
		}

		return toastContents;
	});

export const setFlashCookie = createIsomorphicFn()
	.server(
		(data: {
			intent: "success" | "error" | "info" | "warning";
			message: string;
			description?: string;
		}) => {
			setCookie("toast", JSON.stringify(data), {
				httpOnly: false,
				maxAge: 60, // 60 seconds
			});
		},
	)
	.client(
		(data: {
			intent: "success" | "error" | "info" | "warning";
			message: string;
			description?: string;
		}) => {
			document.cookie = `toast=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=${60 * 5}`;
		},
	);

export const getSidebarState = createIsomorphicFn()
	.server(() => {
		const sidebarState = getCookie("sidebar_state");

		if (!sidebarState) return false;
		return JSON.parse(sidebarState);
	})
	.client(() => {
		const sidebarState = document.cookie
			.split("; ")
			.find((row) => row.startsWith("sidebar_state="))
			?.split("=")[1];
		if (!sidebarState) return false;
		return JSON.parse(decodeURIComponent(sidebarState));
	});
