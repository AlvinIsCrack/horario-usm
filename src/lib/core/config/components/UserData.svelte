<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { fade } from 'svelte/transition';
	import Tooltip from '../../../components/ui/Tooltip.svelte';
	import { Config } from '../store.svelte';

	let { class: _class, ...props }: HTMLAttributes<HTMLDivElement> = $props();

	let value = $state(Config.tiempoTraslado < 0 ? 60 : Config.tiempoTraslado);

	$effect(() => {
		Config.tiempoTraslado = value;
	});

	const ticks = [
		{ value: 0, label: 'Vivo aquí' },
		{ value: 30, label: 'Cerca' },
		{ value: 60, label: 'Promedio' },
		{ value: 90, label: 'Lejos' },
		{ value: 120, label: 'Viaje largo' }
	];
</script>

<div transition:fade class="relative h-fit w-full">
	<Card class="{_class} flex flex-col gap-1 overflow-visible p-3!" {...props}>
		<div class="flex flex-row items-end justify-between px-1">
			{#snippet tooltipContent()}
				<p class="text-left">
					¿Cuánto tiempo te demoras en llegar a la universidad? <br /><span
						class="text-xs opacity-50"
						>Es para motivos de cálculo y análisis propio del módulo de estadísticas.</span
					>
				</p>
			{/snippet}

			<Tooltip content={tooltipContent}>
				<p class="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
					Tiempo de Viaje
				</p>
			</Tooltip>
			<span class="bg-popover rounded border p-0.5 px-2 font-mono text-sm">
				{value} min
			</span>
		</div>

		<div class="px-1">
			<Slider
				class="w-full"
				min={0}
				max={120}
				step={10}
				{ticks}
				bind:value
				formatValue={(v) => `${v}m`}
			/>
		</div>
	</Card>
</div>
