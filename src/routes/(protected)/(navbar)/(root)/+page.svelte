<script lang="ts">
	import { toast } from "svelte-sonner";

	import {
		hydratePreferences,
		preferencesSnapshot,
	} from "$lib/app-data/preferences.svelte";
	import DataRefreshControl from "$lib/components/feedback/DataRefreshControl.svelte";
	import ScrollToTopButton from "$lib/components/shared/ScrollToTopButton.svelte";
	import {
		broadcastFailureCount,
		BroadcastState,
		type BroadcastTarget,
	} from "$lib/grid/broadcast-state.svelte";
	import { gridState } from "$lib/grid/grid-state.svelte";
	import { dismissOnBackGesture } from "$lib/platform/back-gesture-event.svelte";
	import { restoreScrollOnce } from "$lib/util/scroll-restore.svelte";
	import { SelectionSet } from "$lib/util/selection.svelte";
	import BroadcastMessageDialog from "./BroadcastMessageDialog.svelte";
	import BroadcastSelectionBar from "./BroadcastSelectionBar.svelte";
	import Grid from "./Grid.svelte";
	import LocationChooser from "./LocationEmpty.svelte";
	import TopBar from "./top-bar/TopBar.svelte";

	const preferencesHydrated = hydratePreferences();
	const geohash = $derived(preferencesSnapshot().geohash);

	let gridContainer: HTMLElement | null = $state(null);

	restoreScrollOnce(() => gridContainer, gridState);

	const broadcast = new BroadcastState();
	const selection = new SelectionSet<number>();
	let selecting = $state(false);
	let messageOpen = $state(false);

	// Selection holds ids alone, so the names come from the loaded grid items.
	const namesById = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and read inside this $derived, never mutated afterwards
		const names = new Map<number, string | null>();
		for (const item of gridState.items) {
			if (item.type === "rendered") names.set(item.id, item.displayName);
		}
		return names;
	});

	const selectedTargets = $derived<BroadcastTarget[]>(
		selection
			.values()
			.map((profileId) => ({
				profileId,
				displayName: namesById.get(profileId) ?? null,
			})),
	);

	function toggleSelected(profileId: number): void {
		if (!selecting) selecting = true;
		selection.toggle(profileId);
	}

	function exitSelection(): void {
		selecting = false;
		selection.clear();
		messageOpen = false;
		broadcast.reset();
	}

	function openMessage(): void {
		// Reopening during a run shows its progress instead of a fresh draft.
		if (!broadcast.running) broadcast.reset();
		messageOpen = true;
	}

	async function sendMessageToAll(text: string): Promise<void> {
		await broadcast.send({ targets: selectedTargets, text });
		// While the dialog is up it reports the outcome itself.
		if (messageOpen) return;
		if (broadcast.failed.length === 0) {
			toast.success(
				`Message sent to ${broadcast.sent} of ${broadcast.total} profiles`,
			);
		} else {
			toast.error(broadcastFailureCount(broadcast.failed));
		}
		exitSelection();
	}

	// The dialog owns the back gesture while it is open.
	dismissOnBackGesture({
		active: () => selecting && !messageOpen,
		dismiss: exitSelection,
	});
</script>

<svelte:head>
	<title>Open Grind</title>
</svelte:head>
{#await preferencesHydrated then}
	{#if geohash === null}
		<main class="m-auto flex max-w-full flex-1">
			<LocationChooser />
		</main>
	{:else}
		{#if selecting}
			<BroadcastSelectionBar
				count={selection.size}
				onMessage={openMessage}
				onClose={exitSelection}
			/>
		{/if}
		<BroadcastMessageDialog
			bind:open={messageOpen}
			{broadcast}
			targets={selectedTargets}
			onsend={(text) => void sendMessageToAll(text)}
			onclose={exitSelection}
		/>
		<main class="screen-nav-host">
			<TopBar
				{selecting}
				onToggleSelecting={() =>
					selecting ? exitSelection() : (selecting = true)}
			/>
			<div
				class="pull-scroller"
				bind:this={gridContainer}
				onscroll={() =>
					(gridState.scrollY = gridContainer?.scrollTop ?? 0)}
			>
				<div
					class={[
						"@container/photo-grid flex min-h-overscrollable flex-col gap-4 px-4 pb-nav-clear",
						{
							"pt-header-clear-17": !selecting,
							"pt-[calc(var(--selection-bar-height)+var(--bar-content-gap))]":
								selecting,
						},
					]}
				>
					<Grid
						{geohash}
						selection={selecting ? selection : null}
						onToggleSelected={toggleSelected}
					/>
				</div>
			</div>
			{#if !gridState.loading && !gridState.error}
				<DataRefreshControl
					container={gridContainer}
					updating={gridState.refreshing}
					position="top"
					onrefresh={() =>
						void gridState.refresh({ keepLoadedPages: false })}
				/>
			{/if}
			<ScrollToTopButton
				container={gridContainer}
				class="bottom-nav-clear"
			/>
		</main>
	{/if}
{/await}
