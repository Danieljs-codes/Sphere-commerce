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

export function stripHtmlTags(html: string): string {
	if (typeof document !== "undefined") {
		// Browser environment
		const div = document.createElement("div");
		div.innerHTML = html;
		return div.textContent || div.innerText || "";
	}
	// Fallback for non-browser environments (Node.js, etc.)
	return html.replace(/<[^>]*>?/gm, "");
}

/**
 * Estimates if text will need more than one line
 * @param text The text to check
 * @param maxCharsPerLine Approximate max characters per line (default: 40)
 * @returns boolean indicating if text will likely wrap
 */
export function willTextWrap(text: string, maxCharsPerLine = 40): boolean {
	// Simple heuristic: if text is longer than maxCharsPerLine, it will likely wrap
	return text.length > maxCharsPerLine;
}

export function formatNairaShort(amountInKobo: number) {
	// Convert to Naira
	const naira = amountInKobo / 100;

	// Ignore amounts less than ₦10,000
	if (naira < 10_000) {
		return null;
	}

	if (naira >= 1_000_000) {
		return `${(naira / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
	}

	return `${(naira / 1_000).toFixed(2).replace(/\.?0+$/, "")}K`;
}
