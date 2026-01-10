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
			// 1: Muy Malo
			solid: 'bg-red-600 ring-inset! ring-2! ring-orange-500/80',
			grad: 'from-red-600 to-red-600'
		},
		{
			// 2: Difícil/Malo
			solid: 'bg-amber-500',
			grad: 'from-amber-500 to-amber-500'
		},
		{
			// 3: Neutro
			solid: 'bg-sky-500/80',
			grad: 'from-sky-500/80 to-sky-500/80'
		},
		{
			// 4: Bueno
			solid: 'bg-violet-600',
			grad: 'from-violet-600 to-violet-600'
		},
		{
			// 5: Excelente
			solid: 'bg-green-500 ring-inset! ring-2! ring-lime-400/80!',
			grad: 'from-green-500 to-green-500'
		}
	] as const;

	const isPolarized = $derived(subdimension?.stats.is_bimodal);
	const isInverseMetric = $derived(
		['rigor_calificatorio', 'dificultad_percibida'].includes(subdimension.def.id)
	);

	/**
	 * Encuentra los 2 puntajes más votados en la distribución.
	 */
	function getModes(distribution: Record<string, number>): [number, number] {
		if (!distribution) return [1, 5]; // Fallback por seguridad

		// Ordenamos las llaves (scores) por cantidad de votos descendente
		const sortedScores = Object.keys(distribution)
			.map(Number)
			.sort((a, b) => (distribution[b] ?? 0) - (distribution[a] ?? 0));

		// Tomamos los top 2 y los ordenamos numéricamente (ej: [1, 5] o [2, 4])
		// para que el gradiente siempre vaya de menor a mayor score visualmente
		const modeA = sortedScores[0];
		const modeB = sortedScores[1] ?? (modeA === 5 ? 1 : 5); // Fallback si solo hay 1 voto

		return [modeA, modeB].sort((a, b) => a - b) as [number, number];
	}

	function getBackgroundClass(val: number, polarized: boolean): string {
		// 1. Manejo de Polarización (Bi-modal)
		if (polarized) {
			const [scoreLeft, scoreRight] = getModes(subdimension.stats.distribution);

			// Ajustamos índices (Score 1..5 -> Índice 0..4)
			// Si es métrica inversa, invertimos el índice (1->4, 2->3, etc)
			let idxLeft = scoreLeft - 1;
			let idxRight = scoreRight - 1;

			if (isInverseMetric) {
				idxLeft = 4 - idxLeft;
				idxRight = 4 - idxRight;
			}

			// Extraemos solo la parte 'from-COLOR' del objeto izquierdo y 'to-COLOR' del derecho
			// Nota: PALETTE[i].grad tiene formato "from-X to-X". Hacemos split para mezclar.
			const colorFrom = PALETTE[idxLeft].grad.split(' ')[0]; // toma el 'from-...'
			const colorTo = PALETTE[idxRight].grad.split(' ')[1]; // toma el 'to-...'

			return `bg-gradient-to-br ${colorFrom} from-40% ${colorTo} to-60%`;
		}

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

	const isExtreme = $derived(Math.abs(subdimension.val - 3) >= 1.5);
</script>

<div class={base({ dimension: dimension.id, extreme: isExtreme })}>
	<div
		style:box-shadow="inset 0 1.5px 1px #fffa;"
		class="absolute top-0 left-0 h-full w-full rounded-[inherit] mask-b-from-10% mask-b-to-150% {getBackgroundClass(
			subdimension.val,
			isPolarized
		)}"
	></div>

	<svg class="pointer-events-none absolute h-0 w-0" aria-hidden="true">
		<filter id="grainy-{subdimension.def.id}">
			<feTurbulence type="fractalNoise" baseFrequency="0.97" numOctaves="1" stitchTiles="stitch" />
			<feComponentTransfer>
				<feFuncA type="linear" slope="1.8" />
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
		class="grainy-overlay pointer-events-none absolute inset-0 z-6 mask-t-from-0% mask-t-to-60% opacity-60 mix-blend-color-dodge"
		style="filter: url('#grainy-{subdimension.def.id}');"
	></div>

	{#snippet tooltipContent()}
		<div class="space-y-4 text-left leading-tight">
			<p>
				<span class="mr-1 font-medium opacity-50">{dimension.label}, {subdimension.def.label}:</span
				>
				{subdimension.label}.
				{subdimension.def.levels[Math.round(subdimension.val)].description}

				{#if isPolarized}
					{@const modes = getModes(subdimension.stats.distribution)}
					<br />
					<span class="text-xs font-bold tracking-wide text-amber-400">
						<span class="uppercase">⚠️ Opiniones divididas:</span>
						<span class="font-normal text-white/80"
							>Entre "{subdimension.def.levels[Math.round(modes[0])].label}" y "{subdimension.def
								.levels[Math.round(modes[1])].label}"</span
						>
					</span>
				{/if}
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
