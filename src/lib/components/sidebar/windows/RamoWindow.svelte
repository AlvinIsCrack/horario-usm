<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { tick, untrack } from 'svelte';
	import { SidebarState } from '$lib/logic/sidebar/state.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import RamoSummary from '../../elements/RamoSummary.svelte';
	import ParaleloOption from '../../elements/ParaleloOption.svelte';

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

	let ramoSearch: HTMLInputElement | undefined = $state(undefined);
	$effect(() => {
		if (ramoSearch) {
			ramoSearch.focus();
			ramoSearch.select();
		}
	});
</script>

<div class="flex h-full max-h-[calc(100%-4rem)] w-full flex-col gap-2 overflow-visible">
	{#if !edit}
		<div>
			Busca y escoge el ramo
			<p class="text-xs opacity-50">
				Escribe para buscar entre los ramos disponibles. Puedes escribir la sigla o palabras del
				nombre del ramo.
			</p>
		</div>
		{#await import('../../elements/RamoSearch.svelte') then { default: RamoSearch }}
			<div class="mt-1 flex flex-col gap-1">
				<p class="text-muted-foreground text-xs font-bold uppercase">Ramo</p>
				<RamoSearch bind:this={ramoSearch as any} bind:value={selectedRamo} />
			</div>
		{/await}
	{/if}

	{#if selectedRamo}
		<RamoSummary sigla={selectedRamo} />
	{/if}

	{#if selectedRamo && paraleloOptions.length}
		<Separator />
		<div>
			Elige el paralelo
			<p class="text-xs opacity-50">
				Haz click en un paralelo para previsualizarlo en tu horario. Pulsa de nuevo para detener la
				previsualización.
			</p>
		</div>
		<div class="flex w-full shrink flex-col gap-2 overflow-y-auto">
			{#each paraleloOptions as paraleloOption (paraleloOption.value)}
				{@const ramo = { ...Data.cachedRamos[selectedRamo][paraleloOption.value!] }}
				{@const selected = paraleloOption.value === selectedParalelo}

				<ParaleloOption
					disabled={Calendario.hasRamo({ sigla: ramo.sigla, paralelo: ramo.paralelo })}
					onclick={() => {
						if (selected) {
							selectedParalelo = '';
							Calendario.ramoPreview = undefined;
						} else {
							selectedParalelo = paraleloOption.value;
							Calendario.ramoPreview = ramo;
						}
					}}
					{selected}
					paralelo={ramo}
				/>
			{/each}
		</div>
	{/if}

	<Button
		class="relative bottom-0 mt-auto"
		disabled={!selectedRamo || !selectedParalelo}
		variant={inHorario ? 'destructive' : 'primary'}
		onclick={async () => {
			if (!Calendario.ramoPreview) return;
			Calendario.addRamo({ ...Calendario.ramoPreview });
			await tick();
			SidebarState.close();
		}}>{inHorario ? 'Reemplazar' : 'Añadir'} ramo</Button
	>
</div>
