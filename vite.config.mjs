import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, realpathSync } from "node:fs";
import { searchForWorkspaceRoot } from "vite";
import { defineConfig } from "vitest/config";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// @ts-expect-error process is a nodejs global
const { version: appVersion } = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

// A release build exports SOURCE_DATE_EPOCH (the commit it was built from) so
// the artifact stays reproducible; a plain local build has none and gets the
// wall clock instead. The About dialog shows whatever this resolves to.
// @ts-expect-error process is a nodejs global
const sourceDateEpoch = Number(process.env.SOURCE_DATE_EPOCH ?? 0);
const buildDate = new Date(sourceDateEpoch * 1000 || Date.now());

// https://vite.dev/config/
export default defineConfig(async ({ command }) => ({
	plugins: [sveltekit(), tailwindcss()],
	resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,

	define: {
		__APP_VERSION__: JSON.stringify(appVersion),
		__BUILD_DATE__: JSON.stringify(buildDate.toISOString()),
	},

	esbuild: { drop: command === "build" ? ["console", "debugger"] : [] },

	optimizeDeps: { include: ["leaflet", "sveaflet"] },

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent Vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
		watch: {
			// 3. tell Vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"],
		},
		fs: {
			allow: [
				searchForWorkspaceRoot(process.cwd()),
				realpathSync("node_modules"),
			],
		},
	},

	test: {
		environment: "jsdom",
		include: ["src/**/*.test.ts"],
		setupFiles: ["src/test-setup.ts"],
		// tinykeys caches navigator.platform at load, so vi.resetModules() cannot
		// re-resolve `$mod` unless tinykeys goes through the module runner too.
		server: { deps: { inline: ["tinykeys"] } },
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.{ts,svelte}"],
		},
	},
}));
