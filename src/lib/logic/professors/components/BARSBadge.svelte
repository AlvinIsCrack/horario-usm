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
		base: 'isolate overflow-hidden flex justify-center items-center p-1 relative bg-card shadow-md size-8 hover:shadow-sm/50 cursor-help group hover:brightness-120 hover:saturate-60 hover:[&_svg]:scale-105',
		variants: {
			dimension: {
				didactica: '',
				exigencia: 'rounded-md',
				temperamento: 'rounded-full'
			},
			extreme: {
				false: 'grayscale-20',
				true: ''
			}
		}
	});

	// --- LÓGICA DE COLORES CENTRALIZADA ---
	// Definimos la paleta base (1 a 5) con sus variantes para sólido y gradiente
	const PALETTE = [
		{
			solid: 'bg-red-600'
		},
		{
			solid: 'bg-slate-500'
		},
		{
			solid: 'bg-slate-600'
		},
		{
			solid: 'bg-slate-600'
		},
		{
			solid: 'bg-lime-600'
		}
	] as const;

	const isInverseMetric = $derived(
		['rigor_calificatorio', 'dificultad_percibida'].includes(subdimension.def.id)
	);

	function getBackgroundClass(val: number): string {
		// 2. Manejo Estándar (Promedio)
		let scoreIndex = Math.max(1, Math.min(5, Math.round(val))) - 1;
		if (isInverseMetric) {
			scoreIndex = 4 - scoreIndex;
		}

		return PALETTE[scoreIndex].solid;
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
	const roundedValue = $derived(Math.round(subdimension.val));
	const isExtreme = $derived(Math.abs(subdimension.val - 3) >= 1.5);
	const isIntermediateValue = $derived([2, 4].includes(roundedValue));

	function getBarColor(score: number) {
		let idx = score - 1;
		if (isInverseMetric) idx = 4 - idx;
		return PALETTE[idx].solid.split(' ')[0];
	}
</script>

<div class={base({ dimension: dimension.id, extreme: isExtreme })}>
	<div
		style:box-shadow="inset 0 1.5px 1px #fffa;"
		class="absolute top-0 left-0 size-full rounded-[inherit] mask-b-from-10% mask-b-to-150% {getBackgroundClass(
			subdimension.val
		)}"
	></div>

	<div
		class="absolute top-0 left-0 z-5 size-full bg-cover! bg-center! opacity-40 mix-blend-color-dodge [background:url(/media/metal.png)]"
	></div>

	{#if isExtreme}
		<div
			class="absolute top-0 left-0 z-5 size-full animate-pulse bg-white/50 mask-radial-[100%_100%] mask-radial-from-transparent mask-radial-from-10% mask-radial-to-black mask-radial-to-80% mask-radial-at-center mix-blend-plus-lighter"
		></div>
	{/if}

	{#if currentIcon}
		{@const Icon = currentIcon}
		<Icon class="relative z-10 size-full drop-shadow-sm/50 transition-all will-change-transform" />
	{/if}

	<svg class="pointer-events-none absolute h-0 w-0" aria-hidden="true">
		<filter id="grainy-{subdimension.def.id}">
			<feTurbulence type="fractalNoise" baseFrequency="0.97" numOctaves="1" stitchTiles="stitch" />
			<feComponentTransfer>
				<feFuncA type="linear" slope="1.8" />
			</feComponentTransfer>
		</filter>
	</svg>

	<div
		class="grainy-overlay pointer-events-none absolute inset-0 z-6 mask-t-from-0% mask-t-to-50% opacity-80 mix-blend-multiply"
		style="filter: url('#grainy-{subdimension.def.id}');"
	></div>

	{#if isIntermediateValue}
		<div
			class="absolute z-5 size-full {(roundedValue === 2 && !isInverseMetric) ||
			(roundedValue === 4 && isInverseMetric)
				? 'bg-amber-500'
				: 'bg-green-400'} mix-blend-overlay"
		></div>
	{/if}

	{#if isExtreme}
		<div
			class="animate-shimmer pointer-events-none absolute inset-0 z-6 size-full mix-blend-plus-lighter"
		></div>
	{/if}

	{#snippet tooltipContent()}
		{#snippet histogram()}
			{@const dist = subdimension.stats.distribution}
			{@const maxVal = Math.max(...Object.values(dist).map(Number)) || 1}

			<div class="my-4 mt-5 flex h-20 w-full items-end justify-between gap-1.5 px-4 select-none">
				{#each [1, 2, 3, 4, 5] as score}
					{@const count = dist[score] ?? 0}
					{@const percent = count > 0 ? Math.max(15, (count / maxVal) * 100) : 4}
					{@const isCurrent = roundedValue === score}

					<div
						class="group/bar relative flex h-full w-full flex-col items-center justify-end gap-1"
					>
						{#if count > 0}
							<span
								class="absolute -top-5 text-[10px] font-bold {isCurrent
									? 'opacity-100'
									: 'opacity-40'}"
							>
								{count}
							</span>
						{/if}

						<div class="flex h-full w-full items-end justify-center mask-b-from-80%">
							<div
								class="h-[var(--h)] w-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(.08,.96,.49,1)] starting:h-0 {getBarColor(
									score
								)} {count > 0 ? 'opacity-100' : 'bg-white opacity-20'}"
								style:--h="{percent}%"
							></div>
						</div>

						<span
							class="font-mono text-[10px] leading-none tracking-tighter {isCurrent
								? 'scale-105 font-medium text-white'
								: 'text-muted-foreground/80 scale-90'}"
						>
							{subdimension.def.levels[score].label}
						</span>
					</div>
				{/each}
			</div>
		{/snippet}

		<div class="space-y-8 text-left leading-tight">
			<p>
				<span class="mr-1 font-medium opacity-50">{dimension.label}, {subdimension.def.label}:</span
				>
				{subdimension.label}.
				{subdimension.def.levels[roundedValue].description}
			</p>

			{@render histogram()}

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
			opacity: 0.3;
		}
		50% {
			opacity: 1;
		}
		80% {
			opacity: 0.4;
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
		animation: shimmer 2s infinite cubic-bezier(0.15, 0.66, 0.28, 0.95);
		background: linear-gradient(
			to right,
			transparent,
			rgba(255, 255, 255, 0.25) 20%,
			rgba(255, 255, 255, 1) 50%,
			rgba(255, 255, 255, 0.1) 60%,
			transparent
		);
	}
</style>
