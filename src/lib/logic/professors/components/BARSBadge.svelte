<script lang="ts">
	import { tv } from 'tailwind-variants';
	import MaterialSymbolsBookRibbon from '$lib/icons/MaterialSymbolsBookRibbon.svelte';
	import MaterialSymbolsAvTimerRounded from '$lib/icons/MaterialSymbolsAvTimerRounded.svelte';
	import MaterialSymbolsRecordVoiceOverRounded from '$lib/icons/MaterialSymbolsRecordVoiceOverRounded.svelte';
	import MaterialSymbolsPhoneInTalkWatchfaceIndicatorSharp from '$lib/icons/MaterialSymbolsPhoneInTalkWatchfaceIndicatorSharp.svelte';
	import MaterialSymbolsEmoticon from '$lib/icons/MaterialSymbolsEmoticon.svelte';
	import MaterialSymbolsBalance from '$lib/icons/MaterialSymbolsBalance.svelte';
	import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MaterialSymbolsWeight from '$lib/icons/MaterialSymbolsWeight.svelte';
	import MaterialSymbolsAndroidMessages from '$lib/icons/MaterialSymbolsAndroidMessages.svelte';
	import MaterialSymbolsMood from '$lib/icons/MaterialSymbolsMood.svelte';
	import MaterialSymbolsBook2 from '$lib/icons/MaterialSymbolsBook2.svelte';
	import MaterialSymbolsLinkRounded from '$lib/icons/MaterialSymbolsLinkRounded.svelte';

	const { dimension, subdimension }: { dimension: any; subdimension: any } = $props();

	const base = tv({
		base: 'overflow-hidden flex justify-center items-center p-1 relative bg-card shadow-md size-8 hover:shadow-sm/50 hover:ring',
		variants: {
			dimension: {
				didactica: 'rounded-full',
				exigencia: 'rounded-md',
				temperamento: ''
			}
		}
	});

	function getMetricColor(val: number, metricId: string): string {
		const score = Math.max(1, Math.min(5, Math.round(val)));
		const isInverse = ['rigor_calificatorio', 'dificultad_percibida'].includes(metricId);

		// Escala: Chocolate/Naranja (Duro/Alerta) -> Slate/Sky (Limpio/Fácil)
		const colors = [
			'bg-red-600 ring-rose-400! text-rose-100', // 1: Muy Malo / Crítico
			'bg-amber-600 text-amber-100', // 2: Difícil
			'bg-sky-500/80 text-sky-100', // 3: Balance
			'bg-teal-600 text-teal-100', // 4: Bueno
			'bg-lime-600 ring-lime-400! text-lime-100' // 5: Máxima Claridad / Facilidad
		];

		// Si es inversa, damos vuelta la paleta para que 5 sea Rojo y 1 sea Verde
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

<div class={base({ dimension: dimension.id })}>
	<div
		class="absolute top-0 left-0 h-full w-full rounded-[inherit] mask-b-from-20% mask-b-to-150% inset-shadow-xs inset-shadow-white ring-inset {getMetricColor(
			subdimension.val,
			subdimension.def.id
		)} {isExtreme ? 'ring-2' : 'scale-90'}"
	></div>

	{#if isExtreme}
		<div class="animate-shimmer pointer-events-none absolute inset-0 z-5 h-full w-full"></div>
	{/if}

	{#if currentIcon}
		{@const Icon = currentIcon}
		<Icon class="relative z-10 size-full h-full w-full opacity-80 mix-blend-plus-lighter" />
	{/if}

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
		wrapperClass="absolute! left-0 top-0 z-10 pointer-events-auto w-full h-full"
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
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
		80% {
			opacity: 0.6;
		}
		100% {
			transform: translateX(150%) skewX(-20deg);
			opacity: 0;
		}
	}
	.animate-shimmer {
		animation: shimmer 2.5s infinite;
		background: linear-gradient(
			to right,
			transparent,
			rgba(255, 255, 255, 0.1) 20%,
			rgba(255, 255, 255, 0.6) 50%,
			rgba(255, 255, 255, 0.1) 80%,
			transparent
		);
	}
</style>
