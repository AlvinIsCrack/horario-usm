<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import Add from '$lib/icons/add.svelte';
	import Circles from '$lib/icons/circles.svelte';
	import Edit from '$lib/icons/edit.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import Badge from '../ui/Badge.svelte';
	import RamoWindow from '../sidebar/windows/RamoWindow.svelte';
	import ProfessorCard from '$lib/core/professors/components/ProfessorCard.svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import MaterialSymbolsMenu from '$lib/icons/MaterialSymbolsMenu.svelte';
	import MenuItem from '../ui/menu/MenuItem.svelte';
	import { Menu } from '../ui/menu';
	import { cn } from '$lib/utils';
	import MaterialSymbolsMoreVert from '$lib/icons/MaterialSymbolsMoreVert.svelte';

	/**
	 * Total credits (SCT) calculated reactively from the registered academic subjects.
	 */
	const totalSCT = $derived(Calendario.ramos.reduce((sum, ramo) => sum + (ramo?.creditos ?? 0), 0));

	/**
	 * UI styling and tooltip messaging derived from the total credit load thresholds.
	 * Thresholds: Underload (< 17 SCT), Overload (> 35 SCT), Standard (17 - 35 SCT).
	 */
	const sctStatus = $derived.by(() => {
		if (totalSCT === 0) {
			return { color: '', tooltip: 'Créditos totales (SCT)' };
		}

		if (totalSCT < 17) {
			return {
				color: 'bg-red-500/20 text-red-300 border-red-500/50 border',
				tooltip: 'Menos de 17 SCT (Riesgo de alumno parcial/pérdida de beneficios).'
			};
		}

		if (totalSCT > 35) {
			return {
				color: 'bg-amber-500/20 text-amber-300 border-amber-500/50 border',
				tooltip: 'Más de 35 SCT (Requiere autorización de sobrecarga).'
			};
		}

		return {
			color: 'bg-green-500/20 text-green-200 border-green-500/50 border',
			tooltip: 'Carga académica estándar (17-35 SCT).'
		};
	});
</script>

<div class="flex h-full flex-col gap-2 overflow-x-visible overflow-y-auto">
	{#if !Calendario.ramos.length}
		<p class="opacity-50">No hay ramos registrados.</p>
	{:else}
		<div class="-mb-1 flex w-full flex-row items-center justify-between gap-2 text-sm">
			<h1 class="text-sm font-normal">Ramos registrados</h1>
			{#if totalSCT}
				<Tooltip
					wrapperClass="starting:opacity-0 opacity-100 duration-400 text-xs text-muted-foreground"
					content={sctStatus.tooltip}
				>
					<span>
						<b class={cn('text-foreground', sctStatus.color, 'border-none! bg-transparent!')}
							>{totalSCT} SCT</b
						> en total
					</span>
				</Tooltip>
			{/if}
		</div>

		<div class="flex h-full w-full flex-col gap-0.5 overflow-y-auto">
			{#each Calendario.ramos as ramo, index (index)}
				{@const isHighlighted =
					Calendario.ramoPreview?.sigla === ramo.sigla &&
					Calendario.ramoPreview?.paralelo === ramo.paralelo}
				{@const isLocalHover = Calendario.ramoPreview === ramo}

				{#snippet professorTooltip()}
					<div class="max-h-200 space-y-1 overflow-y-visible p-1 text-left">
						<h1 class="w-full text-left text-base font-medium">Profesores</h1>
						<div class="my-2 mb-4 w-full scale-x-200 border-b"></div>
						{#each ramo.profesor as professor (professor)}
							<div class="bg-card mr-2 overflow-hidden rounded-lg border p-3">
								{#if professor.includes('NN')}
									<p class="font-medium opacity-50">NN (Profesor aún no asignado)</p>
								{:else}
									<ProfessorCard id={professor} />
								{/if}
							</div>
						{/each}
					</div>
				{/snippet}

				{#snippet ramoCard()}
					<div
						role="listitem"
						class="group pointer-events-auto relative w-full rounded-md border px-3 py-2 {isHighlighted
							? 'text-accent-foreground'
							: 'text-popover-foreground'}"
						style:border-color={ramo.color?.hexa()}
						style:background={ramo.color?.darken(0.2).fade(0.8).hexa()}
						onmouseenter={() => (Calendario.ramoPreview = ramo)}
						onmouseleave={() => (Calendario.ramoPreview = undefined)}
					>
						<div class="w-full pr-10">
							<div class="mb-1 line-clamp-2 text-sm leading-tight font-normal" title={ramo.nombre}>
								{ramo.nombre}
							</div>

							<div class="text-foreground/50 pointer -mt-1 flex flex-row gap-2 font-mono text-sm">
								<span style:color={ramo.color?.lighten(ramo.color?.isDark() ? 0.4 : 0).hexa()}>
									{ramo.sigla}
								</span>
								{ramo.paralelo}
							</div>
						</div>

						<div
							class="pointer-events-auto absolute top-1 right-2 z-10 flex h-10 flex-row items-center justify-center gap-1 opacity-100"
						>
							<Menu position="bottom" align="end" offset={4}>
								{#snippet trigger()}
									<Button variant="outlined" size="icon" aria-label="Options">
										<MaterialSymbolsMoreVert />
									</Button>
								{/snippet}

								{#snippet children()}
									<MenuItem
										onclick={() =>
											SidebarState.open(RamoWindow, {
												edit: {
													sigla: ramo.sigla,
													paralelo: ramo.paralelo
												}
											})}
									>
										<Edit class="mr-2 size-4 scale-120" />
										<span>Editar / Reemplazar</span>
									</MenuItem>

									<MenuItem
										class="text-destructive-foreground hover:bg-destructive"
										onclick={() => Calendario.removeRamo(ramo.sigla)}
									>
										<Add class="mr-2 size-4 scale-120 rotate-45" />
										<span>Eliminar</span>
									</MenuItem>
								{/snippet}
							</Menu>
						</div>

						<div
							class="pointer-events-none absolute right-0 bottom-0 flex flex-row items-end justify-end gap-1 p-2 px-3 text-right opacity-100"
						>
							{#if ramo.creditos}
								<div class="text-xs font-medium opacity-50">
									<p>{ramo.creditos} SCT</p>
								</div>
							{/if}
						</div>
					</div>
				{/snippet}

				<Tooltip
					position="right"
					interactive
					content={professorTooltip}
					class="bg-card/50! max-w-2xs! overflow-hidden 2xl:max-w-xs!"
					forceVisible={Boolean(ramo.profesor.length) && isHighlighted && !isLocalHover}
				>
					{@render ramoCard()}
				</Tooltip>
			{/each}
		</div>
	{/if}
</div>
