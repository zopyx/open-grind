import z from "zod";

import {
	AGE_MIN,
	defaultFilters,
	FilterPosition,
	gridSearchFiltersSchema,
} from "./filters";

export const FILTER_PRESET_NAME_MAX_LENGTH = 40;

export const filterPresetSchema = z.object({
	id: z.string().min(1),
	name: z.string().trim().min(1).max(FILTER_PRESET_NAME_MAX_LENGTH),
	filters: gridSearchFiltersSchema,
});

export type FilterPreset = z.infer<typeof filterPresetSchema>;

// Tag filters hold the tag texts the API returns, which are lowercase
// (`bondage`, not `Bondage`); anything else never matches a tag in the list.
export const BONDAGE_TAG = "bondage";

// What a fresh install starts from and what `Reset filters` goes back to.
export const defaultFilterPreset: FilterPreset = filterPresetSchema.parse({
	id: "bondage-18-30-bottom-side-vers-bottom",
	name: "Bondage 18-30 Bottom/Side/Vers Bottom",
	filters: {
		...defaultFilters,
		ageEnabled: true,
		age: [AGE_MIN, 30],
		tagsEnabled: true,
		tags: [BONDAGE_TAG],
		positionEnabled: true,
		positions: [
			FilterPosition.Bottom,
			FilterPosition.Side,
			FilterPosition.VersBottom,
		],
	},
});

// The other one the app ships with. No age filter: it asks for the people who
// are online right now and top or vers top.
export const onlineMasterFilterPreset: FilterPreset = filterPresetSchema.parse({
	id: "online-master",
	name: "Online Master",
	filters: {
		...defaultFilters,
		isOnline: true,
		tagsEnabled: true,
		tags: [BONDAGE_TAG],
		positionEnabled: true,
		positions: [FilterPosition.VersTop, FilterPosition.Top],
	},
});

// Shipped with the app: applicable, but neither editable nor deletable.
export const builtInFilterPresets: FilterPreset[] = [
	defaultFilterPreset,
	onlineMasterFilterPreset,
];

export function isBuiltInFilterPreset(id: string): boolean {
	return builtInFilterPresets.some((preset) => preset.id === id);
}

export function newFilterPresetId(): string {
	return crypto.randomUUID();
}
