<script lang="ts">
	import MultilineField from "$lib/components/fields/MultilineField.svelte";
	import { Button } from "$lib/components/ui/button";
	import * as ResponsiveDialog from "$lib/components/ui/responsive-dialog";
	import {
		type SavedPhrase,
		savedPhraseLimits,
	} from "$lib/model/messaging/saved-phrases";

	let {
		open = $bindable(false),
		phrase = null,
		onSave,
	}: {
		open?: boolean;
		phrase?: SavedPhrase | null;
		onSave: (text: string) => void | Promise<void>;
	} = $props();

	let text = $state("");
	let saving = $state(false);

	// Prefilled when editing, empty when adding.
	$effect(() => {
		if (open) text = phrase?.text ?? "";
	});

	const trimmed = $derived(text.trim());
	const valid = $derived(
		trimmed !== "" &&
			trimmed.length <= savedPhraseLimits.text &&
			trimmed !== phrase?.text,
	);

	async function save() {
		if (!valid || saving) return;
		saving = true;
		try {
			await onSave(trimmed);
			open = false;
		} finally {
			saving = false;
		}
	}
</script>

<ResponsiveDialog.Root bind:open>
	<ResponsiveDialog.Content>
		<ResponsiveDialog.Header>
			<ResponsiveDialog.Title>
				{phrase ? "Edit phrase" : "New phrase"}
			</ResponsiveDialog.Title>
			<ResponsiveDialog.Description>
				Stored on this device. Insert it from the composer's bookmark
				button.
			</ResponsiveDialog.Description>
		</ResponsiveDialog.Header>
		<ResponsiveDialog.Body>
			<MultilineField
				label="Phrase"
				bind:value={text}
				maxLength={savedPhraseLimits.text}
				placeholder="Hey, how's it going?"
			/>
		</ResponsiveDialog.Body>
		<ResponsiveDialog.Footer class="flex-row justify-end gap-2">
			<Button variant="secondary" onclick={() => (open = false)}>
				Cancel
			</Button>
			<Button disabled={!valid || saving} onclick={save}>
				{phrase ? "Save changes" : "Save phrase"}
			</Button>
		</ResponsiveDialog.Footer>
	</ResponsiveDialog.Content>
</ResponsiveDialog.Root>
