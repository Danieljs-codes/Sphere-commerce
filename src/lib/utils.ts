import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
	return twMerge(clsx(inputs));
}

export const getNameInitials = (name: string) => {
	const names = name.trim().split(/\s+/).filter(Boolean);

	if (names.length === 0) {
		return "";
	}

	if (names.length > 1) {
		const firstInitial = names[0].charAt(0);
		const lastInitial = names[names.length - 1].charAt(0);
		return `${firstInitial}${lastInitial}`.toUpperCase();
	}

	return names[0].slice(0, 2).toUpperCase();
};

export const formatMoney = (amount: number) => {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
	}).format(amount / 100);
};

export function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
