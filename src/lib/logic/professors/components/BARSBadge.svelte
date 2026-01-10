<script lang="ts">
	import { tv } from 'tailwind-variants';
	import MaterialSymbolsAvTimerRounded from '$lib/icons/MaterialSymbolsAvTimerRounded.svelte';
	import MaterialSymbolsBalance from '$lib/icons/MaterialSymbolsBalance.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MaterialSymbolsWeight from '$lib/icons/MaterialSymbolsWeight.svelte';
	import MaterialSymbolsAndroidMessages from '$lib/icons/MaterialSymbolsAndroidMessages.svelte';
	import MaterialSymbolsMood from '$lib/icons/MaterialSymbolsMood.svelte';
	import MaterialSymbolsBook2 from '$lib/icons/MaterialSymbolsBook2.svelte';
	import MaterialSymbolsLinkRounded from '$lib/icons/MaterialSymbolsLinkRounded.svelte';

	const { dimension, subdimension }: { dimension: any; subdimension: any } = $props();

	const base = tv({
		base: 'isolate overflow-hidden flex justify-center items-center p-1 relative bg-card shadow-md size-8 hover:shadow-sm/50 cursor-help group hover:brightness-150 hover:saturate-80 hover:[&_svg]:scale-105',
		variants: {
			dimension: {
				didactica: '',
				exigencia: 'rounded-md',
				temperamento: 'rounded-full'
			},
			extreme: {
				false: '',
				true: ''
			}
		}
	});

	function getMetricColor(val: number, metricId: string): string {
		const score = Math.max(1, Math.min(5, Math.round(val)));
		const isInverse = ['rigor_calificatorio', 'dificultad_percibida'].includes(metricId);

		const colors = [
			'bg-red-600 ring-inset! ring-2! ring-orange-500/80', // 1: Muy Malo (Peligro)
			'bg-amber-500', // 2: Difícil (Alerta, mejor contraste que Amber)
			'bg-sky-500/80', // 3: Balance (Neutro "Friendly")
			'bg-violet-600', // 4: Bueno (El salto visual que necesitabas)
			'bg-green-500 ring-inset! ring-2! ring-lime-400/80!' // 5: Excelente (Brillante y legible)
		];

		const finalColors = isInverse ? [...colors].reverse() : colors;
		return finalColors[score - 1];
	}

	const ICON_MAP: Record<string, any> = {
		claridad_expositiva: MaterialSymbolsAndroidMessages,
		gestion_tiempo: MaterialSymbolsAvTimerRounded,

		rigor_calificatorio: MaterialSymbolsBook2,
		coherencia_evaluativa: MaterialSymbolsBalance,
		dificultad_percibida: MaterialSymbolsWeight,

		estabilidad_emocional: MaterialSymbolsMood,
		accesibilidad: MaterialSymbolsLinkRounded
	};
	const currentIcon = $derived(ICON_MAP[subdimension.def.id]);

	const isExtreme = $derived(Math.abs(subdimension.val - 3) >= 1.5);
</script>

<div class={base({ dimension: dimension.id, extreme: isExtreme })}>
	<div
		style:box-shadow="inset 0 1.5px 1px #fffa;"
		class="absolute top-0 left-0 h-full w-full rounded-[inherit] mask-b-from-25% mask-b-to-180% p-1 {getMetricColor(
			subdimension.val,
			subdimension.def.id
		)}"
	></div>

	<svg class="pointer-events-none absolute h-0 w-0" aria-hidden="true">
		<filter id="grainy-{subdimension.def.id}">
			<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
			<feComponentTransfer>
				<feFuncA type="linear" slope="1.5" />
			</feComponentTransfer>
		</filter>
	</svg>

	{#if isExtreme}
		<!-- <div class="pointer-events-none absolute inset-0 z-6 size-full animate-pulse bg-white/"></div> -->
		<div class="animate-shimmer pointer-events-none absolute inset-0 z-6 size-full"></div>
	{/if}

	{#if currentIcon}
		{@const Icon = currentIcon}
		<Icon class="relative z-10 size-full drop-shadow-sm/50 transition-all will-change-transform" />
	{/if}

	<div
		class="grainy-overlay pointer-events-none absolute inset-0 z-6 mask-t-from-20% opacity-50 mix-blend-color-burn"
		style="filter: url('#grainy-{subdimension.def.id}');"
	></div>

	{#snippet tooltipContent()}
		<div class="space-y-4 text-left leading-tight">
			<p>
				<span class="mr-1 font-medium opacity-50">{dimension.label}, {subdimension.def.label}:</span
				>
				{subdimension.label}.
				{subdimension.def.levels[Math.round(subdimension.val)].description}
			</p>

			<p class="text-xs opacity-50">
				{subdimension.def.label} es {subdimension.def.description.toLowerCase()}
			</p>
		</div>
	{/snippet}

	<Tooltip
		content={tooltipContent}
		wrapperClass="absolute! peer left-0 top-0 z-10 pointer-events-auto w-full h-full"
	>
		<div></div>
	</Tooltip>
</div>

<style>
	@keyframes shimmer {
		0% {
			transform: translateX(-150%) skewX(-20deg);
			opacity: 0;
		}
		20% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
		80% {
			opacity: 0.5;
		}
		100% {
			transform: translateX(150%) skewX(-25deg);
			opacity: 0;
		}
	}

	.grainy-overlay {
		/* Mantiene el tamaño pero el contenido es generado por el filtro */
		width: 100%;
		height: 100%;
	}

	.animate-shimmer {
		animation: shimmer 2.2s infinite ease-out;
		background: linear-gradient(
			to right,
			transparent,
			rgba(255, 255, 255, 0.2) 20%,
			rgba(255, 255, 255, 0.8) 50%,
			rgba(255, 255, 255, 0.1) 80%,
			transparent
		);
	}
</style>
