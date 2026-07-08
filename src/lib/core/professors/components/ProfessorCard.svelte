<script module>
	/**
	 * Map containing descriptive text and UI configuration corresponding to each confidence level.
	 */
	const STATUS_METADATA = {
		ARCHIVED: {
			icon: MaterialSymbolsSearchActivityRounded,
			label: 'Archivado',
			confidence: 'insuficiente',
			description: 'Datos históricos o insuficientes para generar una estadística actual confiable.'
		},
		UNRATED: {
			icon: OcticonUnverified16,
			label: 'Sin datos',
			confidence: 'nula',
			description: 'Datos históricos o insuficientes para generar una estadística actual confiable.'
		},
		PRELIMINARY: {
			icon: OcticonUnverified16,
			label: 'Preliminar',
			confidence: 'preliminar',
			description: 'Nivel de confianza estadística:'
		},
		SOLID: {
			icon: OcticonVerified16,
			label: 'Confiable',
			confidence: 'confiable',
			description: 'Nivel de confianza estadística:'
		},
		HIGHLIGHTED: {
			icon: OcticonVerified16,
			label: 'Sólido',
			confidence: 'sólido',
			description: 'Nivel de confianza estadística:'
		}
	} as const;

	const statusVariants = tv({
		slots: {
			bg: 'bg-accent text-accent-foreground',
			statusIcon: 'inline size-5 opacity-80 group-hover/status:opacity-100 transition-opacity',
			statusContainer: 'group/status flex cursor-help items-center gap-2 mr-1'
		},
		variants: {
			status: {
				ARCHIVED: { bg: 'bg-red-500/20', statusContainer: 'text-rose-500' },
				UNRATED: {},
				PRELIMINARY: { bg: 'bg-amber-500/20', statusContainer: 'text-orange-400' },
				SOLID: {
					bg: 'bg-primary/40',
					statusContainer: 'text-sky-400'
				},
				HIGHLIGHTED: {
					bg: 'bg-primary/80',
					statusContainer: 'text-cyan-300'
				}
			}
		}
	});
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { tv } from 'tailwind-variants';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
	import MaterialSymbolsSearchActivityRounded from '$lib/icons/MaterialSymbolsSearchActivityRounded.svelte';
	import OcticonVerified16 from '$lib/icons/OcticonVerified16.svelte';
	import OcticonUnverified16 from '$lib/icons/OcticonUnverified16.svelte';
	import { findProfessor, getProfessorRenderData, orderTags } from '$lib/core/professors';
	import { professorRepo, type ProfessorEntry } from '$lib/core/professors/repository.svelte';
	import { hasPendingReview } from '$lib/core/reviews/api';
	import { calculateConfidenceStatus } from '../types';
	import { formatRelativeTime } from '../utils';
	import { PROFESSOR_BADGE_ICON_REGISTRY, PROFESSOR_BADGE_PALETTE } from './ProfessorBadge.svelte';
	import ProfessorTag from './ProfessorTag.svelte';
	import ProfessorComments from './ProfessorComments.svelte';
	import MaterialSymbolsKeyboardArrowDownRounded from '$lib/icons/MaterialSymbolsKeyboardArrowDownRounded.svelte';
	import MaterialSymbolsKeyboardDoubleArrowDownRounded from '$lib/icons/MaterialSymbolsKeyboardDoubleArrowDownRounded.svelte';

	interface Props {
		id?: string;
		professor?: ProfessorEntry;
	}

	let { id, professor }: Props = $props();

	let isVisible = $state(false);
	let isPendingMyVote = $state(false);

	function viewport(node: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			isVisible = entries[0].isIntersecting;
		});
		observer.observe(node);
		return {
			destroy: () => observer.disconnect()
		};
	}

	const nameToSearch = $derived(professor?.name ?? id ?? '');
	const registryProfile = $derived(findProfessor(nameToSearch));
	const renderData = $derived(getProfessorRenderData(registryProfile));
	const repoData = $derived(professor ?? professorRepo.search(nameToSearch)[0]);

	const status = $derived(
		calculateConfidenceStatus(
			renderData?.sampleMeta?.reviewCount ?? 0,
			renderData?.sampleMeta?.isArchived
		)
	);

	const currentUiStyles = $derived(statusVariants({ status }));
	const currentMeta = $derived(STATUS_METADATA[status]);
	const name = $derived(repoData?.name ?? registryProfile?.name ?? id ?? 'Profesor Desconocido');

	const isDataDeficient = $derived(status === 'ARCHIVED' || status === 'UNRATED');

	onMount(() => {
		if (renderData?.profile) {
			isPendingMyVote = hasPendingReview(renderData.profile.name);
		}
	});
