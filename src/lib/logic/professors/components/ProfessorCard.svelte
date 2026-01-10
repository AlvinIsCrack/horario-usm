<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MaterialSymbolsDatabaseOff from '$lib/icons/MaterialSymbolsDatabaseOff.svelte';
	import MaterialSymbolsExclamationRounded from '$lib/icons/MaterialSymbolsExclamationRounded.svelte';
	import MaterialSymbolsHelpRounded from '$lib/icons/MaterialSymbolsHelpRounded.svelte';
	import MaterialSymbolsInfo from '$lib/icons/MaterialSymbolsInfo.svelte';
	import MaterialSymbolsInfoOutlineRounded from '$lib/icons/MaterialSymbolsInfoOutlineRounded.svelte';
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
	import MaterialSymbolsQuestionMarkRounded from '$lib/icons/MaterialSymbolsQuestionMarkRounded.svelte';
	import MaterialSymbolsVerifiedRounded from '$lib/icons/MaterialSymbolsVerifiedRounded.svelte';
	import { findProfessor, getProfessorRenderData, orderTags } from '$lib/logic/professors';
	import { professorRepo, type ProfessorEntry } from '$lib/logic/professors/repository.svelte';

	import { hasPendingReview } from '$lib/logic/reviews/api';
	import { onMount } from 'svelte';
	import BARSBadge from './BARSBadge.svelte';

	let {
		id,
		professor
	}: {
		id?: string;
		professor?: ProfessorEntry;
	} = $props();

	const nameToSearch = $derived(professor?.name ?? id ?? '');
	const registryProfile = $derived(findProfessor(nameToSearch));
	const renderData = $derived(getProfessorRenderData(registryProfile));
	const repoData = $derived(professor ?? professorRepo.search(nameToSearch)[0]);

	let isPendingMyVote = $state(false);
	onMount(() => {
		// Verificamos si el usuario votó recientemente por este profesor
		if (renderData?.profile) {
			isPendingMyVote = hasPendingReview(renderData.profile.name);
		}
	});

	// Helper para fecha relativa
	function timeAgo(isoDate?: string) {
		if (!isoDate) return '';
		const diff = Date.now() - new Date(isoDate).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days < 7) return 'Reciente';
		if (days < 30) return `Hace ${days}d`;
		if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
		return '+1 año';
	}
</script>

