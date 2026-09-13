import { describe, expect, it } from "vitest";

import {
	AGE_MIN,
	defaultFilters,
	FilterPosition,
	gridSearchFiltersSchema,
} from "$lib/model/browse/grid/filters";
import {
	BONDAGE_TAG,
	builtInFilterPresets,
	defaultFilterPreset,
	filterPresetSchema,
	isBuiltInFilterPreset,
	newFilterPresetId,
	onlineMasterFilterPreset,
} from "$lib/model/browse/grid/presets";

describe("filter presets", () => {
	it("ships the built-in presets, the default one first", () => {
		expect(builtInFilterPresets).toEqual([
			defaultFilterPreset,
			onlineMasterFilterPreset,
		]);
		for (const preset of builtInFilterPresets)
			expect(isBuiltInFilterPreset(preset.id)).toBe(true);
		expect(isBuiltInFilterPreset("does-not-exist")).toBe(false);
	});

	it("gives every built-in preset its own id", () => {
		const ids = builtInFilterPresets.map((preset) => preset.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("validates every built-in preset against the preset schema", () => {
		for (const preset of builtInFilterPresets)
			expect(filterPresetSchema.parse(preset)).toEqual(preset);
	});

	it("filters for the lowercase tag texts the API returns", () => {
		for (const preset of builtInFilterPresets) {
			for (const tag of preset.filters.tags) {
				// The tag list holds lowercase texts; a capitalised filter value
				// matches nothing and leaves the tag looking unselected.
				expect(tag, preset.name).toBe(tag.toLowerCase());
				expect(tag, preset.name).toBe(BONDAGE_TAG);
			}
		}
	});

	it("describes Online Master as online, Bondage, vers top or top", () => {
		const { filters } = onlineMasterFilterPreset;

		expect(onlineMasterFilterPreset.name).toBe("Online Master");
		expect(filters.isOnline).toBe(true);
		expect(filters.tagsEnabled).toBe(true);
		expect(filters.tags).toEqual([BONDAGE_TAG]);
		expect(filters.positionEnabled).toBe(true);
		expect(filters.positions).toEqual([
			FilterPosition.VersTop,
			FilterPosition.Top,
		]);
		// No age filter: it only narrows by who is online and how they top.
		expect(filters.ageEnabled).toBe(false);
		expect(filters.age).toEqual(defaultFilters.age);
	});

	it("defaults to Bondage, 18-30, bottom/side/vers bottom", () => {
		const { filters } = defaultFilterPreset;

		expect(filters.tagsEnabled).toBe(true);
		expect(filters.tags).toEqual([BONDAGE_TAG]);
		expect(filters.ageEnabled).toBe(true);
		expect(filters.age).toEqual([AGE_MIN, 30]);
		expect(filters.positionEnabled).toBe(true);
		expect(filters.positions).toEqual([
			FilterPosition.Bottom,
			FilterPosition.Side,
			FilterPosition.VersBottom,
		]);
	});

	it("leaves every filter the default preset does not name at its neutral value", () => {
		const { filters } = defaultFilterPreset;
		const untouched = {
			...gridSearchFiltersSchema.parse({}),
			ageEnabled: filters.ageEnabled,
			age: filters.age,
			tagsEnabled: filters.tagsEnabled,
			tags: filters.tags,
			positionEnabled: filters.positionEnabled,
			positions: filters.positions,
		};

		expect(filters).toEqual(untouched);
	});

	it("accepts a user preset with a name and a full filter set", () => {
		const preset = {
			id: newFilterPresetId(),
			name: "  Weekend  ",
			filters: defaultFilters,
		};

		expect(filterPresetSchema.parse(preset).name).toBe("Weekend");
	});

	it("rejects empty or over-long names", () => {
		expect(
			filterPresetSchema.safeParse({
				id: "a",
				name: "   ",
				filters: defaultFilters,
			}).success,
		).toBe(false);
		expect(
			filterPresetSchema.safeParse({
				id: "a",
				name: "x".repeat(41),
				filters: defaultFilters,
			}).success,
		).toBe(false);
	});

	it("completes a partial filter set with the neutral defaults", () => {
		const parsed = filterPresetSchema.parse({
			id: "a",
			name: "Named",
			filters: { isOnline: true },
		});

		expect(parsed.filters).toEqual({ ...defaultFilters, isOnline: true });
	});

	it("generates unique ids", () => {
		expect(newFilterPresetId()).not.toBe(newFilterPresetId());
	});
});
