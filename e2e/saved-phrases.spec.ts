import { expect, test } from "@playwright/test";

import { DEMO_CONVERSATION, installTauriShim } from "./support/app";

const DRAWER = "[data-vaul-drawer]";
const PHRASE_OPTION = '[data-slot="saved-phrase-option"]';
const COMPOSER_PLACEHOLDER = "Say something...";
const PHRASES_PAGE = "/settings/app/phrases";
// The dialog's own title ("New phrase") contains "Phrase", so the field is
// addressed by its placeholder instead of its label.
const PHRASE_FIELD = "Hey, how's it going?";

async function openSavedPhrases(page: import("@playwright/test").Page) {
	await installTauriShim(page);
	await page.goto(DEMO_CONVERSATION);
	const trigger = page.getByRole("button", { name: "Saved phrases" });
	await trigger.waitFor({ timeout: 30_000 });
	await trigger.click();
	await page.locator(DRAWER).waitFor({ timeout: 10_000 });
}

test("a saved phrase fills the composer draft", async ({ page }) => {
	await openSavedPhrases(page);

	const option = page.locator(PHRASE_OPTION).first();
	await expect(option).toBeVisible();
	const text = ((await option.textContent()) ?? "").trim();
	expect(text).not.toBe("");

	await option.click();

	await expect(page.getByPlaceholder(COMPOSER_PLACEHOLDER)).toHaveValue(text);
	// Picking a phrase puts the list away again.
	await expect(page.locator(DRAWER)).toHaveCount(0);
});

test("phrases can be added, edited and deleted", async ({ page }) => {
	const phrase = `Late night ${Date.now()}`;
	const edited = `${phrase} (edited)`;

	await installTauriShim(page);
	await page.goto(PHRASES_PAGE);

	await page.getByRole("button", { name: "Add phrase" }).click();
	await page.getByPlaceholder(PHRASE_FIELD).fill(phrase);
	await page.getByRole("button", { name: "Save phrase" }).click();
	await expect(page.getByText(phrase)).toBeVisible();

	await page.getByRole("button", { name: `Edit "${phrase}"` }).click();
	// The editor opens with what the phrase already says.
	await expect(page.getByPlaceholder(PHRASE_FIELD)).toHaveValue(phrase);
	await page.getByPlaceholder(PHRASE_FIELD).fill(edited);
	await page.getByRole("button", { name: "Save changes" }).click();
	await expect(page.getByText(edited)).toBeVisible();
	await expect(page.getByText(phrase, { exact: true })).toHaveCount(0);

	await page.getByRole("button", { name: `Delete "${edited}"` }).click();
	await page.getByRole("button", { name: "Delete", exact: true }).click();
	await expect(page.getByText(edited)).toHaveCount(0);
});

test("an over-long phrase cannot be saved", async ({ page }) => {
	await installTauriShim(page);
	await page.goto(PHRASES_PAGE);

	await page.getByRole("button", { name: "Add phrase" }).click();
	await page.getByPlaceholder(PHRASE_FIELD).fill("a".repeat(501));

	await expect(
		page.getByRole("button", { name: "Save phrase" }),
	).toBeDisabled();
});
