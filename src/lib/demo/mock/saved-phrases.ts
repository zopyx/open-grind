import type { SavedPhrase } from "$lib/model/messaging/saved-phrases";

const SECOND = 1_000;
const START = Date.now();

let nextId = 1;

// Seeded so the web demo (and the e2e suite) has something to insert.
const phrases: SavedPhrase[] = [
	"Hey, how's it going?",
	"On my way, give me 10 minutes.",
	"Can't host, can you?",
].map((text, index) => ({
	id: nextId++,
	text,
	createdAt: START - (index + 1) * 60 * SECOND,
	updatedAt: START - (index + 1) * 60 * SECOND,
}));

/** Newest first, exactly like the SQLite query orders them. */
export function demoSavedPhrases(): SavedPhrase[] {
	return [...phrases].sort(
		(a, b) => b.createdAt - a.createdAt || b.id - a.id,
	);
}

export function demoAddSavedPhrase(text: string): SavedPhrase {
	const trimmed = text.trim();
	if (trimmed === "") throw new Error("A saved phrase cannot be empty");
	const now = Date.now();
	const phrase: SavedPhrase = {
		id: nextId++,
		text: trimmed,
		createdAt: now,
		updatedAt: now,
	};
	phrases.push(phrase);
	return phrase;
}

export function demoUpdateSavedPhrase({
	id,
	text,
}: {
	id: number;
	text: string;
}): SavedPhrase {
	const phrase = phrases.find((candidate) => candidate.id === id);
	if (!phrase) throw new Error("That saved phrase no longer exists");
	const trimmed = text.trim();
	if (trimmed === "") throw new Error("A saved phrase cannot be empty");
	phrase.text = trimmed;
	phrase.updatedAt = Date.now();
	return { ...phrase };
}

export function demoDeleteSavedPhrase(id: number): void {
	const index = phrases.findIndex((candidate) => candidate.id === id);
	if (index !== -1) phrases.splice(index, 1);
}
