import { showErrorToast } from "$lib/api/error-toast";
import {
	getPreferences,
	setPreferences,
} from "$lib/app-data/preferences.svelte";
import {
	builtInFilterPresets,
	type FilterPreset,
	filterPresetSchema,
	newFilterPresetId,
} from "$lib/model/browse/grid/presets";
import type { GridSearchFilters } from "$lib/model/browse/grid/filters";

export class FilterPresetsState {
	own: FilterPreset[] = $state.raw([]);
	ready: Promise<void>;

	constructor() {
		this.ready = this.#load();
	}

	all(): FilterPreset[] {
		return [...builtInFilterPresets, ...this.own];
	}

	find(id: string): FilterPreset | undefined {
		return this.all().find((preset) => preset.id === id);
	}

	/** Returns the stored preset, or null when building or persisting it failed. */
	async save({
		name,
		filters,
	}: {
		name: string;
		filters: GridSearchFilters;
	}): Promise<FilterPreset | null> {
		let preset: FilterPreset;
		try {
			preset = filterPresetSchema.parse({
				id: newFilterPresetId(),
				name,
				// The caller keeps editing its draft and the draft is a rune proxy,
				// so store a plain, detachable snapshot of it.
				filters: $state.snapshot(filters),
			});
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to save filter preset", error });
			return null;
		}
		const stored = await this.#write([...this.own, preset]);
		return stored ? preset : null;
	}

	/** Built-in presets are not part of `own`, so this is a no-op for them. */
	async remove(id: string): Promise<void> {
		await this.#write(this.own.filter((preset) => preset.id !== id));
	}

	async #load(): Promise<void> {
		try {
			const { filterPresets } = await getPreferences();
			this.own = filterPresets;
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to load filter presets", error });
		}
	}

	async #write(presets: FilterPreset[]): Promise<boolean> {
		try {
			await setPreferences({ filterPresets: presets });
			this.own = presets;
			return true;
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to save filter presets", error });
			return false;
		}
	}
}
