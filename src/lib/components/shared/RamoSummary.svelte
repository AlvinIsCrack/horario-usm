<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { Data } from '$lib/data/data.svelte';
	import Circles from '$lib/icons/circles.svelte';
	import Clip from '$lib/icons/clip.svelte';
	import Ticket from '$lib/icons/ticket.svelte';
	import { Config } from '$lib/core/config/store.svelte';
	import { generateColorForRamo } from '$lib/core/ramos/colors';

	let { sigla }: { sigla: string } = $props();
	const ramo = $derived(Object.values(Data.cachedRamos[sigla]).at(0));
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
		class="text-foreground gap-2 shadow-sm! drop-shadow-md/50 **:text-shadow-sm!"
	>
		<div class="mb-2 flex flex-row flex-wrap gap-1">
			<Tooltip content="Cantidad de alumnos máximos por paralelo">
				<Badge icon={Ticket}>{ramo.cupo} CUPOS</Badge>
			</Tooltip>
			{#if ramo.creditos}
				<Tooltip content="Créditos SCT del ramo">
					<Badge icon={Circles}>{ramo.creditos} SCT</Badge>
				</Tooltip>
			{/if}
		</div>

		<p class="-mb-3 w-full font-bold">{ramo.sigla}</p>
		<p class="text-sm">{ramo.nombre}</p>

		{#if programa}
			<p class="-mb-3 w-full">
				RAMO <Tooltip
					content={{
						AMBOS: 'Este ramo se dicta tanto en semestres pares como impares.',
						PAR: 'Este ramo se dicta solo en semestres pares.',
						IMPAR: 'Este ramo se dicta solo en semestres impares.',
						ELECTIVO: 'Este ramo corresponde a un electivo de la malla curricular.'
					}[programa.tipo as string]}
				>
					<span class="text-primary opacity-100 mix-blend-overlay text-shadow-xs/50!">
						{programa.tipo.replace('AMBOS', 'PAR E IMPAR')}
					</span>
				</Tooltip> DEL
			</p>
		{/if}
		<p class="leading-4 opacity-50">DEPTO. DE {ramo.departamento}</p>

		<!-- {#if carrera}
			<div class="flex flex-col py-2">
				{#each Object.entries(carrera.horas) as [hora, valor] (hora)}
					<p>Horas {hora}: {valor} HRS</p>
				{/each}
			</div>
		{/if} -->
		{#if programa}
			<Button
				size="sm"
				variant="secondary"
				onclick={() => {
					window.open(programa.programa, '_blank');
				}}><Clip class="inline" /> Ver programa</Button
			>
		{/if}
	</Card>
{/if}
