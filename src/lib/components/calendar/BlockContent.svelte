<script lang="ts">
	import type { Bloque } from '$lib/core/ramos/types';
	import RamoCard from './RamoCard.svelte';

	let { bloques }: { bloques: Bloque[] | null } = $props();
</script>

<div
	class="bg-background/20 ring-input h-full w-full rounded-lg ring will-change-transform ring-inset"
>
	{#if bloques}
		{#if bloques.length === 1}
			<RamoCard bloqueObject={bloques[0]} />
		{:else if bloques.length === 2}
			<div class="flex h-full w-full flex-row gap-1 p-1">
				<RamoCard bloqueObject={bloques[0]} />
				<RamoCard bloqueObject={bloques[1]} />
			</div>
		{:else}
			<div
				class="text-foreground from-destructive to-destructive/60 relative flex h-full flex-col gap-0.5 overflow-hidden rounded-lg bg-linear-to-br p-3 text-sm leading-tight font-medium tracking-tight"
			>
				<div
					class="border-destructive-foreground! absolute top-0 left-0 size-full animate-pulse border-4"
				></div>

				{#each bloques as el}
					<div class="text-destructive-foreground w-full truncate border-b py-0.5 font-mono">
						{el.ramo?.sigla} - P{el.ramo?.paralelo}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
