import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { ngrok } from "vite-plugin-ngrok";
import removeConsole from "vite-plugin-remove-console";
import viteTsConfigPaths from "vite-tsconfig-paths";

const { NGROK_AUTH_TOKEN } = loadEnv("", process.cwd(), "NGROK_AUTH_TOKEN");

const config = defineConfig({
	resolve: {
		alias: {
			// /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
			"@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
		},
	},
	server: {
		allowedHosts: ["feline-usable-stingray.ngrok-free.app"],
	},
	plugins: [
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart({
			customViteReactPlugin: true,
			target: "vercel",
		}),
		viteReact(),
		removeConsole(),
		ngrok({
			authtoken: NGROK_AUTH_TOKEN,
			domain: "feline-usable-stingray.ngrok-free.app",
		}),
	],
});

export default config;
