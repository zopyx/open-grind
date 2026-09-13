// Injected by vite.config.mjs.
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

/** The version package.json carried when this bundle was built. */
export const appVersion = __APP_VERSION__;

/**
 * When this bundle was built. A release build exports SOURCE_DATE_EPOCH — the
 * commit it was built from — so the value stays reproducible; a build without
 * it (a plain `vite dev` or `vite build`) gets the wall clock instead.
 */
export const buildDate = new Date(__BUILD_DATE__);
