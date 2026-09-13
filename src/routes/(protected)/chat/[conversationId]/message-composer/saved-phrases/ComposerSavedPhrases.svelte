<script lang="ts">
	import ComposerSavedPhrasesMenu from "./ComposerSavedPhrasesMenu.svelte";
	import ComposerSavedPhrasesTrigger from "./ComposerSavedPhrasesTrigger.svelte";

	let menuOpen = $state(false);
</script>

<ComposerSavedPhrasesTrigger onClick={() => (menuOpen = true)} />
<ComposerSavedPhrasesMenu bind:open={menuOpen} />
