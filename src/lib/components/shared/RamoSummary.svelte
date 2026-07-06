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
	import { cn } from '$lib/utils';
	import MdiAttachment from '$lib/icons/MdiAttachment.svelte';
	import MdiAttachmentOff from '$lib/icons/MdiAttachmentOff.svelte';

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
		class="text-foreground flex flex-col justify-between gap-4 overflow-hidden p-4 shadow-sm! drop-shadow-md/50 **:text-shadow-sm!"
	>
		<div class="flex flex-col">
			<div class="flex flex-row flex-wrap items-center justify-between gap-2">
				<span class="font-mono text-sm tracking-wider" style:color={color?.lighten(0.5).hex()}
					>{ramo.sigla}</span
				>
				<div class="flex translate-x-2 -translate-y-2 flex-row flex-wrap gap-1">
					{#if programa}
						<SemesterAvailability size="lg" curricularType={programa.tipo} />
					{/if}
				</div>
			</div>

			<h3 class="line-clamp-2 text-base leading-tight font-bold tracking-tight">{ramo.nombre}</h3>
		</div>

		<div
			class="bg-muted/30 relative z-10 -mx-4 flex w-auto border-y py-2 text-sm font-medium *:flex-1"
		>
			<Tooltip content="Cantidad de alumnos máximos por paralelo">
				<div
					class="text-foreground hover:text-foreground flex w-full cursor-help items-center justify-center gap-1 transition-colors"
				>
					<Ticket class="text-muted-foreground size-4 stroke-[1.75]" />
					<span>{ramo.cupo} <span class="text-muted-foreground font-normal">cupos</span></span>
				</div>
			</Tooltip>
			{#if ramo.creditos}
				<Tooltip content="Créditos SCT del ramo">
					<div
						class="text-foreground hover:text-foreground flex w-full cursor-help items-center justify-center gap-1 transition-colors"
					>
						<Circles class="text-muted-foreground size-4 stroke-[1.75]" />
						<span>{ramo.creditos} <span class="text-muted-foreground font-normal">SCT</span></span>
					</div>
				</Tooltip>
			{/if}
		</div>

		{#if carrera?.horas}
			{#snippet horaCell(value: number, suffix: string)}
				<div class="relative text-center {value === 0 ? 'opacity-50' : ''}">
					<Tooltip
						content="El ramo contempla {value}hrs/sem. {suffix}"
						wrapperClass="cursor-help h-full"
					>
						<span class="w-fit tabular-nums">
							<b class={cn(value ? 'text-foreground' : '')}>{value}</b>
							{suffix.replace('de ', '').slice(0, 3)}.
						</span>
					</Tooltip>
					{#if value}
						<div
							class="absolute right-0 -bottom-2 left-0 h-1 w-auto rounded-full"
							style:background-color={color?.hex()}
						></div>
					{/if}
				</div>
			{/snippet}
			<div
				class="bg-muted text-muted-foreground relative z-10 -mx-4 -mt-4 flex w-auto items-center justify-evenly gap-0.5 overflow-hidden border-b py-2 text-sm"
			>
				{@render horaCell(carrera.horas.teoricas, 'teóricas')}
				{@render horaCell(carrera.horas.ayudantias, 'de ayudantías')}
				{@render horaCell(carrera.horas.laboratorios, 'de laboratorios')}
				{@render horaCell(carrera.horas.practicas, 'prácticas')}
			</div>
		{/if}

		<div
			class="bg-card text-card-foreground -mx-4 -my-4 flex w-auto items-center justify-between gap-2 px-4 py-2.5"
		>
			<div class="max-w-1/2 text-xs">
				<p class="truncate" title={carrera?.departamento || ramo.departamento}>
					{carrera?.departamento || ramo.departamento}
				</p>
			</div>

			{#if programa}
				<Button
					size="sm"
					variant="secondary"
					class="h-8 w-full shrink-0 gap-1.5 text-xs sm:w-auto"
					onclick={() => {
						window.open(programa.programa, '_blank');
					}}
				>
					<MdiAttachment class="inline size-4" /> Ver programa
				</Button>
			{:else}
				<Tooltip content="Programa del ramo no encontrado">
					<MdiAttachmentOff class="text-muted-foreground inline size-4" />
				</Tooltip>
			{/if}
		</div>
	</Card>
{/if}
