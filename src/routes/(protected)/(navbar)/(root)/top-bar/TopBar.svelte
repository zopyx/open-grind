<script lang="ts">
	import { CheckSquareIcon } from "phosphor-svelte";

	import CommandCenterTrigger from "$lib/components/command-center/CommandCenterTrigger.svelte";
	import FilterPresetPicker from "$lib/components/filters/FilterPresetPicker.svelte";
	import ProgressiveBlur from "$lib/components/shared/ProgressiveBlur.svelte";
	import { Button } from "$lib/components/ui/button";
	import { gridState } from "$lib/grid/grid-state.svelte";
	import { defaultFilterPreset } from "$lib/model/browse/grid/presets";
	import GridFilters from "../GridFilters.svelte";
	import LocationChange from "../LocationChange.svelte";
	import QuickFilters from "./QuickFilters.svelte";

	let {
		selecting,
		onToggleSelecting,
	}: { selecting: boolean; onToggleSelecting: () => void } = $props();

	let openFilters = $state({ all: false, age: false, position: false });

	const filters = $derived(
		gridState.filters.value ?? defaultFilterPreset.filters,
	);
</script>

<ProgressiveBlur
	data-fixed-header
	inert={selecting || undefined}
	class="fixed top-0 left-0 z-10 w-full"
	bgClass="bg-linear-to-b from-background to-transparent"
	contentClass="flex flex-col pt-fixed-header"
	direction="topToBottom"
>
	<div class="scrollbar-thin flex gap-0.5 overflow-x-auto p-4 pt-0">
		<LocationChange />
		<QuickFilters bind:openFilters />
		<CommandCenterTrigger />
		<div class="ms-auto flex shrink-0 items-center gap-0.5">
			<Button
				variant="secondary"
				size="icon"
				aria-label="Select profiles"
				aria-pressed={selecting}
				onclick={onToggleSelecting}
			>
				<CheckSquareIcon />
			</Button>
			<FilterPresetPicker
				{filters}
				compact
				onApply={(next) => gridState.filters.set(next)}
			/>
		</div>
	</div>
</ProgressiveBlur>
<GridFilters bind:open={openFilters.all} />
