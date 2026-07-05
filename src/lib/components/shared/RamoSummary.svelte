<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { Data } from '$lib/data/data.svelte';
	import Circles from '$lib/icons/circles.svelte';
	import Clip from '$lib/icons/clip.svelte';
	import Ticket from '$lib/icons/ticket.svelte';
	import { Config } from '$lib/core/config/store.svelte';
	import { generateColorForRamo } from '$lib/core/ramos/colors';
	import SemesterAvailability from './SemesterAvailability.svelte';

	/**
	 * @param sigla - Unique academic code identifying the course target (e.g., "INF-123").
	 */
	let { sigla }: { sigla: string } = $props();

	// Resolves target course definitions from local execution cache.
	const ramo = $derived(Object.values(Data.cachedRamos[sigla]).at(0));

	// Resolves regional branch scheduling and curriculum programs based on current runtime configuration state.
	const [carrera, programa] = $derived.by(() => {
		if (!ramo) return [null, null];
		return [
			Data.getInfoRamoCarrera(ramo.sigla, Config.sede, Config.jornada),
			Data.getProgramaRamo(Config.sede, ramo.sigla)
		];
	});
</script>

{#if ramo}
	{@const color = generateColorForRamo(ramo.sigla, ramo.nombre)}
	<Card
		style="background: linear-gradient({color?.lighten(0.25).hex()}55, {color
			?.rotate(20)
			.saturate(0.6)
			.darken(0.4)
			.hex()}55);"
		class="text-foreground flex flex-col justify-between gap-4 p-4 shadow-sm! drop-shadow-md/50 **:text-shadow-sm!"
	>
		<div class="flex flex-col">
			<div class="flex flex-row flex-wrap items-center justify-between gap-2">
				<span class="font-mono text-sm tracking-wider" style:color={color?.lighten(0.5).hex()}
					>{ramo.sigla}</span
				>
				<div class="flex flex-row flex-wrap gap-1">
					{#if programa}
						<SemesterAvailability size="lg" curricularType={programa.tipo} />
					{/if}
				</div>
			</div>

			<div class="space-y-1">
				<h3 class="text-base leading-tight font-bold tracking-tight">{ramo.nombre}</h3>

				<div class="space-y-1 text-xs opacity-80">
					<p class="truncate" title={ramo.departamento}>
						DEPTO DE <span class="font-semibold">{ramo.departamento}</span>
					</p>
				</div>
			</div>
		</div>

		<div
			class="bg-muted/30 border-border/40 -mx-4 flex w-auto border-y py-2.5 text-sm font-medium *:flex-1"
		>
			<Tooltip content="Cantidad de alumnos máximos por paralelo">
				<div
					class="text-foreground hover:text-foreground border-border/40 flex w-full items-center justify-center gap-2 border-r transition-colors"
				>
					<Ticket class="text-muted-foreground size-4 stroke-[1.75]" />
					<span>{ramo.cupo} <span class="text-muted-foreground font-normal">cupos</span></span>
				</div>
			</Tooltip>
			{#if ramo.creditos}
				<div
					class="text-foreground hover:text-foreground flex w-full items-center justify-center gap-2 transition-colors"
				>
					<Circles class="text-muted-foreground size-4 stroke-[1.75]" />
					<span>{ramo.creditos} <span class="text-muted-foreground font-normal">SCT</span></span>
				</div>
			{/if}
		</div>

		{#if programa}
			<div class="flex justify-end">
				<Button
					size="sm"
					variant="secondary"
					class="h-8 w-full gap-1.5 text-xs sm:w-auto"
					onclick={() => {
						window.open(programa.programa, '_blank');
					}}
				>
					<Clip class="inline h-3.5 w-3.5" /> Ver programa
				</Button>
			</div>
		{/if}
	</Card>
{/if}
