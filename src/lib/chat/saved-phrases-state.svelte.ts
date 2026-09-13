import { showErrorToast } from "$lib/api/error-toast";
import * as api from "$lib/api/messaging/saved-phrases";
import type { SavedPhrase } from "$lib/model/messaging/saved-phrases";

export class SavedPhrasesState {
	items: SavedPhrase[] = $state.raw([]);
	loading = $state(false);
	ready: Promise<void> | null = null;

	/** Loads once; the drawer and the settings screen share the result. */
	ensureLoaded(): Promise<void> {
		this.ready ??= this.load();
		return this.ready;
	}

	async load(): Promise<void> {
		this.loading = true;
		try {
			this.items = await api.listSavedPhrases();
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to load saved phrases", error });
		} finally {
			this.loading = false;
		}
	}

	async add(text: string): Promise<SavedPhrase | null> {
		try {
			const phrase = await api.addSavedPhrase(text);
			this.items = [phrase, ...this.items];
			return phrase;
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to save the phrase", error });
			return null;
		}
	}

	async update({
		id,
		text,
	}: {
		id: number;
		text: string;
	}): Promise<SavedPhrase | null> {
		try {
			const phrase = await api.updateSavedPhrase({ id, text });
			this.items = this.items.map((candidate) =>
				candidate.id === id ? phrase : candidate,
			);
			return phrase;
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to update the phrase", error });
			return null;
		}
	}

	async remove(id: number): Promise<boolean> {
		try {
			await api.deleteSavedPhrase(id);
			this.items = this.items.filter((candidate) => candidate.id !== id);
			return true;
		} catch (error) {
			console.error(error);
			showErrorToast({ label: "Failed to delete the phrase", error });
			return false;
		}
	}
}

export const savedPhrases = new SavedPhrasesState();
