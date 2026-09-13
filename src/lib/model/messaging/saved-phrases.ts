import z from "zod";

import { unixTimestampMsSchema } from "$lib/model/types";

export const savedPhraseSchema = z.object({
	id: z.int().nonnegative(),
	text: z.string(),
	createdAt: unixTimestampMsSchema,
	updatedAt: unixTimestampMsSchema,
});

export type SavedPhrase = z.infer<typeof savedPhraseSchema>;

export const savedPhrasesResponseSchema = z.array(savedPhraseSchema);

export const savedPhraseLimits = { text: 500 } as const;
