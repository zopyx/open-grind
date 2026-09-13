// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/svelte";
import { format } from "date-fns";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("$app/environment", () => ({
	version: "OpenGrind/0.0.0-test\ngrindr3/1.2.3;456",
}));

vi.stubGlobal(
	"ResizeObserver",
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	},
);

import { appVersion, buildDate } from "$lib/build-info";
import AboutDialog from "./AboutDialog.svelte";

afterEach(() => cleanup());

const renderedText = () => document.body.textContent ?? "";

describe("AboutDialog", () => {
	it("shows the version the bundle was built from", () => {
		render(AboutDialog, { props: { open: true } });

		expect(renderedText()).toContain(appVersion);
	});

	it("shows when the build was produced", () => {
		render(AboutDialog, { props: { open: true } });

		expect(renderedText()).toContain(format(buildDate, "PPpp"));
	});

	it("shows the Grindr API version the build talks to", () => {
		render(AboutDialog, { props: { open: true } });

		expect(renderedText()).toContain("grindr3/1.2.3;456");
	});

	it("links to the changelog", () => {
		render(AboutDialog, { props: { open: true } });

		const changelog = [...document.querySelectorAll("a")].find((link) =>
			link.textContent?.includes("Changelog"),
		);

		expect(changelog?.getAttribute("href")).toBe(
			"https://git.opengrind.org/open-grind/open-grind/src/branch/main/CHANGELOG.md",
		);
	});

	it("renders nothing while closed", () => {
		render(AboutDialog, { props: { open: false } });

		expect(renderedText()).not.toContain("Version");
	});
});
