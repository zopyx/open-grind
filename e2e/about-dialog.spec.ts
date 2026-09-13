import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

import { installTauriShim } from "./support/app";

const { version } = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
) as { version: string };

// date-fns "PPpp", e.g. "Sep 13, 2026, 12:53:00 AM".
const BUILT = /[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [AP]M/;

test("the about dialog reports the build it runs from", async ({ page }) => {
	await installTauriShim(page);
	await page.goto("/settings/app");

	await page.getByRole("button", { name: "About Open Grind" }).click();

	// The version package.json carried at build time.
	await expect(page.getByText(version).first()).toBeVisible();
	// A real formatted build timestamp, not a placeholder.
	await expect(page.getByText(BUILT)).toBeVisible();
	// The Grindr API version the bundle talks to.
	await expect(page.getByText(/grindr3\//)).toBeVisible();
	await expect(page.getByRole("link", { name: "Changelog" })).toHaveAttribute(
		"href",
		"https://git.opengrind.org/open-grind/open-grind/src/branch/main/CHANGELOG.md",
	);
});
