<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
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

	// Component contracts and properties definition
	interface Props {
		id?: string;
		professor?: ProfessorEntry;
	}

	let { id, professor }: Props = $props();

	// Component reactive state
	let isVisible = $state(false);
	let isPendingMyVote = $state(false);
	let commentIndex = $state(0);
	let isPaused = $state(false);

	// Custom viewport action for lazy intersection tracking
	function viewport(node: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			isVisible = entries[0].isIntersecting;
		});
		observer.observe(node);
		return {
			destroy: () => observer.disconnect()
		};
	}

	// Reactive derived business logic
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

	// UI status mappings leveraging tailwind-variants for conditional scaling
	const statusVariants = tv({
		slots: {
			bg: '',
			iconClass: ''
		},
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

	const STATUS_METADATA = {
		ARCHIVED: {
			icon: MaterialSymbolsSearchActivityRounded,
			label: 'Archivado',
			confidence: 'insuficiente'
		},
		UNRATED: { icon: OcticonUnverified16, label: 'Sin datos', confidence: 'nula' },
		PRELIMINARY: { icon: OcticonUnverified16, label: 'Preliminar', confidence: 'preliminar' },
		SOLID: { icon: OcticonVerified16, label: 'Confiable', confidence: 'confiable' },
		HIGHLIGHTED: { icon: OcticonVerified16, label: 'Sólido', confidence: 'sólido' }
	} as const;

	const currentUiStyles = $derived(statusVariants({ status }));
	const currentMeta = $derived(STATUS_METADATA[status]);

	const name = $derived(repoData?.name ?? registryProfile?.name ?? id ?? 'Profesor Desconocido');

	onMount(() => {
		if (renderData?.profile) {
			isPendingMyVote = hasPendingReview(renderData.profile.name);
		}
	});

	// Cyclic background scheduler for multi-comment rotation
	$effect(() => {
		if (!isVisible) return;

		// Explicit tracking dependency assignment
		const _ = [isPaused];
		let intervalId: ReturnType<typeof setInterval> | undefined;

		const totalComments = renderData?.profile?.comments?.length ?? 0;
		if (totalComments > 1 && !isPaused) {
			intervalId = setInterval(() => {
				commentIndex = (commentIndex + 1) % totalComments;
			}, 4000);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<div class="relative h-full w-full space-y-2.5 text-left" use:viewport>
	<div class="{currentUiStyles.bg({})} relative -mx-4 -mt-4 space-y-1 rounded-t-lg border-b p-4">
		<div class="relative flex items-start justify-between gap-2">
			<div>
				<h1 class="text-foreground leading-tight font-medium capitalize select-none">
					{name}
				</h1>
				{#if registryProfile?.email}
					<p class="text-xs opacity-50">{registryProfile.email}</p>
				{/if}
			</div>

			{#if renderData?.sampleMeta}
				{@const Icon = currentMeta.icon}

				{#snippet tooltipContent()}
					<div class="space-y-2 leading-tight">
						<p>
							{#if status === 'ARCHIVED'}
								Datos históricos o insuficientes para generar una estadística actual confiable.
							{:else}
								Nivel de confianza estadística: <b>{currentMeta.confidence}</b>.
								<br />
								<span class="text-xs opacity-50">
									Basado en {renderData.sampleMeta.reviewCount} votos.
								</span>
							{/if}
						</p>

						{#if status !== 'ARCHIVED' && status !== 'UNRATED'}
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
				{/snippet}
				<Tooltip wrapperClass="absolute! right-0 top-0 -m-0.5" content={tooltipContent}>
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
						aria-label={`Disponible en sedes: ${Array.from(repoData.campuses).join(', ')}`}
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
						aria-label="Más asignaturas disponibles"
					>
						+{repoData.subjects.length - 6} más
					</span>
				</Tooltip>
			{/if}
		</div>
	</div>

	{#if renderData?.meta && status !== 'ARCHIVED' && status !== 'UNRATED'}
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
	{:else if status === 'ARCHIVED' || status === 'UNRATED'}
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

	{#if renderData?.profile?.comments?.length}
		{@const activeComment = renderData.profile.comments[commentIndex]}

		<div
			onmouseenter={() => (isPaused = true)}
			onmouseleave={() => (isPaused = false)}
			role="region"
			aria-label="Comentarios rotativos"
			class="h-fit"
		>
			<div class="flex items-center justify-between px-1">
				<div
					class="text-muted-foreground/70 flex items-center gap-1.5 text-[10px] font-bold uppercase"
				>
					<span>PALABRAS</span>
				</div>

				{#if renderData.profile.comments.length > 1}
					<div class="flex gap-1">
						{#each renderData.profile.comments as _, i}
							<button
								aria-label="Breadcrumb"
								onclick={() => {
									isPaused = true;
									commentIndex = i;
								}}
								class="size-1.5 rounded-full transition-all duration-300 {i === commentIndex
									? 'bg-primary pointer-events-none w-4'
									: 'bg-muted-foreground/30 cursor-pointer hover:ring-2'}"
							></button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="relative h-14 w-full">
				{#snippet fullContent()}
					<div class="space-y-2">
						<p class="text-foreground p-2 text-sm leading-snug italic">
							{@html activeComment.text
								.replaceAll('\n', '<br/>')
								.replace(/\((.*?)\)/g, '<span class="opacity-50">($1)</span>')}
						</p>

						<div
							class="text-muted-foreground -mx-3 flex items-center justify-between space-x-2 border-t border-white/10 px-3 pt-2 text-xs"
						>
							<span class="text-nowrap">{new Date(activeComment.date).toLocaleDateString()}</span>
						</div>
					</div>
				{/snippet}

				{#key commentIndex}
					<div
						in:fade={{ duration: 100, delay: 200 }}
						out:fade={{ duration: 100 }}
						class="relative inset-0 -mb-2 h-full w-full"
					>
						<Tooltip
							wrapperClass="cursor-help w-full block! max-h-full"
							class="min-w-lg! 2xl:min-w-xl!"
							content={fullContent}
						>
							<div
								class="group hover:bg-accent hover:border-foreground relative h-full w-full rounded-lg border p-1.5 px-2.5 transition-colors"
							>
								<p class="z-5 line-clamp-3 text-xs italic">
									{activeComment.text.replace(/\n/g, ' ')}
								</p>
							</div>
						</Tooltip>
					</div>
				{/key}
			</div>
		</div>
	{/if}

	{#if isPendingMyVote}
		<Tooltip content="Tu reseña se ha enviado y se procesará en el próximo ciclo (~30min).">
			<span class="animate-pulse font-bold text-emerald-600"> ● Tu voto pendiente </span>
		</Tooltip>
	{/if}
</div>
