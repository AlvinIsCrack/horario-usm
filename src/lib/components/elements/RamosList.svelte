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
			<h1 class="text-base font-normal">Ramos registrados</h1>
			<Badge icon={Circles}>
				{Calendario.ramos
					.map(
						(r) => Data.getInfoRamoCarrera(r.sigla, Calendario.sede, Calendario.jornada)?.creditos
					)
					.reduce((prev, curr) => (prev ?? 0) + (curr ?? 0), 0) ?? 0} SCT
			</Badge>
		</div>
		<div class="flex h-full w-full flex-col gap-0.5 overflow-y-auto p-1">
			{#each Calendario.ramos as ramo, i (i)}
				{@const highlighted =
					Calendario.ramoPreview?.sigla === ramo.sigla &&
					Calendario.ramoPreview?.paralelo === ramo.paralelo}
				{@const { creditos } = ramosCarrera[i] ?? {}}

				{#snippet ramoTooltip()}
					<ul class="space-y-1">
						{#each ramo.profesor as profesor (profesor)}
							<li class="flex items-center gap-2 leading-tight font-normal">
								{profesor}
							</li>
						{/each}
					</ul>
				{/snippet}
				<Tooltip
					position="right"
					content={ramoTooltip}
					class="overflow-hidden"
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
							<div class="text-xs font-medium opacity-50">
								<p>
									{creditos} SCT
								</p>
							</div>
						</div>
					</div>
				</Tooltip>
			{/each}
		</div>
	{/if}
</div>
