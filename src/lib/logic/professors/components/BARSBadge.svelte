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
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
	import MaterialSymbolsFavorite from '$lib/icons/MaterialSymbolsFavorite.svelte';
	import MaterialSymbolsRateReview from '$lib/icons/MaterialSymbolsRateReview.svelte';
	import MdiEmoticonAngry from '$lib/icons/MdiEmoticonAngry.svelte';
	import RiEmotionUnhappyFill from '$lib/icons/RiEmotionUnhappyFill.svelte';
	import RiEmotionNormalFill from '$lib/icons/RiEmotionNormalFill.svelte';
	import RiEmotionHappyFill from '$lib/icons/RiEmotionHappyFill.svelte';
	import RiEmotionLaughFill from '$lib/icons/RiEmotionLaughFill.svelte';
	import IcBaselineHeartBroken from '$lib/icons/IcBaselineHeartBroken.svelte';
	import MaterialSymbolsNestEcoLeaf from '$lib/icons/MaterialSymbolsNestEcoLeaf.svelte';
	import MdiScaleUnbalanced from '$lib/icons/MdiScaleUnbalanced.svelte';
	import MingcuteAngelFill from '$lib/icons/MingcuteAngelFill.svelte';
	import MaterialSymbolsAlarmOff from '$lib/icons/MaterialSymbolsAlarmOff.svelte';
	import MaterialSymbolsAlarmOutline from '$lib/icons/MaterialSymbolsAlarmOutline.svelte';
	import MaterialSymbolsAlarmOn from '$lib/icons/MaterialSymbolsAlarmOn.svelte';
	import MdiMessageQuestion from '$lib/icons/MdiMessageQuestion.svelte';
	import MdiAndroidMessages from '$lib/icons/MdiAndroidMessages.svelte';
	import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
	import MaterialSymbolsEditSharp from '$lib/icons/MaterialSymbolsEditSharp.svelte';
	import IcBaselineEdit from '$lib/icons/IcBaselineEdit.svelte';
	import IcOutlineDriveFileRenameOutline from '$lib/icons/IcOutlineDriveFileRenameOutline.svelte';
	import MdiMessageProcessing from '$lib/icons/MdiMessageProcessing.svelte';
	import MdiMessageFlash from '$lib/icons/MdiMessageFlash.svelte';
	import MaterialSymbolsElectricBoltRounded from '$lib/icons/MaterialSymbolsElectricBoltRounded.svelte';
	import StreamlineJusticeHammerRemix from '$lib/icons/StreamlineJusticeHammerRemix.svelte';
	import TablerLinkOff from '$lib/icons/TablerLinkOff.svelte';
	import TablerLink from '$lib/icons/TablerLink.svelte';
	import TablerLinkPlus from '$lib/icons/TablerLinkPlus.svelte';
	import TablerHeartOff from '$lib/icons/TablerHeartOff.svelte';
	import TablerHeartHandshake from '$lib/icons/TablerHeartHandshake.svelte';
	import TablerHeartFilled from '$lib/icons/TablerHeartFilled.svelte';
	import TablerFeatherFilled from '$lib/icons/TablerFeatherFilled.svelte';

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
			1: MdiMessageQuestion,
			2: MdiMessageQuestion,
			3: MdiMessageProcessing,
			4: MdiMessageProcessing,
			5: MdiMessageFlash
		},
		gestion_tiempo: {
			1: MaterialSymbolsAlarmOff,
			2: MaterialSymbolsAlarmOff,
			3: MaterialSymbolsAlarmOutline,
			4: MaterialSymbolsAlarmOutline,
			5: MaterialSymbolsAlarmOn
		},

		rigor_calificatorio: {
			1: MingcuteAngelFill,
			2: MingcuteAngelFill,
			3: StreamlineJusticeHammerRemix,
			4: StreamlineJusticeHammerRemix,
			5: StreamlineJusticeHammerRemix
		},
		coherencia_evaluativa: {
			1: TablerLinkOff,
			2: TablerLinkOff,
			3: TablerLink,
			4: TablerLink,
			5: TablerLinkPlus
		},
		dificultad_percibida: {
			1: TablerFeatherFilled,
			2: TablerFeatherFilled,
			3: MaterialSymbolsElectricBoltRounded,
			4: MaterialSymbolsElectricBoltRounded,
			5: MaterialSymbolsLocalFireDepartmentRounded
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

	function getBarColor(score: number) {
		let idx = score - 1;
		if (isInverseMetric) idx = 4 - idx;
		return PALETTE[idx].solid.split(' ')[0];
	}

	const color = $derived.by(() => {
		let scoreIndex = roundedValue - 1;
		if (isInverseMetric) scoreIndex = 4 - scoreIndex;
		return PALETTE[scoreIndex];
	});
</script>

<div class={base({ dimension: dimension.id, extreme: isExtreme })}>
	<div
		style:box-shadow="inset 0 1.5px 1px #fffa;"
		class="absolute top-0 left-0 size-full rounded-[inherit] mask-b-from-10% mask-b-to-150% {color.solid}"
	></div>

	<div
		class="absolute top-0 left-0 z-5 size-full bg-cover! bg-center! {isExtreme
			? 'opacity-80'
			: 'opacity-50'} mix-blend-color-dodge [background:url(/media/metal.png)]"
	></div>

	{#if currentIcon}
		{@const Icon = currentIcon}
		<Icon class="relative z-10 size-full drop-shadow-sm/80 transition-all will-change-transform" />
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

			<div class="my-4 mt-5 flex h-20 w-full items-end justify-between gap-1.5 select-none">
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

		<div class="items-center justify-center space-y-1 text-left leading-tight">
			<p>
				<span class="mr-1 font-medium opacity-50">{dimension.label}, {subdimension.def.label}:</span
				>
				<b class={color.text}>{subdimension.label}</b>.
				{subdimension.def.levels[roundedValue].description}
			</p>

			<!-- {@render histogram()} -->

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
		animation: shimmer 2s infinite cubic-bezier(0.15, 0.65, 0.25, 1);
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0.1),
			rgba(255, 255, 255, 0.9) 25%,
			/* Primera barra */ transparent 35%,
			transparent 45%,
			/* Espacio entre barras */ rgba(255, 255, 255, 0.6) 60%,
			/* Segunda barra (más sutil) */ transparent 75%
		);
	}
</style>
