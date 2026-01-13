<script lang="ts">
	import { tv } from 'tailwind-variants';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MdiEmoticonAngry from '$lib/icons/MdiEmoticonAngry.svelte';
	import RiEmotionUnhappyFill from '$lib/icons/RiEmotionUnhappyFill.svelte';
	import RiEmotionNormalFill from '$lib/icons/RiEmotionNormalFill.svelte';
	import RiEmotionHappyFill from '$lib/icons/RiEmotionHappyFill.svelte';
	import RiEmotionLaughFill from '$lib/icons/RiEmotionLaughFill.svelte';
	import MingcuteAngelFill from '$lib/icons/MingcuteAngelFill.svelte';
	import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
	import MaterialSymbolsElectricBoltRounded from '$lib/icons/MaterialSymbolsElectricBoltRounded.svelte';
	import StreamlineJusticeHammerRemix from '$lib/icons/StreamlineJusticeHammerRemix.svelte';
	import TablerHeartOff from '$lib/icons/TablerHeartOff.svelte';
	import TablerHeartHandshake from '$lib/icons/TablerHeartHandshake.svelte';
	import TablerHeartFilled from '$lib/icons/TablerHeartFilled.svelte';
	import TablerFeatherFilled from '$lib/icons/TablerFeatherFilled.svelte';
	import TablerPuzzleOff from '$lib/icons/TablerPuzzleOff.svelte';
	import MdiPuzzle from '$lib/icons/MdiPuzzle.svelte';
	import MdiPuzzlePlus from '$lib/icons/MdiPuzzlePlus.svelte';
	import TablerClock from '$lib/icons/TablerClock.svelte';
	import TablerClockBolt from '$lib/icons/TablerClockBolt.svelte';
	import TablerClockQuestion from '$lib/icons/TablerClockQuestion.svelte';
	import TablerMessageBolt from '$lib/icons/TablerMessageBolt.svelte';
	import TablerMessagePlus from '$lib/icons/TablerMessagePlus.svelte';
	import TablerMessageMinus from '$lib/icons/TablerMessageMinus.svelte';
	import TablerMessageQuestion from '$lib/icons/TablerMessageQuestion.svelte';
	import TablerMessage from '$lib/icons/TablerMessage.svelte';
	import MdiWeightKilogram from '$lib/icons/MdiWeightKilogram.svelte';
	import StreamlineUltimateEmojiAngryFaceHornsDemonBold from '$lib/icons/StreamlineUltimateEmojiAngryFaceHornsDemonBold.svelte';

	const { dimension, subdimension }: { dimension: any; subdimension: any } = $props();

	const base = tv({
		base: 'isolate overflow-hidden flex justify-center items-center p-1 relative bg-card shadow-md size-8 hover:shadow-sm/50 cursor-help group hover:brightness-120 hover:saturate-60 hover:[&_svg]:scale-105',
		variants: {
			dimension: {
				didactica: 'rounded-sm',
				exigencia: 'rounded-sm',
				temperamento: 'rounded-sm'
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
			solid: 'bg-red-600',
			text: 'text-red-500'
		},
		{
			solid: 'bg-orange-600',
			text: 'text-orange-500'
		},
		{
			solid: 'bg-slate-600',
			text: 'text-slate-200'
		},
		{
			solid: 'bg-teal-600',
			text: 'text-teal-500'
		},
		{
			solid: 'bg-lime-600',
			text: 'text-lime-500'
		}
	] as const;

	const isInverseMetric = $derived(
		['rigor_calificatorio', 'dificultad_percibida'].includes(subdimension.def.id)
	);

	const ICON_MAP: Record<string, { 1: any; 2: any; 3: any; 4: any; 5: any }> = {
		claridad_expositiva: {
			1: TablerMessageQuestion,
			2: TablerMessageMinus,
			3: TablerMessage,
			4: TablerMessagePlus,
			5: TablerMessageBolt
		},
		gestion_tiempo: {
			1: TablerClockQuestion,
			2: TablerClockQuestion,
			3: TablerClock,
			4: TablerClock,
			5: TablerClockBolt
		},

		rigor_calificatorio: {
			1: MingcuteAngelFill,
			2: MingcuteAngelFill,
			3: StreamlineJusticeHammerRemix,
			4: StreamlineJusticeHammerRemix,
			5: StreamlineUltimateEmojiAngryFaceHornsDemonBold
		},
		coherencia_evaluativa: {
			1: TablerPuzzleOff,
			2: TablerPuzzleOff,
			3: MdiPuzzle,
			4: MdiPuzzle,
			5: MdiPuzzlePlus
		},
		dificultad_percibida: {
			1: TablerFeatherFilled,
			2: TablerFeatherFilled,
			3: MaterialSymbolsElectricBoltRounded,
			4: MdiWeightKilogram,
			5: MdiWeightKilogram
		},

		estabilidad_emocional: {
			1: MdiEmoticonAngry,
			2: RiEmotionUnhappyFill,
			3: RiEmotionNormalFill,
			4: RiEmotionHappyFill,
			5: RiEmotionLaughFill
		},
		accesibilidad: {
			1: TablerHeartOff,
			2: TablerHeartOff,
			3: TablerHeartHandshake,
			4: TablerHeartHandshake,
			5: TablerHeartFilled
		}
	};

	const roundedValue = $derived<1 | 2 | 3 | 4 | 5>(
		Math.max(1, Math.min(5, Math.round(subdimension.val))) as any
	);
	const currentIcon = $derived(ICON_MAP[subdimension.def.id][roundedValue]);
	const isExtreme = $derived([1, 5].includes(roundedValue));

	// function getBarColor(score: number) {
	// 	let idx = score - 1;
	// 	if (isInverseMetric) idx = 4 - idx;
	// 	return PALETTE[idx].solid.split(' ')[0];
	// }

	const color = $derived.by(() => {
		let scoreIndex = roundedValue - 1;
		if (isInverseMetric) scoreIndex = 4 - scoreIndex;
		return PALETTE[scoreIndex];
	});
</script>

<div
	class={base({ dimension: dimension.id, extreme: isExtreme })}
	style:--badge-bg="var(--color-{color.solid.replace('bg-', '')})"
	class:is-extreme={isExtreme}
	class:custom-card={true}
>
	{#if currentIcon}
		{@const Icon = currentIcon}
		<Icon class="relative z-10 size-full drop-shadow-xs/100 transition-all will-change-transform" />
	{/if}

	{#if isExtreme}
		<div
			class="animate-shimmer pointer-events-none absolute inset-0 z-6 size-full mix-blend-plus-lighter"
		></div>
	{/if}

	{#snippet tooltipContent()}
		<div class="items-center justify-center space-y-1 text-left leading-tight">
			<p>
				<span class="mr-1 font-medium opacity-50">{dimension.label}, {subdimension.def.label}:</span
				>
				<b class={color.text}>{subdimension.label}</b>
				<span class="opacity-50"
					>(Puntaje {isInverseMetric ? 6 - roundedValue : roundedValue}/5)</span
				>.
				{subdimension.def.levels[roundedValue].description}
			</p>
			<p class="mt-2 text-xs opacity-50">
				<b>{subdimension.def.label}:</b>
				{subdimension.def.description}
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
	/* Usamos el contenedor principal para las capas de fondo */
	.custom-card {
		--badge-bg: '';
		background-color: transparent; /* Evita conflicto con el fondo de Tailwind */
		position: relative;
	}

	/* CAPA 1: Color Sólido y Máscara (Reemplaza al primer div absoluto) */
	.custom-card::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background-color: var(--badge-bg); /* Hereda de clases text- o se puede usar var */
		box-shadow: inset 0 1.5px 1px rgba(255, 250, 250, 0.6);
		mask-image: linear-gradient(to bottom, black 10%, transparent 150%);
		-webkit-mask-image: linear-gradient(to bottom, black 10%, transparent 150%);
		z-index: 0;
	}

	/* CAPA 2: Textura de Metal y Mezcla (Reemplaza al segundo div absoluto) */
	.custom-card::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 5;
		background-image: url('/media/metal.png');
		background-size: cover;
		background-position: center;
		mix-blend-mode: color-dodge;
		opacity: 0.5;
		pointer-events: none;
	}

	.custom-card.is-extreme::after {
		opacity: 0.8;
	}

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

	.animate-shimmer {
		animation: shimmer 2s infinite cubic-bezier(0.15, 0.65, 0.25, 1);
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0.1),
			rgba(255, 255, 255, 0.9) 25%,
			transparent 35%,
			transparent 45%,
			rgba(255, 255, 255, 0.6) 60%,
			transparent 75%
		);
	}
</style>
