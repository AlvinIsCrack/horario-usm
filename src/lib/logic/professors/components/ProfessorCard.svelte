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
	import { fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

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

	let commentIndex = $state(0);
	let isPaused = $state(false);

	$effect(() => {
		let interval: any;
		// Solo rota si hay más de 1 comentario y no está pausado por el mouse
		if ((renderData?.profile.comments?.length ?? 0) > 1 && !isPaused) {
			interval = setInterval(() => {
				commentIndex = (commentIndex + 1) % renderData!.profile.comments!.length;
			}, 5000); // 6 segundos por comentario
		}
		return () => clearInterval(interval);
	});
</script>

<div class="relative h-full w-full space-y-2.5 text-left">
	<div class="bg-accent/50 relative -mx-4 -mt-4 space-y-1 rounded-t-lg border-b p-4">
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

	{#if renderData?.profile.comments?.length}
		{@const activeComment = renderData!.profile.comments![commentIndex]}

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

				{#if renderData!.profile.comments!.length > 1}
					<div class="flex gap-1">
						{#each renderData!.profile.comments! as _, i}
							<div
								class="size-1.5 rounded-full transition-all duration-300 {i === commentIndex
									? 'bg-primary w-4'
									: 'bg-muted-foreground/30'}"
							></div>
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
							class="text-muted-foreground -mx-3 flex items-center justify-between space-x-2 border-t border-white/10 px-3 pt-2 text-[10px]"
						>
							<span class="text-nowrap">📅 {new Date(activeComment.date).toLocaleDateString()}</span
							>
							<!-- {#if activeComment.tags?.length}
									<div class="flex gap-1">
										{#each activeComment.tags.slice(0, 3) as tag}
											<ProfessorTag {tag} />
										{/each}
									</div>
								{/if} -->
						</div>
					</div>
				{/snippet}

				{#key commentIndex}
					<div
						in:slide={{ duration: 500, delay: 500 }}
						out:slide={{ duration: 500 }}
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

						<!-- <MaterialSymbolsAndroidMessages
							class="absolute right-2 bottom-0 z-0 h-8 w-auto opacity-50"
						/> -->
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
