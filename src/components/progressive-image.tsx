/** biome-ignore-all lint/a11y/useKeyWithClickEvents: I know */

import {
	type ComponentPropsWithoutRef,
	useEffect,
	useRef,
	useState,
} from "react";
import { Blurhash } from "react-blurhash";
import { cn } from "@/lib/utils";

type ProgressiveImageProps = {
	src: string;
	alt?: string;
	blurhash?: string | null;
} & ComponentPropsWithoutRef<"img">;

/**
 * ProgressiveImage
 * - shows Blurhash while the real image loads
 * - robustly handles cached images (checks Image.complete/naturalWidth)
 * - fades the real image in when loaded
 * - marks "loaded" on error to avoid stuck placeholders
 */
export default function ProgressiveImage({
	src,
	alt = "",
	blurhash,
	className,
	style,
	loading = "lazy",
	decoding = "async",
	onClick,
	...props
}: ProgressiveImageProps) {
	const [loaded, setLoaded] = useState(false);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!src) {
			setLoaded(true);
			return;
		}

		// Use a separate Image() for preloading so cached images are detected
		const img = new Image();

		const handleLoad = () => {
			if (!mountedRef.current) return;
			setLoaded(true);
			cleanup();
		};

		const handleError = () => {
			// mark as "loaded" on error so the placeholder doesn't stay forever
			if (!mountedRef.current) return;
			setLoaded(true);
			cleanup();
		};

		const cleanup = () => {
			img.removeEventListener("load", handleLoad);
			img.removeEventListener("error", handleError);
		};

		img.addEventListener("load", handleLoad);
		img.addEventListener("error", handleError);
		img.src = src;

		// If already cached and complete, mark as loaded immediately
		if (img.complete && img.naturalWidth > 0) {
			handleLoad();
		}

		return cleanup;
	}, [src]);

	return (
		<div
			className={`relative overflow-hidden ${className ?? ""}`}
			style={style}
			aria-busy={!loaded}
		>
			{!loaded && blurhash && (
				<div className="absolute inset-0">
					<Blurhash
						hash={blurhash}
						width="100%"
						height="100%"
						style={{ display: "block", borderRadius: "var(--border-radius)" }}
						className="rounded-lg lg:rounded-2xl"
					/>
				</div>
			)}

			<img
				src={src}
				alt={alt}
				loading={loading}
				decoding={decoding}
				onClick={onClick}
				onError={() => {
					/* the preloader will already set loaded on error, this is just redundancy */
					setLoaded(true);
				}}
				onLoad={() => {
					/* redundancy in case browser fires load on the element */
					setLoaded(true);
				}}
				className={cn(
					"block w-full h-full object-cover object-center transition-opacity duration-300 rounded-lg lg:rounded-2xl",
					loaded ? "opacity-100" : "opacity-0",
				)}
				{...props}
			/>
		</div>
	);
}
