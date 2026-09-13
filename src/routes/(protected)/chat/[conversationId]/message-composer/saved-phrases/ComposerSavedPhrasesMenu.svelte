<script lang="ts">
	import { expoOut } from "svelte/easing";
	import { fly } from "svelte/transition";

	import { savedPhrases } from "$lib/chat/saved-phrases-state.svelte";
	import * as Drawer from "$lib/components/ui/drawer";
	import Link from "$lib/components/ui/link/Link.svelte";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import { dismissOnBackGesture } from "$lib/platform/back-gesture-event.svelte";
	import { getMessageComposerContext } from "../message-composer-context.svelte";

	let { open = $bindable() }: { open: boolean } = $props();

	const { insertText } = $derived(getMessageComposerContext()());

	// The list is shared with the settings screen, so loading it once is enough.
	$effect(() => {
		if (open) void savedPhrases.ensureLoaded();
	});

	dismissOnBackGesture({ active: () => open, dismiss: () => (open = false) });

	function insert(text: string) {
		insertText(text);
		open = false;
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Content
		class="mx-auto max-w-200 border-none bg-transparent p-0 shadow-none before:hidden"
		handle={null}
	>
		<div
			class="rounded-t-4xl border border-border bg-popover px-4 pb-6 shadow-xl"
			transition:fly={{ y: 24, duration: 250, easing: expoOut }}
		>
			<div class="flex items-baseline justify-between gap-4 pt-5 pb-3">
				<h2 class="text-lg font-semibold">Saved phrases</h2>
				<Link
					href="/settings/app/phrases"
					class="text-sm text-primary hover:underline"
					onclick={() => (open = false)}
				>
					Manage
				</Link>
			</div>
			{#if savedPhrases.loading && savedPhrases.items.length === 0}
				<div class="flex flex-col gap-1 pb-2">
					{#each Array.from({ length: 3 })}
						<Skeleton class="h-11 w-full rounded-2xl" />
					{/each}
				</div>
			{:else if savedPhrases.items.length === 0}
				<p class="pb-4 text-sm text-muted-foreground">
					No saved phrases yet. Add them in Settings → App → Saved
					phrases.
				</p>
			{:else}
				<div class="flex flex-col gap-1 pb-2">
					{#each savedPhrases.items as phrase (phrase.id)}
						<button
							type="button"
							data-slot="saved-phrase-option"
							class="w-full cursor-pointer rounded-2xl px-3 py-2.5 text-left text-sm break-words whitespace-pre-wrap hover:bg-accent"
							onclick={() => insert(phrase.text)}
						>
							{phrase.text}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</Drawer.Content>
</Drawer.Root>
