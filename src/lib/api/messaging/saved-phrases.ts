import { callMethod } from "$lib/api/methods";

export const listSavedPhrases = () => callMethod("saved_phrases_list");

export const addSavedPhrase = (text: string) =>
	callMethod("saved_phrases_add", { text });

export const updateSavedPhrase = ({ id, text }: { id: number; text: string }) =>
	callMethod("saved_phrases_update", { id, text });

export const deleteSavedPhrase = (id: number) =>
	callMethod("saved_phrases_delete", { id });
