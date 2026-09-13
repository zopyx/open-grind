import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPreferencesMock, setPreferencesMock } = vi.hoisted(() => ({
	getPreferencesMock: vi.fn(),
	setPreferencesMock: vi.fn((values: Record<string, unknown>) =>
		Promise.resolve(values),
	),
}));

vi.mock("$lib/app-data/preferences.svelte", () => ({
	getPreferences: getPreferencesMock,
	setPreferences: setPreferencesMock,
}));

import { FilterPresetsState } from "$lib/grid/filter-presets-state.svelte";
import { defaultFilters } from "$lib/model/browse/grid/filters";
import {
	builtInFilterPresets,
	defaultFilterPreset,
	onlineMasterFilterPreset,
} from "$lib/model/browse/grid/presets";

const storedPreset = {
	id: "own-1",
	name: "Weekend",
	filters: { ...defaultFilters, isOnline: true },
};

async function loadedState(filterPresets: unknown[] = []) {
	getPreferencesMock.mockResolvedValue({ filterPresets });
	const state = new FilterPresetsState();
	await state.ready;
	return state;
}

function lastWritten(): unknown {
	const calls = setPreferencesMock.mock.calls;
	const last = calls[calls.length - 1];
	if (!last) throw new Error("setPreferences was never called");
	return last[0].filterPresets;
}

beforeEach(() => {
	getPreferencesMock.mockReset();
	setPreferencesMock.mockClear();
});

describe("loading", () => {
	it("lists the built-in presets even when none are stored", async () => {
		const state = await loadedState();

		expect(state.all()).toEqual(builtInFilterPresets);
		expect(state.own).toEqual([]);
	});

	it("keeps built-in presets first and finds them by id", async () => {
		const state = await loadedState([storedPreset]);

		expect(state.all().map((preset) => preset.id)).toEqual([
			...builtInFilterPresets.map((preset) => preset.id),
			"own-1",
		]);
		expect(state.find(defaultFilterPreset.id)?.name).toBe(
			defaultFilterPreset.name,
		);
		expect(state.find(onlineMasterFilterPreset.id)?.name).toBe(
			onlineMasterFilterPreset.name,
		);
		expect(state.find("own-1")?.name).toBe("Weekend");
		expect(state.find("missing")).toBeUndefined();
	});
});

describe("save", () => {
	it("appends a preset with a trimmed name and persists the list", async () => {
		const state = await loadedState();

		const saved = await state.save({
			name: "  Late night  ",
			filters: { ...defaultFilters, isRightNow: true },
		});

		expect(saved?.name).toBe("Late night");
		expect(saved?.id).toBeTruthy();
		expect(state.own).toEqual([saved]);
		expect(lastWritten()).toEqual([saved]);
	});

	it("stores a copy, so later edits to the draft do not rewrite the preset", async () => {
		const state = await loadedState();
		const draft = { ...defaultFilters, isOnline: true };

		const saved = await state.save({ name: "Online", filters: draft });
		draft.isOnline = false;
		draft.tags.push("Coffee");

		expect(saved?.filters.isOnline).toBe(true);
		expect(saved?.filters.tags).toEqual([]);
	});

	it("keeps the stored presets and reports the failure when writing fails", async () => {
		const state = await loadedState([storedPreset]);
		setPreferencesMock.mockRejectedValueOnce(new Error("disk full"));

		const saved = await state.save({
			name: "Late night",
			filters: defaultFilters,
		});

		expect(saved).toBeNull();
		expect(state.own).toEqual([storedPreset]);
	});
});

describe("remove", () => {
	it("drops the preset and persists what is left", async () => {
		const state = await loadedState([storedPreset]);

		await state.remove("own-1");

		expect(state.own).toEqual([]);
		expect(lastWritten()).toEqual([]);
	});

	it("cannot remove a built-in preset", async () => {
		const state = await loadedState();

		await state.remove(defaultFilterPreset.id);

		expect(state.all()).toEqual(builtInFilterPresets);
	});
});
