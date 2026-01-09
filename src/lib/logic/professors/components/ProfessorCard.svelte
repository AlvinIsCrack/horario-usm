<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { findProfessor, getProfessorRenderData, orderTags } from '$lib/logic/professors';
	import { professorRepo, type ProfessorEntry } from '$lib/logic/professors/repository.svelte';

	let {
		id,
		professor
	}: {
		id?: string;
		professor?: ProfessorEntry;
	} = $props();

	// 1. Determinar el nombre base para buscar
	const nameToSearch = $derived(professor?.name ?? id ?? '');

	// 2. Datos del Registry (Tags, Email, Stats, Metadata manual)
	// findProfessor es tolerante a fallos, devuelve null si no existe registro manual
	const registryProfile = $derived(findProfessor(nameToSearch));
	const renderData = $derived(getProfessorRenderData(registryProfile));

	// 3. Datos del Repositorio (Asignaturas, Sedes - Generado automáticamente)
	// Si no pasaron el objeto 'professor', intentamos buscarlo en el repo por nombre
	const repoData = $derived(professor ?? professorRepo.search(nameToSearch)[0]);

	// 1. Helper Semántico para colores (Verde = Positivo/Fácil, Rojo = Negativo/Difícil)
	function getMetricColor(val: number, metricId: string): string {
		const score = Math.max(1, Math.min(5, Math.round(val)));
		const isInverse = ['rigor_calificatorio', 'dificultad_percibida'].includes(metricId);

		// Escala: Chocolate/Naranja (Duro/Alerta) -> Slate/Sky (Limpio/Fácil)
		const colors = [
			'bg-pink-900/50 text-pink-100', // 1: Muy Malo / Crítico
			'bg-orange-600/40 text-amber-100', // 2: Difícil
			'bg-stone-600/40 text-stone-100', // 3: Balance
			'bg-sky-600/40 text-sky-100', // 4: Bueno
			'bg-cyan-500/40 text-cyan-100' // 5: Máxima Claridad / Facilidad
		];

		// Si es inversa, damos vuelta la paleta para que 5 sea Rojo y 1 sea Verde
		const finalColors = isInverse ? [...colors].reverse() : colors;

		return finalColors[score - 1];
	}

	// 2. Helper para fecha relativa
	function timeAgo(isoDate?: string) {
		if (!isoDate) return '';
		const diff = Date.now() - new Date(isoDate).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days < 7) return 'Reciente';
		if (days < 30) return `Hace ${days}d`;
		if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
		return '+1 año';
	}

	// 3. Helper para normalizar el histograma (altura de barritas)
	function getBarHeight(count: number, total: number) {
		if (!total) return 0;
		// Normalizamos al % del total, maximo 100%
		return Math.max(10, Math.round((count / total) * 100));
	}
</script>

<div class="w-full text-left">
	<div class="bg-accent/50 -mx-4 -mt-4 rounded-t-lg p-4">
		<div class="flex items-start justify-between gap-2">
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
				{#snippet tooltipContent()}
					Nivel de confianza estadística de la calificación, basado en la cantidad de votos.<br />
					<span class="text-xs opacity-50">La cantidad de votos actualmente es {count}</span>
				{/snippet}
				<Tooltip content={tooltipContent}>
					<div
						class="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm {count <
						5
							? 'border-amber-200 bg-amber-500/10 text-amber-600'
							: 'border-indigo-200 bg-indigo-500/10 text-indigo-600'}"
					>
						{#if count < 5}
							Preliminar
						{:else}
							Sólido
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

	<div class="border-border -mx-4 w-[calc(100%+2rem)] border-t"></div>

	{#if renderData?.meta}
		<div class="flex flex-col gap-1 py-2">
			{#each Object.entries(renderData.meta) as [dimKey, dim] (dimKey)}
				<div>
					<h4
						class="text-muted-foreground mb-1 text-[9px] font-bold tracking-wider uppercase opacity-80"
					>
						{dim.label}
					</h4>

					<div class="grid grid-cols-2 gap-1">
						{#each Object.entries<any>(dim.subs) as [subKey, sub] (subKey)}
							<!-- {@const stats = sub.stats} -->

							<!-- {#snippet distributionTooltip()}
								<div class="flex flex-col gap-1">
									<p class="text-xs font-bold">{sub.label}</p>
									<span class="text-[10px] opacity-70">Distribución de votos:</span>
									{#if stats && stats.distribution}
										<div class="flex h-8 items-end gap-1 pt-1">
											{#each [1, 2, 3, 4, 5] as score}
												{@const count = stats.distribution[score] || 0}
												{@const total = renderData.sampleMeta.effectiveCount || 1}
												{@const height = getBarHeight(count, total)}
												<div class="flex w-3 flex-col items-center gap-0.5">
													<div
														class="w-full rounded-t-sm transition-all {score === Math.round(sub.val)
															? 'bg-primary'
															: 'bg-muted-foreground/30'}"
														style="height: {height}%;"
													></div>
													<span class="font-mono text-[8px]">{score}</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/snippet} -->

							<!-- <Tooltip content={distributionTooltip}> -->
							<div
								class="flex flex-1 grow items-center gap-1.5 rounded-md border border-transparent p-1 transition-colors {getMetricColor(
									sub.val,
									sub.def.id
								)}"
							>
								<div class="mx-1 flex flex-col overflow-hidden leading-none">
									<span
										class="text-muted-foreground translate-y-0.5 truncate text-[10px] font-medium opacity-80"
									>
										{sub.def.label}
									</span>
									<span class="text-foreground/90 truncate text-xs font-medium">
										{sub.label}
									</span>
								</div>

								<div
									class="bg-card/50 right-0 ml-auto flex h-full max-w-10 flex-[0.8] items-center justify-center rounded border px-2 font-mono text-xs font-bold"
								>
									<span class="scale-120">{sub.val.toFixed(1)}</span>
								</div>
							</div>
							<!-- </Tooltip> -->
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<div class="border-border/50 -mx-4 border-t"></div>
	{/if}

	{#if renderData && renderData.tags.length > 0}
		<div class="my-2 flex flex-wrap gap-1">
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

	{#if repoData && repoData.subjects.length > 0}
		<div class="mt-2">
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
</div>
