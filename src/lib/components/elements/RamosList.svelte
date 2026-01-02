<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { Data } from '$lib/data/data.svelte';
	import Add from '$lib/icons/add.svelte';
	import Circles from '$lib/icons/circles.svelte';
	import Edit from '$lib/icons/edit.svelte';
	import Teachers from '$lib/icons/teachers.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import type { RamoCarrera } from '$lib/types/horario';
	import Color from 'color';
	import Badge from '../ui/Badge.svelte';
	import { SideBar } from '../sidebar/SideBar.svelte';
	import RamoWindow from '../sidebar/windows/RamoWindow.svelte';

	const ramosCarrera: (RamoCarrera | undefined)[] = $derived(
		Calendario.ramos.map((r) =>
			Data.getInfoRamoCarrera(r.sigla, Calendario.sede, Calendario.jornada)
		)
	);
</script>

<div class="mt-2 flex h-full flex-col gap-1 overflow-x-visible overflow-y-auto">
	{#if !Calendario.ramos.length}
		<p class="opacity-50">No hay ninguno aún.</p>
	{:else}
		<div class="flex w-full flex-row items-center justify-between gap-2 text-sm">
			{Calendario.ramos.length}
			{Calendario.ramos.length === 1 ? 'Ramo' : 'Ramos'}
			<Badge icon={Circles}>
				{Calendario.ramos
					.map(
						(r) => Data.getInfoRamoCarrera(r.sigla, Calendario.sede, Calendario.jornada)?.creditos
					)
					.reduce((prev, curr) => (prev ?? 0) + (curr ?? 0), 0) ?? 0} SCT
			</Badge>
		</div>
		<div class="flex h-full w-full flex-col overflow-y-auto p-1">
			{#each Calendario.ramos as ramo, i (i)}
				{@const highlighted =
					Calendario.ramoPreview?.sigla === ramo.sigla &&
					Calendario.ramoPreview?.paralelo === ramo.paralelo}
				{@const { creditos } = ramosCarrera[i] ?? {}}
				{@const creditosColor = Color(
					creditos
						? creditos < 2
							? '#a5eb2d'
							: creditos < 4
								? '#ffe957'
								: creditos < 6
									? '#fc8505'
									: creditos < 8
										? '#e30943'
										: '#000000'
						: '#555555'
				)}

				{#snippet ramoTooltip()}
					<div class="text-left">
						<h4><Teachers class="mr-1 inline scale-150" /> PROFESORES</h4>
						<ul class="text-left">
							{#each ramo.profesor as profesor, i (i)}
								<li>— {profesor}</li>
							{/each}
						</ul>
						<h4>CRÉDITOS</h4>
						<p>{creditos ?? 0} SCT</p>
					</div>
				{/snippet}

				<Tooltip position="right" content={ramoTooltip} forceVisible={highlighted}>
					<div
						role="listitem"
						class="{highlighted
							? 'bg-accent text-accent-foreground ring'
							: 'bg-popover text-popover-foreground'} pointer-events-auto relative h-min w-full overflow-hidden rounded-lg border px-2 py-1 pl-5"
						onmouseenter={() => (Calendario.ramoPreview = ramo)}
						onmouseleave={() => (Calendario.ramoPreview = undefined)}
					>
						<div
							class="absolute left-0 h-full w-2 scale-y-150"
							style:background={creditosColor.hexa()}
						></div>

						<div class="max-w-1/2 truncate font-bold" title={ramo.nombre}>{ramo.nombre}</div>

						<div class="text-foreground/50 pointer -mt-1 flex flex-row gap-4 text-xs">
							<b>{ramo.sigla}</b> PAR. {ramo.paralelo}
						</div>

						<div
							class="pointer-events-none absolute top-0 right-0 flex h-full w-full flex-row-reverse items-center gap-1 p-1 [&>*]:pointer-events-auto"
						>
							<Tooltip content="Eliminar">
								<Button
									variant="destructive"
									size="icon"
									onclick={() => Calendario.removeRamo(ramo.sigla)}
								>
									<Add class="scale-150 rotate-45" />
								</Button>
							</Tooltip>

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
						</div>
					</div>
				</Tooltip>
			{/each}
		</div>
	{/if}
</div>
