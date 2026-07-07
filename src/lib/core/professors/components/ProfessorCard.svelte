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
	import ProfessorBadge from './ProfessorBadge.svelte';
	import ProfessorTag from './ProfessorTag.svelte';
	import ProfessorComments from './ProfessorComments.svelte';

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

	const statusVariants = tv({
		slots: { bg: '', iconClass: '' },
		variants: {
			status: {
				ARCHIVED: { bg: 'bg-red-500/20', iconClass: 'text-rose-500' },
				UNRATED: { bg: 'bg-accent', iconClass: 'text-muted-foreground/50' },
				PRELIMINARY: { bg: 'bg-amber-500/20', iconClass: 'text-orange-400' },
				SOLID: {
					bg: 'bg-sky-500/20',
					iconClass: 'text-cyan-400 drop-shadow-sm/100! drop-shadow-cyan-500'
				},
				HIGHLIGHTED: {
					bg: 'bg-fuchsia-500/20',
					iconClass: 'text-fuchsia-400 drop-shadow-sm/100! drop-shadow-fuchsia-600'
				}
			}
		}
	});

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

<div class="relative h-full w-full space-y-2.5 text-left" use:viewport>
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
				<Tooltip wrapperClass="absolute! right-0 top-0 -m-0.5" content={confidenceTooltip}>
					<div
						class="cursor-help transition-opacity [&_svg]:size-4 [&_svg]:scale-120 [&_svg]:opacity-80 [&_svg]:hover:opacity-100"
					>
						<Icon class={currentUiStyles.iconClass({})} />
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

	{#if renderData?.meta && !isDataDeficient}
		<div
			class="inset-0 flex w-full flex-row flex-wrap items-center justify-center gap-2 xl:gap-2.5"
		>
			{#each Object.entries(renderData.meta) as [dimKey, dim] (dimKey)}
				<div class="flex flex-row flex-wrap gap-px">
					{#each Object.entries(dim.subs) as [subKey, sub] (subKey)}
						<ProfessorBadge dimension={dim} subdimension={sub} />
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

		<div class="flex flex-wrap gap-1">
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

	{#if isPendingMyVote}
		<Tooltip content="Tu reseña se ha enviado y se procesará en el próximo ciclo (~30min).">
			<span class="animate-pulse font-bold text-emerald-600"> ● Tu voto pendiente </span>
		</Tooltip>
	{/if}
</div>
