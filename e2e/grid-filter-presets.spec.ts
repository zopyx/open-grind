import { expect, type Page, test } from "@playwright/test";

import { ensureGridLocation, installTauriShim } from "./support/app";

const DEFAULT_PRESET = "Bondage 18-30 Bottom/Side/Vers Bottom";
const ONLINE_PRESET = "Online Master";
const SAVED_PRESET = "Late night";
// Tag filters hold the tag texts the API returns, and those are lowercase.
const BONDAGE_TAG = "bondage";
const PRESET_TRIGGER = '[aria-label="Filter presets"]';
const ACTIVE_PILL_BACKGROUND = "rgb(255, 255, 255)";

const trigger = (page: Page) => page.locator(PRESET_TRIGGER);
const sheet = (page: Page) => page.locator('[data-slot="sheet-content"]');
const menuItem = (page: Page, name: string) =>
	page.getByRole("menuitem", { name, exact: true });

async function openAllFilters(page: Page): Promise<void> {
	await page.locator('[aria-label="All filters"]').click();
	await page.getByRole("button", { name: "Apply" }).waitFor();
}

async function pickPreset(page: Page, name: string): Promise<void> {
	await trigger(page).click();
	await menuItem(page, name).click();
}

test.beforeEach(async ({ page }) => {
	await installTauriShim(page);
});

test("runs the default preset and switches between presets and custom filters", async ({
	page,
}) => {
	test.setTimeout(240_000);

	await page.goto("/");
	await page.locator("nav a").first().waitFor({ timeout: 120_000 });
	await ensureGridLocation(page);
	await openAllFilters(page);

	// A fresh install is already the default preset: Bondage, 18-30, and the
	// three bottom-leaning positions.
	await expect(trigger(page)).toHaveText(DEFAULT_PRESET);
	await expect(
		sheet(page).getByText(BONDAGE_TAG, { exact: true }),
	).toBeVisible();
	await expect(
		sheet(page).getByRole("slider", { name: "Minimum age" }),
	).toHaveAttribute("aria-valuenow", "18");
	await expect(
		sheet(page).getByRole("slider", { name: "Maximum age" }),
	).toHaveAttribute("aria-valuenow", "30");
	for (const position of ["Bottom", "Side", "Vers Bottom"])
		await expect(
			sheet(page).getByRole("button", { name: position, exact: true }),
		).toHaveAttribute("data-state", "on");
	await expect(
		sheet(page).getByRole("button", { name: "Top", exact: true }),
	).toHaveAttribute("data-state", "off");

	// Editing a single filter makes the draft a custom set.
	const online = sheet(page).getByLabel("Online");
	await expect(online).not.toBeChecked();
	await online.click();
	await expect(online).toBeChecked();
	await expect(trigger(page)).toHaveText("Custom filters");

	// Choosing the preset puts every filter back, tags and position included.
	await pickPreset(page, DEFAULT_PRESET);
	await expect(trigger(page)).toHaveText(DEFAULT_PRESET);
	await expect(online).not.toBeChecked();
	await expect(
		sheet(page).getByRole("button", { name: "Bottom", exact: true }),
	).toHaveAttribute("data-state", "on");

	// A built-in preset cannot be deleted.
	await trigger(page).click();
	await expect(page.getByRole("menuitem", { name: /^Delete / })).toHaveCount(
		0,
	);
	await page.keyboard.press("Escape");

	// Save the current, deliberately different, filters under an own name.
	await online.click();
	await expect(trigger(page)).toHaveText("Custom filters");
	await trigger(page).click();
	await menuItem(page, "Save current filters as preset...").click();
	await page.getByLabel("Preset name").fill(SAVED_PRESET);
	await page.getByRole("button", { name: "Save", exact: true }).click();
	await expect(trigger(page)).toHaveText(SAVED_PRESET);

	// Switching presets keeps working in both directions.
	await pickPreset(page, DEFAULT_PRESET);
	await expect(trigger(page)).toHaveText(DEFAULT_PRESET);
	await expect(online).not.toBeChecked();
	await pickPreset(page, SAVED_PRESET);
	await expect(trigger(page)).toHaveText(SAVED_PRESET);
	await expect(online).toBeChecked();

	// The own preset is deletable, and the draft falls back to custom.
	await trigger(page).click();
	await menuItem(page, `Delete "${SAVED_PRESET}"`).click();
	await expect(trigger(page)).toHaveText("Custom filters");

	await trigger(page).click();
	await expect(menuItem(page, SAVED_PRESET)).toHaveCount(0);
	await expect(menuItem(page, DEFAULT_PRESET)).toBeVisible();
});

