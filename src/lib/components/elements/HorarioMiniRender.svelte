<script lang="ts">
	import { Calendario } from '$lib/states/calendario.svelte';
	import { Días, type Bloque } from '$lib/types/horario';
	import { cn } from '$lib/utils'; // Asumo que tienes una utilidad tipo shadcn, si no, usa string template normal

	let { bloques, class: className }: { bloques: Bloque[]; class?: string } = $props();

	// Calculamos rangos dinámicos, pero con un mínimo sensato (Lunes-Viernes, bloque 1-8)
	// para que no se vea deforme si el ramo tiene pocos bloques.
	const [minBloque, maxBloque] = $derived.by(() => {
		if (bloques.length === 0) return [1, 8];
		const b = bloques.map((b) => b.bloque);
		return [Math.min(1, ...b), Math.max(9, ...b)]; // Extendemos un poco el max
	});

	const [minDia, maxDia] = $derived.by(() => {
		if (bloques.length === 0) return [Días.Lunes, Días.Viernes];
		const d = bloques.map((b) => b.dia);
		return [Días.Lunes, Math.max(Días.Viernes, ...d)];
	});

	const numDias = $derived(maxDia - minDia + 1);

	// Pre-calculamos un Set para búsqueda O(1) rápida de los bloques "nuevos"
	const activeBlocksSet = $derived.by(() => {
		const set = new Set<string>();
		bloques.forEach((b) => set.add(`${b.dia}-${b.bloque}`));
		return set;
	});
</script>

<div class={cn('flex flex-col gap-1 select-none', className)}>
	<div class="grid gap-1 text-center" style="grid-template-columns: 1rem repeat({numDias}, 1fr);">
		<div class=""></div>
		{#each Array.from({ length: numDias }, (_, i) => minDia + i) as dia}
			<div class="text-muted-foreground text-[10px] font-bold opacity-70">
				{Días[dia].charAt(0)}
			</div>
		{/each}
	</div>

	<div class="grid gap-x-1 gap-y-0.5" style="grid-template-columns: 1rem repeat({numDias}, 1fr);">
		{#each Array.from({ length: maxBloque - minBloque + 1 }, (_, i) => minBloque + i) as bloque}
			<div class="text-muted-foreground flex items-center justify-center font-mono text-[9px]">
				{bloque}
			</div>

			{#each Array.from({ length: numDias }, (_, i) => minDia + i) as dia}
				{@const key = `${dia}-${bloque}`}
				{@const isNew = activeBlocksSet.has(key)}
				{@const existing = Calendario.getBloques(dia, bloque)}
				{@const isOccupied = existing && existing.length > 0}

				{@const isConflict =
					isNew &&
					isOccupied &&
					existing?.some((b) => !bloques.some((newB) => newB.ramo.sigla === b.ramo.sigla))}

				<div class="flex aspect-square items-center justify-center">
					<div
						class="rounded-full transition-all duration-300"
						class:w-2={isNew || isOccupied}
						class:h-2={isNew || isOccupied}
						class:w-0.5={!isNew && !isOccupied}
						class:h-0.5={!isNew && !isOccupied}
						class:bg-destructive={isConflict}
						class:bg-primary={isNew && !isConflict}
						class:bg-muted-foreground={!isNew && isOccupied}
						class:bg-muted={!isNew && !isOccupied}
					></div>
				</div>
			{/each}
		{/each}
	</div>
</div>
