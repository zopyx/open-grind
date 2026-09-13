<script lang="ts">
	import { version } from "$app/environment";
	import { format } from "date-fns";

	import { appVersion, buildDate } from "$lib/build-info";
	import { buttonVariants } from "$lib/components/ui/button";
	import Link from "$lib/components/ui/link/Link.svelte";
	import * as ResponsiveDialog from "$lib/components/ui/responsive-dialog";

	let { open = $bindable() }: { open: boolean } = $props();

	const links = [
		{ label: "Website", destination: "https://opengrind.org" },
		{
			label: "Source",
			destination: "https://git.opengrind.org/open-grind/open-grind/",
		},
		{
			label: "Changelog",
			destination:
				"https://git.opengrind.org/open-grind/open-grind/src/branch/main/CHANGELOG.md",
		},
	];

	const built = format(buildDate, "PPpp");
</script>

<ResponsiveDialog.Root bind:open>
	<ResponsiveDialog.Content class="flex flex-col gap-4">
		<ResponsiveDialog.Header>
			<ResponsiveDialog.Title>Open Grind</ResponsiveDialog.Title>
			<ResponsiveDialog.Description>
				Unofficial Grindr client. Free, libre, ad-free and tracker-free.
			</ResponsiveDialog.Description>
		</ResponsiveDialog.Header>
		<ResponsiveDialog.Body class="flex flex-col gap-3">
			<dl class="flex flex-col gap-2 text-sm">
				<div class="flex min-w-0 items-baseline justify-between gap-4">
					<dt class="text-muted-foreground">Version</dt>
					<dd class="truncate font-mono">{appVersion}</dd>
				</div>
				<div class="flex min-w-0 items-baseline justify-between gap-4">
					<dt class="text-muted-foreground">Built</dt>
					<dd class="truncate font-mono">{built}</dd>
				</div>
			</dl>
			<p
				class="font-mono text-xs break-all whitespace-pre-wrap text-muted-foreground select-text"
			>
				<!-- `version` carries the app version and the Grindr API version. -->
				{version}
			</p>
		</ResponsiveDialog.Body>
		<ResponsiveDialog.Footer
			class="flex-col items-stretch gap-2 sm:flex-col sm:items-stretch"
		>
			{#each links as link (link.destination)}
				<Link
					href={link.destination}
					class={[buttonVariants({ variant: "secondary" }), "w-full"]}
				>
					{link.label}
				</Link>
			{/each}
		</ResponsiveDialog.Footer>
	</ResponsiveDialog.Content>
</ResponsiveDialog.Root>