<div class="w-full text-left">
	<div class="bg-accent/50 -mx-4 -mt-4 rounded-t-lg p-4">
		<div class="relative flex items-start justify-between gap-2">
			<div>
				<h1 class="text-foreground leading-tight font-medium capitalize">
					{repoData?.name ?? registryProfile?.name ?? id ?? 'Profesor Desconocido'}
				</h1>
				{#if registryProfile?.email}
					<p class="text-xs opacity-50">{registryProfile.email}</p>
				{/if}
			</div>

			{#if renderData?.sampleMeta}
				{@const count = renderData.sampleMeta.reviewCount}
				{@const isArchived = renderData.sampleMeta.isArchived}

				<Tooltip
					wrapperClass="right-1 z-10 top-1/2 -translate-y-1/2 absolute!"
					content={isArchived
						? 'Datos históricos o insuficientes para generar una estadística actual confiable.'
						: `Nivel de confianza estadística ${count < 5 ? 'preliminar' : 'sólida'}. Basado en ${count} votos.`}
				>
					<div
						class="size-6 drop-shadow-md/100 not-hover:brightness-90 hover:brightness-110 [&_svg]:size-full
                        {isArchived
							? 'border-stone-500! text-stone-400'
							: count < 5
								? 'border-amber-500! text-amber-500 drop-shadow-amber-800'
								: 'border-cyan-600! text-cyan-500 drop-shadow-cyan-900'}"
					>
						{#if isArchived}
							<MaterialSymbolsDatabaseOff />
						{:else if count < 5}
							<MaterialSymbolsHelpRounded />
						{:else}
							<MaterialSymbolsVerifiedRounded />
						{/if}
					</div>
				</Tooltip>
			{/if}
		</div>

		{#if repoData?.campuses}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each Array.from(repoData.campuses) as sede}
					<span
						class="bg-secondary text-secondary-foreground border-secondary-foreground/10 rounded-full border px-2 py-0.5 text-[10px]"
					>
						{sede}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	{#if repoData && repoData.subjects.length > 0}
		<div class="my-1">
			<p class="text-muted-foreground mb-1.5 text-[10px] font-bold tracking-wider uppercase">
				Asignaturas recientes
			</p>
			<div class="flex flex-wrap gap-1">
				{#each repoData.subjects.slice(0, 4) as subject}
					<Tooltip content={subject.name}>
						<span
							class="bg-muted/50 text-muted-foreground border-border/50 rounded border px-1.5 py-0.5 font-mono text-[10px]"
						>
							{subject.sigla}
						</span>
					</Tooltip>
				{/each}
				{#if repoData.subjects.length > 4}
					<span class="text-muted-foreground px-1 py-0.5 text-[10px]">
						+{repoData.subjects.length - 4} más
					</span>
				{/if}
			</div>
		</div>
	{:else if !repoData && !registryProfile}
		<p class="text-muted-foreground mt-2 text-[10px] italic">
			Sin información de asignaturas recientes.
		</p>
	{/if}

	<div class="border-border -mx-4 w-[calc(100%+2rem)] border-t"></div>

	{#if renderData?.meta && !renderData?.sampleMeta?.isArchived}
		{@const count = renderData.sampleMeta?.reviewCount ?? 0}
		<div
			class="flex w-full flex-row flex-wrap justify-center gap-2 py-2 xl:gap-3 {count < 5
				? 'grayscale-50'
				: ''}"
		>
			{#each Object.entries(renderData.meta) as [dimKey, dim] (dimKey)}
				<div class="flex flex-row flex-wrap gap-0.5">
					{#each Object.entries<any>(dim.subs) as [subKey, sub] (subKey)}
						<BARSBadge dimension={dim} subdimension={sub} />
					{/each}
				</div>
			{/each}
		</div>
		<div class="border-border/50 -mx-4 border-t"></div>
	{:else if renderData?.sampleMeta?.isArchived}
		<div class="py-6 text-center">
			<p class="text-muted-foreground text-xs italic">
				Datos insuficientes o muy antiguos para generar un perfil actual.
			</p>
		</div>
		<div class="border-border/50 -mx-4 border-t"></div>
	{/if}

	{#if renderData && renderData.tags.length > 0}
		{@const count = renderData.sampleMeta?.reviewCount ?? 0}
		<div class="my-2 flex flex-wrap gap-1 {count < 5 ? 'opacity-80 grayscale-40' : 'opacity-100'}">
			{#each orderTags(renderData.tags) as tag (tag.id)}
				<Tooltip content={tag.description}>
					<Badge
						class="pointer-events-none h-5 px-1.5 text-[11px]"
						variant={{
							NEUTRAL: 'default',
							ALERT: 'warning',
							POSITIVE: 'success',
							NEGATIVE: 'danger'
						}[tag.sentiment] as any}
					>
						{tag.label}
					</Badge>
				</Tooltip>
			{/each}
		</div>
	{/if}

	{#if renderData?.sampleMeta}
		<div class="border-border bg-muted/20 -mx-4 mt-2 -mb-4 border-t px-4 py-2 select-none">
			<div class="text-muted-foreground flex items-center justify-between text-xs">
				<div class="flex items-center gap-2">
					<Tooltip content="Última actualización de datos">
						<div class="flex items-center gap-1 font-medium">
							<MaterialSymbolsNestClockFarsightAnalogOutline class="size-4" />
							<span>{timeAgo(renderData.sampleMeta.lastUpdated)}</span>
						</div>
					</Tooltip>

					{#if isPendingMyVote}
						<Tooltip content="Tu reseña se ha enviado y se procesará en el próximo ciclo (~30min).">
							<span class="animate-pulse font-bold text-emerald-600"> ● Tu voto pendiente </span>
						</Tooltip>
					{/if}
				</div>

				{#if !renderData.sampleMeta.isArchived}
					{#snippet tooltipContent()}
						Peso Efectivo: <span class="ml-1 font-mono"
							>{renderData.sampleMeta.effectiveCount.toFixed(1)}</span
						><br />
						<span class="text-xs opacity-50"
							>Votos ponderados por recencia, coherencia y validez.</span
						>
					{/snippet}
					<Tooltip content={tooltipContent}>
						<div class="cursor-help opacity-60 transition-opacity hover:opacity-100">
							<MaterialSymbolsInfo class="size-3 scale-150" />
						</div>
					</Tooltip>
				{/if}
			</div>
		</div>
	{/if}
</div>
