<script lang="ts">
	import PlanSearch from '$lib/components/shared/PlanSearch.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { MallaPageState } from '../../../../routes/malla/+page.svelte';
	import { getCareerOptions } from '$lib/core/malla/data';
	import MaterialSymbolsInfo from '$lib/icons/MaterialSymbolsInfo.svelte';

	const currentMalla = $derived(MallaPageState.malla);
	let careerOptions = $derived(
		!currentMalla ? [] : getCareerOptions(currentMalla.selectedSede, currentMalla.selectedJornada)
	);
</script>

<div class="relative h-full w-full space-y-4">
	{#if currentMalla}
		<div class="flex w-full flex-1 flex-col gap-1">
			<p class="text-muted-foreground text-xs font-bold uppercase">Sede</p>
			<Select
				placeholder="Selecciona..."
				class="w-full"
				items={Data.sedes.map((s) => ({ value: s }))}
				bind:value={currentMalla.selectedSede}
			/>
		</div>

		<div class="flex w-full flex-1 flex-col gap-1">
			<p class="text-muted-foreground text-xs font-bold uppercase">Jornada</p>
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
			<p class="text-muted-foreground text-xs font-bold uppercase">Carrera</p>
			<PlanSearch items={careerOptions} bind:value={currentMalla.selectedPlanId} />
		</div>

		{#if currentMalla.selectedPlanId}
			{@const stats = (() => {
				let totalCreditos = 0;
				let approvedCreditos = 0;
				let totalRamos = 0;
				let approvedRamos = 0;
				let unlockableRamos = 0;
				let maxSemestres = 0;

				if (currentMalla.rawMalla) {
					currentMalla.rawMalla.forEach((semestre, i) => {
						if (semestre.length > 0) {
							maxSemestres = Math.max(maxSemestres, i + 1);
						}

						semestre.forEach((ramo) => {
							totalCreditos += ramo.creditos;
							totalRamos++;

							const isApproved = currentMalla.approvedSigs.has(ramo.sigla);
							if (isApproved) {
								approvedCreditos += ramo.creditos;
								approvedRamos++;
							} else {
								// Evaluates if all groups of prerequisites have at least one approved requirement (OR logic)
								const requirementsMet = ramo.requisitos.every((reqGroup) =>
									reqGroup.some((req) => currentMalla.approvedSigs.has(req.sigla))
								);

								if (requirementsMet || ramo.requisitos.length === 0) {
									unlockableRamos++;
								}
							}
						});
					});
				}
			})()}
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
