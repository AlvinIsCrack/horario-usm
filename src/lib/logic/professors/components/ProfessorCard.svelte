<script lang="ts">
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MaterialSymbolsInfo from '$lib/icons/MaterialSymbolsInfo.svelte';
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
	import { findProfessor, getProfessorRenderData, orderTags } from '$lib/logic/professors';
	import { professorRepo, type ProfessorEntry } from '$lib/logic/professors/repository.svelte';
	import { hasPendingReview } from '$lib/logic/reviews/api';
	import { onMount } from 'svelte';
	import BARSBadge from './BARSBadge.svelte';
	import ProfessorTag from './ProfessorTag.svelte';
	import MaterialSymbolsAndroidMessages from '$lib/icons/MaterialSymbolsAndroidMessages.svelte';

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

	const name = $derived(repoData?.name ?? registryProfile?.name ?? id ?? 'Profesor Desconocido');
	const isSolid = $derived((renderData?.sampleMeta.reviewCount || 0) >= 5);
	const isArchived = $derived(renderData?.sampleMeta.isArchived);

	console.log(renderData);
</script>

<div class="relative h-full w-full space-y-2.5 text-left">
	<div class="bg-accent/50 -mx-4 -mt-4 space-y-1 rounded-t-lg border-b p-4">
		<div class="relative flex items-start justify-between gap-2">
			<div>
				<h1 class="text-foreground leading-tight font-medium capitalize">
					{#if renderData?.sampleMeta}
						{#snippet tooltipContent()}
							<p>
								{#if isArchived}
									Datos históricos o insuficientes para generar una estadística actual confiable.
								{:else}
									Nivel de confianza estadística <b>{!isSolid ? 'preliminar' : 'sólida'}</b>.
									<br />
									<span class="text-xs opacity-50"
										>Basado en {renderData.sampleMeta.reviewCount} votos.</span
									>
								{/if}
							</p>
						{/snippet}

						<Tooltip wrapperClass="cursor-help" content={tooltipContent}>
							<span
								class="underline decoration-dotted {isSolid
									? 'decoration-sky-500/80!'
									: isArchived
										? 'decoration-slate-400/80!'
										: 'decoration-orange-400/80!'} underline-offset-3 hover:decoration-solid"
							>
								{name}
							</span>
						</Tooltip>
					{:else}
						{name}
					{/if}
				</h1>
				{#if registryProfile?.email}
					<p class="text-xs opacity-50">{registryProfile.email}</p>
				{/if}
			</div>
		</div>

		<div class="flex flex-wrap gap-1">
			{#if repoData?.campuses}
				{#each Array.from(repoData.campuses) as sede}
					<span
						class="bg-primary/50 text-secondary-foreground border-secondary-foreground/10 -ml-0.5 rounded-full border px-1.5 text-[10px] select-none"
					>
						{sede}
					</span>
				{/each}
			{/if}
			{#each repoData.subjects.slice(0, 4) as subject}
				<Tooltip content={subject.name}>
					<span
						class="bg-accent text-muted-foreground border-border/50 rounded border px-1 font-mono text-xs font-bold tracking-tight shadow-sm/50"
					>
						{subject.sigla}
					</span>
				</Tooltip>
			{/each}
			{#if repoData.subjects.length > 4}
				<Tooltip
					content={repoData.subjects
						.slice(4)
						.map((s) => `${s.sigla} <span class="opacity-50">(${s.name})</span>`)
						.join(', ')}
				>
					<span class="text-muted-foreground px-1 py-0.5 text-[10px] select-none">
						+{repoData.subjects.length - 4} más
					</span>
				</Tooltip>
			{/if}
		</div>
	</div>

	{#if renderData?.meta && !isArchived}
		{@const count = renderData.sampleMeta?.reviewCount ?? 0}
		<div
			class="inset-0 flex w-full flex-row flex-wrap justify-center gap-2 xl:gap-2.5 {count < 5
				? 'opacity-90 grayscale-25'
				: ''}"
		>
			{#each Object.entries(renderData.meta) as [dimKey, dim] (dimKey)}
				<div class="flex flex-row flex-wrap gap-px">
					{#each Object.entries<any>(dim.subs) as [subKey, sub] (subKey)}
						<BARSBadge dimension={dim} subdimension={sub} />
					{/each}
				</div>
			{/each}
		</div>
	{:else if isArchived}
		<div class="py-6 text-center">
			<p class="text-muted-foreground text-xs italic">
				Datos insuficientes o muy antiguos para generar un perfil actual.
			</p>
		</div>
	{/if}

	{#if renderData && renderData.tags.length > 0}
		<div class="flex flex-wrap gap-1 {!isSolid ? 'opacity-80 grayscale-40' : 'opacity-100'}">
			{#each orderTags(renderData.tags) as tag (tag.id)}
				<ProfessorTag {tag} />
			{/each}
		</div>
	{/if}

	<!-- {#if renderData?.meta}
        <div class="mt-4 flex flex-col gap-2 border-t border-border/50 pt-3">
            <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                <MaterialSymbolsAndroidMessages class="size-3" />
                <span>Opiniones ({professor.comments.length})</span>
            </div>

            <div class="flex flex-col gap-2 pr-1 max-h-40 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                {#each professor.comments as comment}
                    <div class="relative group rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-all hover:bg-muted/40 hover:border-border/60">
                        <p class="text-xs italic leading-relaxed text-foreground/80 line-clamp-4">
                            "{comment.text}"
                        </p>

                        {#snippet metaTooltip()}
                            <div class="flex flex-col gap-1.5">
                                <span class="text-xs font-medium text-foreground/90">
                                    📅 {new Date(comment.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                </span>
                                {#if comment.tags?.length}
                                    <div class="flex flex-wrap gap-1 border-t border-white/10 pt-1 mt-1">
                                        {#each comment.tags as tag}
                                            <span class="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                                {tag}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/snippet}

                        <Tooltip content={metaTooltip} wrapperClass="absolute inset-0 w-full h-full cursor-help">
                            <span class="sr-only">Detalles</span>
                        </Tooltip>
                    </div>
                {/each}
            </div>
        </div>
    {/if} -->

	{#if isPendingMyVote}
		<Tooltip content="Tu reseña se ha enviado y se procesará en el próximo ciclo (~30min).">
			<span class="animate-pulse font-bold text-emerald-600"> ● Tu voto pendiente </span>
		</Tooltip>
	{/if}

	{#if renderData?.sampleMeta}
		{#snippet tooltipContent()}
			<div class="space-y-2 leading-tight">
				{#if !isArchived}
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
					<span>{timeAgo(renderData.sampleMeta.lastUpdated)}</span>
				</p>
			</div>
		{/snippet}
		<Tooltip wrapperClass="absolute! opacity-50 right-0 top-0" content={tooltipContent}>
			<div class="cursor-help opacity-60 transition-opacity hover:opacity-100">
				<MaterialSymbolsInfo class="size-3 scale-150" />
			</div>
		</Tooltip>
	{/if}
</div>