</script>

{#snippet confidenceTooltip()}
	{#if renderData?.sampleMeta}
		<div class="space-y-2 leading-tight">
			<p>
				{currentMeta.description}
				{#if !isDataDeficient}
					<b>{currentMeta.confidence}</b>.
					<br />
					<span class="text-xs opacity-50"
						>Basado en {renderData.sampleMeta.reviewCount} votos.</span
					>
				{/if}
			</p>

			{#if !isDataDeficient}
				<p>
					Peso Efectivo: <span class="ml-1 font-mono"
						>{renderData.sampleMeta.effectiveCount.toFixed(1)}</span
					><br />
					<span class="text-xs opacity-50"
						>Votos ponderados por recencia, coherencia y validez.</span
					>
				</p>
			{/if}
			<p class="text-xs">
				<MaterialSymbolsNestClockFarsightAnalogOutline class="inline size-4" />
				<span>{formatRelativeTime(renderData.sampleMeta.lastUpdated)}</span>
			</p>
		</div>
	{/if}
{/snippet}

<div class="relative h-full w-full space-y-4 text-left" use:viewport>
	<div class="{currentUiStyles.bg({})} relative -mx-4 -mt-4 space-y-1 rounded-t-lg border-b p-4">
		<div class="relative flex items-start justify-between gap-2">
			<div>
				<h1 class="text-foreground leading-tight font-medium capitalize select-none">{name}</h1>
				{#if registryProfile?.email}
					<p class="text-xs opacity-50">{registryProfile.email}</p>
				{/if}
			</div>

			{#if renderData?.sampleMeta}
				{@const Icon = currentMeta.icon}
				<Tooltip wrapperClass="absolute! right-0 top-0 -m-1" content={confidenceTooltip}>
					<div class={currentUiStyles.statusContainer({})}>
						<Icon class={currentUiStyles.statusIcon({})} />
						{STATUS_METADATA[status].label}
					</div>
				</Tooltip>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-1.5">
			{#if repoData?.campuses && repoData.campuses.size > 0}
				<Tooltip content={`Sedes disponibles: ${Array.from(repoData.campuses).sort().join(', ')}`}>
					<div
						class="-ml-0.5 flex cursor-help items-center gap-1 rounded border border-sky-500! bg-sky-950/40 px-1.5 text-xs font-medium text-sky-400 shadow-sm/50 select-none"
						role="note"
					>
						<span>Sedes</span>
					</div>
				</Tooltip>
			{/if}

			{#each repoData?.subjects.slice(0, 6) ?? [] as subject}
				<Tooltip content={subject.name}>
					<span
						class="bg-accent text-muted-foreground border-border/50 rounded border px-1.5 font-mono text-xs font-bold tracking-tight shadow-sm/50"
					>
						{subject.sigla}
					</span>
				</Tooltip>
			{/each}

			{#if repoData?.subjects && repoData.subjects.length > 6}
				<Tooltip
					content={repoData.subjects
						.slice(6)
						.map((s) => `${s.sigla} (${s.name})`)
						.join(', ')}
				>
					<span
						class="text-muted-foreground cursor-help px-1 py-0.5 text-[10px] font-medium select-none"
						role="status"
					>
						+{repoData.subjects.length - 6} más
					</span>
				</Tooltip>
			{/if}
		</div>
	</div>

	<div class="@container flex flex-col gap-4 rounded border p-4">
		{#if renderData?.meta && !isDataDeficient}
			<div class="flex flex-col justify-center gap-2">
				{#each Object.entries(renderData.meta) as [dimKey, dim] (dimKey)}
					<div class="flex w-full flex-row flex-wrap gap-2 *:flex-1">
						{#each Object.entries(dim.subs) as [subKey, sub] (subKey)}
							{@const roundedValue = Math.max(1, Math.min(5, Math.round(sub.val))) as
								| 1
								| 2
								| 3
								| 4
								| 5}
							{@const Icon = PROFESSOR_BADGE_ICON_REGISTRY[sub.def.id][roundedValue]}
							{@const isInverseMetric = ['rigor_calificatorio', 'dificultad_percibida'].includes(
								sub.def.id
							)}
							{@const color = (() => {
								let scoreIndex = roundedValue - 1;
								if (isInverseMetric) scoreIndex = 4 - scoreIndex;
								return PROFESSOR_BADGE_PALETTE[scoreIndex];
							})()}
							{@const isExtreme = [1, 5].includes(roundedValue)}

							<Tooltip wrapperClass="w-full block! cursor-help">
								{#snippet content()}
									<div class="max-w-xs space-y-2 p-2 text-left leading-snug">
										<p class="text-xs font-semibold tracking-wider uppercase opacity-90">
											Métrica: {sub.def.label}
										</p>
										<p class="text-muted-foreground text-sm">
											{sub.def.description}
										</p>

										<div class="bg-border -mx-4 h-px w-auto"></div>

										<p class="text-xs font-semibold tracking-wider uppercase opacity-90">
											Puntaje: {sub.label}
										</p>
										<p class="text-foreground text-sm">
											<span class="text-muted-foreground font-normal">Nivel actual:</span>
											{sub.def.levels[roundedValue].description}
										</p>
									</div>
								{/snippet}
								<div
									class="group bg-muted relative flex flex-row items-center gap-3 overflow-hidden rounded border shadow-sm hover:brightness-125 {isExtreme
										? `${color.border} saturate-105`
										: 'grayscale-25'} px-3 py-1 @sm:py-2"
								>
									{#if isExtreme}
										<div
											class="absolute top-0 left-0 -z-10 size-full mask-l-to-80% {color.solid} opacity-50"
										></div>
									{/if}

									{#if roundedValue !== 3}
										{@const difference = roundedValue - 3}
										{@const distance = Math.abs(difference)}
										{@const ArrowIcon =
											distance === 1
												? MaterialSymbolsKeyboardArrowDownRounded
												: MaterialSymbolsKeyboardDoubleArrowDownRounded}

										<div
											class="{color.solid} absolute top-0 left-0 -z-1 size-full opacity-20"
										></div>

										<div
											class="absolute top-0 right-0 bottom-0 flex h-auto items-center justify-center"
										>
											<ArrowIcon
												class="size-12 opacity-50 mix-blend-plus-lighter {color.text} {difference *
													(isInverseMetric ? -1 : 1) >
												0
													? 'rotate-180'
													: ''}"
											/>
										</div>
									{/if}

									<div
										class="text-muted-foreground/50 absolute top-0 right-2 bottom-0 flex h-auto w-fit items-end justify-center p-1 text-2xl font-black"
									></div>

									<Icon class="size-5 @lg:size-6 {color.text}" />
									<div class="-space-y-1 leading-none @md:-space-y-0.5">
										<div class="flex min-w-0 shrink items-center gap-2">
											<span
												class="text-muted-foreground truncate text-sm font-medium tracking-tight uppercase"
											>
												{sub.def.label}
											</span>
										</div>

										<div class="shrink-0">
											<span class="text-xs font-medium @md:text-sm {color.text} pr-8 tabular-nums">
												{sub.label}
											</span>
										</div>
									</div>
								</div>
							</Tooltip>
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-6 text-center">
				<p class="text-muted-foreground text-xs italic">
					Datos insuficientes o muy antiguos para generar un perfil actual.
				</p>
			</div>
		{/if}

		{#if renderData && renderData.tags.length > 0}
			{@const sortedTags = [...renderData.tags].sort((a, b) => b.score - a.score)}
			{@const topTags = sortedTags.slice(0, 5)}
			{@const maxScore = topTags[0]?.score || 1}
			{@const minScore = topTags[topTags.length - 1]?.score || 0}
			{@const hasSignificantVariation = (maxScore - minScore) / maxScore > 0.2}

			<div class="flex w-full flex-wrap items-center justify-center gap-2">
				{#each orderTags(topTags) as tag (tag.id)}
					{@const weight = tag.score / maxScore}
					{@const isHeavy = hasSignificantVariation && Math.pow(weight, 2) > 0.6}
					<ProfessorTag {tag} heavy={isHeavy} />
				{/each}
			</div>
		{/if}

		{#if renderData?.profile?.comments && isVisible}
			<ProfessorComments comments={renderData.profile.comments} />
		{/if}
	</div>

	{#if isPendingMyVote}
		<Tooltip content="Tu reseña se ha enviado y se procesará en el próximo ciclo (~30min).">
			<span class="animate-pulse font-bold text-emerald-600"> ● Tu voto pendiente </span>
		</Tooltip>
	{/if}
</div>
