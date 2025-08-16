import { useEffect, useRef, useState } from "react";

export interface UseDebouncedValueOptions {
	leading?: boolean;
}

export type UseDebouncedValueReturnValue<T> = [T, () => void];

export function useDebouncedValue<T = any>(
	value: T,
	wait: number,
	options: UseDebouncedValueOptions = { leading: false },
): UseDebouncedValueReturnValue<T> {
	const [_value, setValue] = useState(value);
	const mountedRef = useRef(false);
	const timeoutRef = useRef<number | null>(null);
	const cooldownRef = useRef(false);

	// biome-ignore lint/style/noNonNullAssertion: I know what I am doing
	const cancel = () => window.clearTimeout(timeoutRef.current!);

	// biome-ignore lint/correctness/useExhaustiveDependencies: I know what I am doing
	useEffect(() => {
		if (mountedRef.current) {
			if (!cooldownRef.current && options.leading) {
				cooldownRef.current = true;
				setValue(value);
			} else {
				cancel();
				timeoutRef.current = window.setTimeout(() => {
					cooldownRef.current = false;
					setValue(value);
				}, wait);
			}
		}
	}, [value, options.leading, wait]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: I know what I am doing
	useEffect(() => {
		mountedRef.current = true;
		return cancel;
	}, []);

	return [_value, cancel];
}
