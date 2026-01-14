<script lang="ts">
	import PlanSearch from '$lib/components/elements/PlanSearch.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { fade } from 'svelte/transition';
	import { MallaPageState } from '../../../../routes/malla/+page.svelte';
	import { getCareerOptions } from '$lib/logic/malla/data';

	// Usamos el estado derivado de mallaState directamente
	let careerOptions = $derived(
		!MallaPageState.malla
			? []
			: getCareerOptions(MallaPageState.malla.selectedSede, MallaPageState.malla.selectedJornada)
	);
</script>

<div class="w-full relative h-full">
	{#if MallaPageState.malla}
		<div class="flex flex-[0.5] items-center justify-center gap-2">
			{#if MallaPageState.malla.selectedPlanId}
				<span class="text-muted-foreground text-sm">
					<span class="text-foreground">{MallaPageState.malla.stats.percent}% completado</span> • {MallaPageState
						.malla.stats.creditos} SCT
				</span>
			{/if}
		</div>

		<div class="relative flex w-full flex-1 flex-col items-end gap-4">
			<div class="flex w-full flex-1 flex-col gap-1">
				<p class="text-muted-foreground text-xs font-bold uppercase">Sede</p>
				<Select
					placeholder="Selecciona..."
					class="w-full"
					items={Data.sedes.map((s) => ({ value: s }))}
					bind:value={MallaPageState.malla.selectedSede}
				/>
			</div>

			<div class="flex w-full flex-1 flex-col gap-1">
				<p class="text-muted-foreground text-xs font-bold uppercase">Jornada</p>
				<Select
					placeholder="Diurna"
					class="w-full"
					items={Data.jornadasCarreras[MallaPageState.malla.selectedSede]?.map((j) => ({
						value: j
					})) || []}
					bind:value={MallaPageState.malla.selectedJornada}
				/>
			</div>

			<div class="flex w-full flex-col gap-1">
				<p class="text-muted-foreground text-xs font-bold uppercase">Carrera</p>
				<PlanSearch items={careerOptions} bind:value={MallaPageState.malla.selectedPlanId} />
			</div>
		</div>

		<div class="relative bottom-0 mt-8 flex w-full flex-row flex-wrap items-end gap-y-0.5 gap-x-3 text-xs">
			<div class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>
				<span>Pre-requisito</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]"></span>
				<span>Co-requisito</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-lime-500 shadow-[0_0_6px_rgba(132,204,22,0.6)]"></span>
				<span>Desbloqueo Parcial</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"></span>
				<span>Desbloqueo Directo</span>
			</div>
		</div>
	{/if}
</div>
