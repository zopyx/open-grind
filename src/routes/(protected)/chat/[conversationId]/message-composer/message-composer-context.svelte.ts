import { createContext } from "svelte";

import type { MessageDraft } from "$lib/model/messaging/messages";

export const [getMessageComposerContext, setMessageComposerContext] =
	createContext<
		() => {
			disabled: boolean;
			insertText: (text: string) => void;
			sendMessages: (drafts: MessageDraft[]) => void | Promise<void>;
		}
	>();
