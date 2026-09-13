<script lang="ts">
	import { PencilSimpleIcon, PlusIcon, TrashIcon } from "phosphor-svelte";

	import { savedPhrases } from "$lib/chat/saved-phrases-state.svelte";
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import { Button } from "$lib/components/ui/button";
	import * as Item from "$lib/components/ui/item";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import type { SavedPhrase } from "$lib/model/messaging/saved-phrases";
	import SavedPhraseDialog from "./SavedPhraseDialog.svelte";

	void savedPhrases.ensureLoaded();

	let dialogOpen = $state(false);
	let editing = $state<SavedPhrase | null>(null);
	let deleteOpen = $state(false);
	let pendingDelete = $state<SavedPhrase | null>(null);

	function openEditor(phrase: SavedPhrase | null) {
		editing = phrase;
		dialogOpen = true;
	}

	function askDelete(phrase: SavedPhrase) {
		pendingDelete = phrase;
		deleteOpen = true;
	}

	async function save(text: string) {
		if (editing) await savedPhrases.update({ id: editing.id, text });
		else await savedPhrases.add(text);
	}

	function confirmDelete() {
		const phrase = pendingDelete;
		deleteOpen = false;
		pendingDelete = null;
		if (phrase) void savedPhrases.remove(phrase.id);
	}
</script>

<h2>Saved phrases</h2>
<p class="px-4 text-sm text-muted-foreground">
	Phrases you can drop into the composer with one tap. They live on this
	device only; nothing leaves it until you send the message.
</p>

{#if savedPhrases.loading && savedPhrases.items.length === 0}
	{#each Array.from({ length: 3 })}
		<Skeleton class="h-14 w-full rounded-2xl" />
	{/each}
{:else if savedPhrases.items.length === 0}
	<p class="px-4 text-sm text-muted-foreground">No saved phrases yet.</p>
{:else}
	{#each savedPhrases.items as phrase (phrase.id)}
		<Item.Root variant="outline">
			<Item.Content class="max-cramped:min-w-0">
				<Item.Title
					class="max-w-full min-w-0 text-sm break-words whitespace-pre-wrap"
				>
					{phrase.text}
				</Item.Title>
			</Item.Content>
			<Item.Actions class="min-w-0">
				<Button
					variant="ghost"
					size="icon"
					aria-label={`Edit "${phrase.text}"`}
					onclick={() => openEditor(phrase)}
				>
					<PencilSimpleIcon class="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					aria-label={`Delete "${phrase.text}"`}
					onclick={() => askDelete(phrase)}
				>
					<TrashIcon class="size-4" />
				</Button>
			</Item.Actions>
		</Item.Root>
	{/each}
{/if}

<Button variant="secondary" class="self-start" onclick={() => openEditor(null)}>
	<PlusIcon class="size-4" />
	Add phrase
</Button>

<SavedPhraseDialog bind:open={dialogOpen} phrase={editing} onSave={save} />

<AlertDialog.Root bind:open={deleteOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete phrase?</AlertDialog.Title>
			<AlertDialog.Description>
				{pendingDelete?.text ?? ""} will be removed from this device. This
				cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel size="lg">Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				variant="destructive"
				size="lg"
				onclick={confirmDelete}
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
