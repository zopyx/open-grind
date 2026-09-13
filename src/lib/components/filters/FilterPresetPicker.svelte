<script lang="ts">
	import {
		BookmarkSimpleIcon,
		CaretDownIcon,
		CheckIcon,
		TrashIcon,
	} from "phosphor-svelte";

	import { Button } from "$lib/components/ui/button";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { Input } from "$lib/components/ui/input";
	import { gridState } from "$lib/grid/grid-state.svelte";
	import {
		FILTER_PRESET_NAME_MAX_LENGTH,
		type FilterPreset,
		isBuiltInFilterPreset,
	} from "$lib/model/browse/grid/presets";
	import { deepEqual } from "$lib/util/deep-equal";
	import type { GridSearchFilters } from "$lib/model/browse/grid/filters";

	let {
		filters = $bindable(),
		compact = false,
		onApply,
	}: {
		filters: GridSearchFilters;
		/** Icon-only trigger, for the grid's top bar. */
		compact?: boolean;
		/** Applies straight away instead of editing a draft, e.g. in the top bar. */
		onApply?: (filters: GridSearchFilters) => void;
	} = $props();

	let naming = $state(false);
	let name = $state("");

	const presets = $derived(gridState.filterPresets.all());
	const applied = $derived(
		presets.find((preset) => deepEqual(preset.filters, filters)) ?? null,
	);
	const appliedName = $derived(applied?.name ?? "Custom filters");
	const canSave = $derived(name.trim().length > 0);

	function apply(preset: FilterPreset): void {
		const next = $state.snapshot(preset.filters);
		if (onApply) onApply(next);
		else filters = next;
	}

	async function save(): Promise<void> {
		const saved = await gridState.filterPresets.save({ name, filters });
		if (!saved) return;
		name = "";
		naming = false;
	}

	function cancel(): void {
		name = "";
		naming = false;
	}
</script>

<div class="flex min-w-0 flex-col">
	{#if naming}
		<form
			class="flex min-w-0 items-center gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				void save();
			}}
		>
			<Input
				bind:value={name}
				maxlength={FILTER_PRESET_NAME_MAX_LENGTH}
				placeholder="Preset name"
				aria-label="Preset name"
				class="h-8 text-sm"
			/>
			<Button type="submit" size="sm" disabled={!canSave}>Save</Button>
			<Button type="button" size="sm" variant="ghost" onclick={cancel}>
				Cancel
			</Button>
		</form>
	{:else}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props: { class: className, ...props } })}
					<Button
						{...props}
						variant="secondary"
						size={compact ? "icon" : "sm"}
						class={[className, "w-fit"]}
						aria-label={compact
							? `Filter presets: ${appliedName}`
							: "Filter presets"}
					>
						<BookmarkSimpleIcon />
						{#if !compact}
							{appliedName}
						{/if}
						<CaretDownIcon />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-64" align="start">
				<DropdownMenu.Label>Presets</DropdownMenu.Label>
				{#each presets as preset (preset.id)}
					<DropdownMenu.Item onSelect={() => apply(preset)}>
						<CheckIcon
							class={{ "opacity-0": applied?.id !== preset.id }}
						/>
						{preset.name}
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => (naming = true)}>
					<BookmarkSimpleIcon />
					Save current filters as preset...
				</DropdownMenu.Item>
				{#if applied && !isBuiltInFilterPreset(applied.id)}
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						variant="destructive"
						onSelect={() =>
							void gridState.filterPresets.remove(applied.id)}
					>
						<TrashIcon />
						Delete "{applied.name}"
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}
</div>
