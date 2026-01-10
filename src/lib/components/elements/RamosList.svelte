<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { Data } from '$lib/data/data.svelte';
	import Add from '$lib/icons/add.svelte';
	import Circles from '$lib/icons/circles.svelte';
	import Edit from '$lib/icons/edit.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import type { RamoCarrera } from '$lib/types/horario';
	import Badge from '../ui/Badge.svelte';
	import { SideBar } from '../sidebar/SideBar.svelte';
	import RamoWindow from '../sidebar/windows/RamoWindow.svelte';
	import ProfessorCard from '$lib/logic/professors/components/ProfessorCard.svelte';

	const ramosCarrera: (RamoCarrera | undefined)[] = $derived(
		Calendario.ramos.map((r) =>
			Data.getInfoRamoCarrera(r.sigla, Calendario.sede, Calendario.jornada)
		)
	);

	// 1. Calculamos el total de SCT en una variable reactiva limpia
	const totalSCT = $derived(ramosCarrera.reduce((sum, r) => sum + (r?.creditos ?? 0), 0));

	// 2. Extraemos la lógica de colores/estados de Statistics.svelte (Carga SIGA)
	const sctStatusInfo = $derived.by(() => {
		if (totalSCT === 0) return { color: '', tooltip: 'Créditos totales (SCT)' };

		// Lógica oficial: < 17 (Peligro/Subcarga), > 35 (Warning/Sobrecarga), Resto (Success)
		if (totalSCT < 17) {
			return {
				color: 'bg-red-500/20 text-red-100 border-red-500/50 border',
				tooltip: 'ALERTA: Menos de 17 SCT (Riesgo de alumno parcial/pérdida de beneficios).'
			};
		} else if (totalSCT > 35) {
			return {
				color: 'bg-amber-500/20 text-amber-100 border-amber-500/50 border',
				tooltip: 'ADVERTENCIA: Más de 35 SCT (Requiere autorización de sobrecarga).'
			};
		} else {
			return {
				color: 'bg-green-500/20 text-green-100 border-green-500/50 border',
				tooltip: 'Carga académica estándar (17 - 35 SCT).'
			};
		}
	});
</script>

<div class="mt-2 flex h-full flex-col gap-1 overflow-x-visible overflow-y-auto">
	{#if !Calendario.ramos.length}
		<p class="opacity-50">No hay ramos registrados.</p>
	{:else}
		<div class="flex w-full flex-row items-center justify-between gap-2 text-sm">
			<div class="-mt-1">
				<h1 class="text-sm font-normal">Ramos registrados</h1>
				<p class="text-xs opacity-50">
					{Calendario.ramos.filter((_, i) => ramosCarrera[i]?.creditos).length} ramos
				</p>
			</div>

			{#if totalSCT}
				<Tooltip
					wrapperClass="starting:opacity-0 opacity-100 duration-400"
					content={sctStatusInfo.tooltip}
				>
					<Badge icon={Circles} class="transition-colors duration-300 {sctStatusInfo.color}">
						{totalSCT} SCT
					</Badge>
				</Tooltip>
			{/if}
		</div>
		<div class="flex h-full w-full flex-col gap-0.5 overflow-y-auto p-1">
			{#each Calendario.ramos as ramo, i (i)}
				{@const highlighted =
					Calendario.ramoPreview?.sigla === ramo.sigla &&
					Calendario.ramoPreview?.paralelo === ramo.paralelo}
				{@const { creditos } = ramosCarrera[i] ?? {}}

				{#snippet ramoTooltip()}
					<div class="max-h-200 space-y-1 overflow-y-visible p-1 text-left">
						<h1 class="w-full text-left text-base font-medium">Profesores</h1>
						<div class="my-2 mb-4 w-full scale-x-200 border-b-1"></div>
						{#each ramo.profesor as profesor (profesor)}
							<div class="bg-card mr-2 overflow-hidden rounded-lg border p-3">
								{#if profesor.includes('NN')}
									<p class="font-medium opacity-50">NN (Profesor aún no asignado)</p>
								{:else}
									<ProfessorCard id={profesor} />
								{/if}
							</div>
						{/each}
					</div>
				{/snippet}

				<Tooltip
					position="right"
					interactive
					content={ramoTooltip}
					class="bg-card/50! max-w-2xs! overflow-hidden 2xl:max-w-xs!"
					forceVisible={Boolean(ramo.profesor.length) && highlighted}
				>
					<div
						role="listitem"
						class="{highlighted
							? 'bg-accent text-accent-foreground ring'
							: 'bg-popover text-popover-foreground'} group pointer-events-auto relative w-full overflow-hidden rounded-lg border px-2 py-1 pl-5"
						onmouseenter={() => (Calendario.ramoPreview = ramo)}
						onmouseleave={() => (Calendario.ramoPreview = undefined)}
					>
						<div
							class="absolute left-0 h-full w-2 scale-y-150"
							style:background={ramo.color?.hexa() ?? '#0000'}
						></div>

						<div class="mb-1 text-sm leading-tight font-medium" title={ramo.nombre}>
							{ramo.nombre}
						</div>

						<div class="text-foreground/50 pointer -mt-1 flex flex-row gap-4 text-xs">
							<b>{ramo.sigla}</b> PAR. {ramo.paralelo}
						</div>

						<div
							class="bg-accent pointer-events-auto absolute top-0 right-1 z-10 flex h-full flex-row items-center justify-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100"
						>
							<Tooltip content="Editar/reemplazar">
								<Button
									variant="secondary"
									size="icon"
									onclick={() =>
										SideBar.setActiveWindow(RamoWindow, {
											edit: {
												sigla: ramo.sigla,
												paralelo: ramo.paralelo
											}
										})}
								>
									<Edit class="scale-150" />
								</Button>
							</Tooltip>

							<Tooltip content="Eliminar">
								<Button
									variant="destructive"
									size="icon"
									onclick={() => Calendario.removeRamo(ramo.sigla)}
								>
									<Add class="scale-150 rotate-45" />
								</Button>
							</Tooltip>
						</div>
						<div
							class="pointer-events-none absolute top-0 right-0 flex h-full flex-row items-end justify-end gap-1 p-1 px-2 text-right opacity-100 transition-all duration-200 group-hover:opacity-0"
						>
							{#if creditos}
								<div class="text-xs font-medium opacity-50">
									<p>
										{creditos} SCT
									</p>
								</div>
							{/if}
						</div>
					</div>
				</Tooltip>
			{/each}
		</div>
	{/if}
</div>
