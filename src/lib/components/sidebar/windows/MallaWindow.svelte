<script lang="ts">
	import PlanSearch from '$lib/components/elements/PlanSearch.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { MallaPageState } from '../../../../routes/malla/+page.svelte';
	import { getCareerOptions } from '$lib/logic/malla/data';
	import MaterialSymbolsInfo from '$lib/icons/MaterialSymbolsInfo.svelte';

	let careerOptions = $derived(
		!MallaPageState.malla
			? []
			: getCareerOptions(MallaPageState.malla.selectedSede, MallaPageState.malla.selectedJornada)
	);

	let s = $derived(MallaPageState.malla?.stats);
</script>

<div class="relative flex h-full w-full flex-col items-center justify-between">
	{#if MallaPageState.malla}
		<div class="relative w-full flex-1 space-y-2">
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

		{#if MallaPageState.malla.selectedPlanId && s}
			<div class="w-full flex-2 space-y-2 overflow-y-auto select-none">
				<div class="bg-card/50 space-y-1 rounded-md border p-4 shadow-sm">
					<div class="flex items-end justify-between">
						<div>
							<h3 class="text-sm font-medium opacity-80">Avance Global</h3>
							<p class="text-3xl font-black tracking-tighter">
								{s.percent}<span class="ml-0.5 text-base font-bold opacity-50">%</span>
							</p>
						</div>
						<div class="text-right">
							<p class="-mb-0.5 text-xs font-medium text-lime-600">
								{s.approvedCreditos} SCT Aprobados
							</p>
							<p class="text-muted-foreground text-[10px]">de {s.totalCreditos} totales</p>
						</div>
					</div>

					<div
						class="bg-secondary border-border relative h-3 w-full overflow-hidden rounded-full border"
					>
						<div
							class="bg-primary absolute top-0 left-0 h-full transition-[width] duration-1000 ease-out starting:w-0"
							style="width: {s.percent}%;"
						></div>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-2">
					<div class="bg-card/30 flex flex-col gap-1 rounded-md border p-3">
						<div class="text-muted-foreground flex items-center gap-2">
							<MaterialSymbolsInfo class="size-4" />
							<span class="text-[10px] font-bold uppercase">Ramos</span>
						</div>
						<span class="text-xl font-bold">
							{s.approvedRamos}
							<span class="text-muted-foreground text-sm font-medium">/ {s.totalRamos}</span>
						</span>
					</div>

					<!-- <div
						class="flex flex-col gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-blue-600"
					>
						<div class="flex items-center gap-2 opacity-80">
							<Teachers class="size-4" />
							<span class="text-[10px] font-bold uppercase">Disponibles</span>
						</div>
						<div class="flex items-baseline gap-1">
							<span class="text-xl font-bold">{s.unlockableRamos}</span>
							<span class="text-[10px] leading-none">para cursar</span>
						</div>
					</div> -->

					<!-- <div
						class="bg-card/30 col-span-2 flex flex-row items-center justify-between gap-1 rounded-md border p-3"
					>
						<div class="flex flex-col">
							<div class="text-muted-foreground flex items-center gap-2">
								<MaterialSymbolsAvTimerRounded class="size-4" />
								<span class="text-[10px] font-bold uppercase">Duración Nominal</span>
							</div>
							<div class="mt-1 flex items-baseline gap-1">
								<span class="text-lg font-bold">{s.duracionTeoricaAnos}</span>
								<span class="text-muted-foreground text-xs"
									>años ({s.semestresTotales} semestres)</span
								>
							</div>
						</div>

						{#if s.percent > 0 && s.percent < 100}
							<div class="text-right">
								<span class="text-muted-foreground block text-[10px]">Te faltarían aprox.</span>
								<span class="text-foreground font-mono text-sm font-bold"
									>~{s.estimacionAnosRestantes} años</span
								>
							</div>
						{/if}
					</div> -->
				</div>
			</div>
		{/if}

		<div
			class="relative bottom-0 flex w-full flex-row flex-wrap items-end gap-x-3 gap-y-0.5 p-2 text-xs"
		>
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
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center p-4 text-center opacity-50">
			<p class="text-sm font-medium">Selecciona un plan</p>
			<p class="text-xs">Visualiza tu trayectoria académica</p>
		</div>
	{/if}
</div>
