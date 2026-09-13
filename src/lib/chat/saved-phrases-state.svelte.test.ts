import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	addSavedPhraseMock,
	deleteSavedPhraseMock,
	listSavedPhrasesMock,
	showErrorToast,
	updateSavedPhraseMock,
} = vi.hoisted(() => ({
	addSavedPhraseMock: vi.fn<(text: string) => Promise<SavedPhrase>>(),
	deleteSavedPhraseMock: vi.fn<(id: number) => Promise<void>>(() =>
		Promise.resolve(),
	),
	listSavedPhrasesMock: vi.fn<() => Promise<SavedPhrase[]>>(() =>
		Promise.resolve([]),
	),
	showErrorToast: vi.fn(),
	updateSavedPhraseMock:
		vi.fn<(args: { id: number; text: string }) => Promise<SavedPhrase>>(),
}));

vi.mock("$lib/api/error-toast", () => ({ showErrorToast }));
vi.mock("$lib/api/messaging/saved-phrases", () => ({
	addSavedPhrase: addSavedPhraseMock,
	deleteSavedPhrase: deleteSavedPhraseMock,
	listSavedPhrases: listSavedPhrasesMock,
	updateSavedPhrase: updateSavedPhraseMock,
}));

import { SavedPhrasesState } from "$lib/chat/saved-phrases-state.svelte";
import type { SavedPhrase } from "$lib/model/messaging/saved-phrases";

function phrase(id: number, text: string): SavedPhrase {
	return { id, text, createdAt: id * 1_000, updatedAt: id * 1_000 };
}

async function loadedState(
	items: SavedPhrase[] = [],
): Promise<SavedPhrasesState> {
	listSavedPhrasesMock.mockResolvedValue(items);
	const state = new SavedPhrasesState();
	await state.ensureLoaded();
	return state;
}

beforeEach(() => {
	vi.clearAllMocks();
	listSavedPhrasesMock.mockResolvedValue([]);
	deleteSavedPhraseMock.mockResolvedValue(undefined);
});

describe("loading", () => {
	it("only asks for the list once", async () => {
		const state = await loadedState([phrase(1, "Hey")]);

		await state.ensureLoaded();
		await state.ensureLoaded();

		expect(state.items).toEqual([phrase(1, "Hey")]);
		expect(listSavedPhrasesMock).toHaveBeenCalledTimes(1);
	});

	it("keeps the list empty and reports a failed load", async () => {
		listSavedPhrasesMock.mockRejectedValue(new Error("no database"));

		const state = new SavedPhrasesState();
		await state.ensureLoaded();

		expect(state.items).toEqual([]);
		expect(state.loading).toBe(false);
		expect(showErrorToast).toHaveBeenCalledOnce();
	});
});

describe("editing", () => {
	it("puts a new phrase on top", async () => {
		const state = await loadedState([phrase(1, "Hey")]);
		addSavedPhraseMock.mockResolvedValue(phrase(2, "On my way"));

		await state.add("On my way");

		expect(state.items).toEqual([phrase(2, "On my way"), phrase(1, "Hey")]);
	});

	it("replaces the phrase it updated", async () => {
		const state = await loadedState([phrase(1, "Hey"), phrase(2, "Later")]);
		updateSavedPhraseMock.mockResolvedValue({
			...phrase(1, "Hey there"),
			updatedAt: 9_000,
		});

		await state.update({ id: 1, text: "Hey there" });

		expect(state.items).toEqual([
			{ ...phrase(1, "Hey there"), updatedAt: 9_000 },
			phrase(2, "Later"),
		]);
	});

	it("drops the phrase it deleted", async () => {
		const state = await loadedState([phrase(1, "Hey"), phrase(2, "Later")]);

		await state.remove(1);

		expect(state.items).toEqual([phrase(2, "Later")]);
		expect(deleteSavedPhraseMock).toHaveBeenCalledWith(1);
	});
});

describe("failures", () => {
	it("keeps what it had when adding fails", async () => {
		const state = await loadedState([phrase(1, "Hey")]);
		addSavedPhraseMock.mockRejectedValue(new Error("database is locked"));

		await expect(state.add("On my way")).resolves.toBeNull();

		expect(state.items).toEqual([phrase(1, "Hey")]);
		expect(showErrorToast).toHaveBeenCalledOnce();
	});

	it("keeps what it had when updating fails", async () => {
		const state = await loadedState([phrase(1, "Hey")]);
		updateSavedPhraseMock.mockRejectedValue(new Error("gone"));

		await expect(
			state.update({ id: 1, text: "Hey there" }),
		).resolves.toBeNull();

		expect(state.items).toEqual([phrase(1, "Hey")]);
	});

	it("keeps what it had when deleting fails", async () => {
		const state = await loadedState([phrase(1, "Hey")]);
		deleteSavedPhraseMock.mockRejectedValue(new Error("gone"));

		await expect(state.remove(1)).resolves.toBe(false);

		expect(state.items).toEqual([phrase(1, "Hey")]);
	});
});
