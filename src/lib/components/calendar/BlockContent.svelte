<script lang="ts">
	import type { Bloque } from '$lib/logic/ramos/types';
	import RamoCard from './RamoCard.svelte';

	let { bloques }: { bloques: Bloque[] | null } = $props();
</script>

<div
	class="bg-background/20 ring-input h-full w-full rounded-lg ring will-change-transform ring-inset"
>
	{#if !bloques || bloques.length === 0}{:else if bloques.length === 1}
		<RamoCard bloqueObject={bloques[0]} />
	{:else if bloques.length === 2}
		<div class="flex h-full w-full flex-row gap-1 p-1">
			<RamoCard bloqueObject={bloques[0]} />
			<RamoCard bloqueObject={bloques[1]} />
		</div>
	{:else}
		<div class="h-full w-full p-2">3 RAMOS EN CONFLICTO, ESTO NO ESTÁ IMPLEMENTADO AÚN.</div>
	{/if}
</div>
