<script lang="ts">
	import PlanSearch from '$lib/components/shared/PlanSearch.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { MallaPageState } from '../../../../routes/malla/+page.svelte';
	import { getCareerOptions } from '$lib/core/malla/data';
	import MallaStats from '$lib/core/malla/components/MallaStats.svelte';

	const currentMalla = $derived(MallaPageState.malla);
	let careerOptions = $derived(
		!currentMalla ? [] : getCareerOptions(currentMalla.selectedSede, currentMalla.selectedJornada)
	);
</script>

<div class="relative h-full w-full space-y-4">
	{#if currentMalla}
		<div class="flex w-full flex-1 flex-col gap-1">
			<p class="label">Sede</p>
			<Select
				placeholder="Selecciona..."
				class="w-full"
				items={Data.sedes.map((s) => ({ value: s }))}
				bind:value={currentMalla.selectedSede}
			/>
		</div>

		<div class="flex w-full flex-1 flex-col gap-1">
			<p class="label">Jornada</p>
			<Select
				placeholder="Diurna"
				class="w-full"
				items={Data.jornadasCarreras[currentMalla.selectedSede]?.map((j) => ({
					value: j
				})) || []}
				bind:value={currentMalla.selectedJornada}
			/>
		</div>

		<div class="flex w-full flex-col gap-1">
			<p class="label">Carrera</p>
			<PlanSearch items={careerOptions} bind:value={currentMalla.selectedPlanId} />
		</div>

		{#if currentMalla.selectedPlanId}
			<MallaStats malla={currentMalla} />
		{/if}
	{:else}
		<div
			class="text-muted-foreground flex h-full flex-1 flex-col items-center justify-center p-4 text-center"
		>
			<p class="text-sm font-medium">Selecciona un plan</p>
			<p class="text-xs">Visualiza tu trayectoria académica</p>
		</div>
	{/if}
</div>
