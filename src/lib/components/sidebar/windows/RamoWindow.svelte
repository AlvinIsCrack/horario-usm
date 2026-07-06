<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { tick, untrack } from 'svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import RamoSummary from '../../shared/RamoSummary.svelte';
	import { slide } from 'svelte/transition';
	import ParaleloList from '../../shared/ParaleloList.svelte';

	let {
		edit
	}: {
		edit?: {
			sigla: string;
			paralelo: string;
		};
	} = $props();

	let selectedRamo = $state(edit?.sigla ?? '');
	let selectedParalelo = $state(edit?.paralelo ?? '');

	$effect(() => {
		const _ = selectedRamo;
		untrack(() => {
			selectedParalelo = '';
			Calendario.ramoPreview = undefined;
		});
	});

	$effect(() => {
		return () => {
			selectedParalelo = '';
		};
	});

	const paraleloOptions = $derived(
		Object.keys(selectedRamo ? Data.cachedRamos[selectedRamo] : []).map((paralelo) => ({
			value: paralelo
		}))
	);

	const inHorario = $derived(Calendario.hasRamo({ sigla: selectedRamo }));
</script>

<div class="flex h-full max-h-[calc(100%-4rem)] w-full flex-col gap-2 overflow-visible">
	{#if !edit}
		{#await import('../../shared/RamoSearch.svelte') then { default: RamoSearch }}
			<div class="flex flex-col gap-1">
				<div class="mb-1 flex items-center gap-2">
					<span
						class="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
						>1</span
					>
					<p class="text-muted-foreground text-xs font-bold uppercase">Añadir Ramo</p>
				</div>

				{#if !selectedRamo}
					<div
						class="text-muted-foreground text-xs leading-relaxed"
						transition:slide={{ duration: 150, axis: 'y' }}
					>
						Busca un ramo por su nombre o sigla (ej. MAT023, FIS120). Una vez seleccionado, su
						información y sus paralelos disponibles aparecerán aquí.
					</div>
				{/if}

				<RamoSearch bind:value={selectedRamo} />
			</div>
		{/await}
	{/if}

	{#if selectedRamo}
		<div class="shrink-0">
			<RamoSummary sigla={selectedRamo} />
		</div>
	{/if}

	{#if selectedRamo && paraleloOptions.length}
		<Separator class="shrink-0" />
		<div class="flex shrink-0 flex-col gap-1">
			<div class="mb-1 flex items-center gap-2">
				<span
					class="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
					>2</span
				>
				<p class="text-muted-foreground text-xs font-bold uppercase">Elegir paralelo</p>
			</div>

			{#if !Calendario.ramoPreview && !Calendario.ramos.length}
				<div
					class="text-muted-foreground text-xs leading-relaxed"
					transition:slide={{ duration: 150, axis: 'y' }}
				>
					Haz click en un paralelo para previsualizarlo en tu horario. Pulsa de nuevo para detener
					la previsualización.
				</div>
			{/if}
		</div>

		<ParaleloList sigla={selectedRamo} bind:selectedParalelo />
	{/if}

	{#if Calendario.ramoPreview}
		<Separator class="mt-auto" />
		<div class="flex shrink-0 flex-col gap-1 pb-4">
			<div class="mb-1 flex items-center gap-2">
				<span
					class="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
					>3</span
				>
				<p class="text-muted-foreground text-xs font-bold uppercase">
					{inHorario ? 'Actualizar' : 'Confirmar'} ramo
				</p>
			</div>

			<Button
				disabled={!selectedRamo || !selectedParalelo}
				onclick={async () => {
					if (!Calendario.ramoPreview) return;
					Calendario.addRamo({ ...Calendario.ramoPreview });
					await tick();
					SidebarState.close();
				}}
			>
				Aceptar
			</Button>
		</div>
	{/if}
</div>