test("the Online Master preset asks for online top or vers top", async ({
	page,
}) => {
	test.setTimeout(240_000);

	await page.goto("/");
	await page.locator("nav a").first().waitFor({ timeout: 120_000 });
	await ensureGridLocation(page);
	await openAllFilters(page);

	await pickPreset(page, ONLINE_PRESET);
	await expect(trigger(page)).toHaveText(ONLINE_PRESET);

	const online = sheet(page).getByLabel("Online");
	await expect(online).toBeChecked();
	await expect(
		sheet(page).getByText(BONDAGE_TAG, { exact: true }),
	).toBeVisible();
	for (const position of ["Top", "Vers Top"])
		await expect(
			sheet(page).getByRole("button", { name: position, exact: true }),
		).toHaveAttribute("data-state", "on");
	// The bottom-leaning default does not leak into it.
	for (const position of ["Bottom", "Side", "Vers Bottom"])
		await expect(
			sheet(page).getByRole("button", { name: position, exact: true }),
		).toHaveAttribute("data-state", "off");
	// No age filter, so the range stays unticked.
	await expect(
		sheet(page).getByRole("checkbox", { name: "Age", exact: true }),
	).not.toBeChecked();
});

test("the top bar applies a preset without opening the filter sheet", async ({
	page,
}) => {
	test.setTimeout(240_000);

	await page.goto("/");
	await page.locator("nav a").first().waitFor({ timeout: 120_000 });
	await ensureGridLocation(page);

	// The compact trigger sits in the grid's top bar and names what is applied.
	const quick = page.locator('[aria-label^="Filter presets:"]');
	await expect(quick).toHaveAttribute(
		"aria-label",
		`Filter presets: ${DEFAULT_PRESET}`,
	);

	// The default preset enables both quick filters.
	const agePill = page.getByRole("button", { name: "Age", exact: true });
	const positionPill = page.getByRole("button", {
		name: "Position",
		exact: true,
	});
	await expect(agePill).toHaveCSS("background-color", ACTIVE_PILL_BACKGROUND);
	await expect(positionPill).toHaveCSS(
		"background-color",
		ACTIVE_PILL_BACKGROUND,
	);

	await quick.click();
	await menuItem(page, ONLINE_PRESET).click();

	await expect(quick).toHaveAttribute(
		"aria-label",
		`Filter presets: ${ONLINE_PRESET}`,
	);
	// Applied straight away, without the sheet ever opening.
	await expect(sheet(page)).toHaveCount(0);
	await expect(agePill).not.toHaveCSS(
		"background-color",
		ACTIVE_PILL_BACKGROUND,
	);
	await expect(positionPill).toHaveCSS(
		"background-color",
		ACTIVE_PILL_BACKGROUND,
	);
});

test("the applied preset reaches the grid's live filters", async ({ page }) => {
	test.setTimeout(240_000);

	await page.goto("/");
	await page.locator("nav a").first().waitFor({ timeout: 120_000 });
	await ensureGridLocation(page);

	// The default preset enables the age and position filters, which the quick
	// filter pills read straight off the live filter state.
	const positionPill = page.getByRole("button", {
		name: "Position",
		exact: true,
	});
	const agePill = page.getByRole("button", { name: "Age", exact: true });
	await expect(positionPill).toHaveCSS(
		"background-color",
		ACTIVE_PILL_BACKGROUND,
	);
	await expect(agePill).toHaveCSS("background-color", ACTIVE_PILL_BACKGROUND);

	await openAllFilters(page);
	await sheet(page).getByLabel("Position").click();
	await page.getByRole("button", { name: "Apply" }).click();
	await expect(sheet(page)).toHaveCount(0);

	await expect(positionPill).not.toHaveCSS(
		"background-color",
		ACTIVE_PILL_BACKGROUND,
	);
	await expect(agePill).toHaveCSS("background-color", ACTIVE_PILL_BACKGROUND);
});
