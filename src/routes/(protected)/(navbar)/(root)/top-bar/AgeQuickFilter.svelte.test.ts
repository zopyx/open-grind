// @vitest-environment jsdom

import { render } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { describe, expect, it, vi } from "vitest";

vi.mock("$lib/app-data/preferences.svelte", () => ({
	getPreferences: vi.fn(() => Promise.resolve({})),
	setPreferences: vi.fn(() => Promise.resolve()),
}));

vi.mock("$lib/grid/grid-state.svelte", async () => {
	const { GridSearchFiltersState } =
		await import("$lib/grid/grid-search-filters-state.svelte");
	return {
		gridState: {
			filters: new GridSearchFiltersState({ onQueryChange: vi.fn() }),
		},
	};
});

vi.stubGlobal(
	"ResizeObserver",
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	},
);

import { gridState } from "$lib/grid/grid-state.svelte";
import { ageRangeLabel } from "$lib/model/browse/grid/filters";
import { defaultFilterPreset } from "$lib/model/browse/grid/presets";
import AgeQuickFilter from "./AgeQuickFilter.svelte";

// The drawer opens on the app's default filters, not on an empty age range.
const defaultAgeLabel = ageRangeLabel(defaultFilterPreset.filters.age);

describe("AgeQuickFilter", () => {
	it("keeps an in-progress edit when the stored filters change underneath", async () => {
		await gridState.filters.ready;
		render(AgeQuickFilter, { props: { open: true } });
		flushSync();

		expect(document.body.textContent).toContain(defaultAgeLabel);

		gridState.filters.set({ age: [30, 40] });
		flushSync();

		expect(document.body.textContent).toContain(defaultAgeLabel);
		expect(document.body.textContent).not.toContain("30 - 40");
	});
});
