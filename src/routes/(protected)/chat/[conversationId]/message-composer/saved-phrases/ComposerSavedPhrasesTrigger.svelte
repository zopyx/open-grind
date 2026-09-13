<script lang="ts">
	import { BookmarkSimpleIcon } from "phosphor-svelte";
	import { expoOut } from "svelte/easing";
	import { scale } from "svelte/transition";

	import ComposerButton from "../ComposerButton.svelte";
	import { getMessageComposerContext } from "../message-composer-context.svelte";

	let { onClick }: { onClick?: () => void } = $props();

	const { disabled } = $derived(getMessageComposerContext()());
</script>

<div
	data-slot="composer-saved-phrases-trigger"
	class={["absolute right-15 bottom-0", { "pointer-events-none": disabled }]}
	transition:scale={{ duration: 400, easing: expoOut, start: 0 }}
>
	<ComposerButton
		class="static pe-1.5"
		aria-label="Saved phrases"
		onclick={() => {
			onClick?.();
		}}
		{disabled}
	>
		{#snippet icon({ ...props })}
			<BookmarkSimpleIcon {...props} class="size-5" />
		{/snippet}
	</ComposerButton>
</div>
