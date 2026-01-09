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
</script>

<div class="w-full text-left">
	<div class="bg-accent/50 -mx-4 -mt-4 rounded-t-lg p-4">
		<h1 class="text-foreground font-medium capitalize">
			{repoData?.name ?? registryProfile?.name ?? id ?? 'Profesor Desconocido'}
		</h1>

		{#if registryProfile?.email}
			<p class="-mt-0.5 text-xs opacity-50">{registryProfile.email}</p>
		{/if}

		{#if repoData?.departments}
			<p class="-mt-0.5 font-medium text-sky-500 text-xs opacity-50">
				{repoData.departments
					.values()
					.toArray()
					.map((t) => `DEPTO. DE ${t}`)
					.join(', ')}
			</p>
		{/if}

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

	{#if renderData && renderData.tags.length > 0}
		<div class="mt-3 flex flex-wrap gap-1">
			{#each orderTags(renderData.tags) as tag (tag.id)}
				<Tooltip content={tag.description}>
					<Badge
						class="pointer-events-none h-5 px-1.5 text-[10px]"
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
		<div class="-mx-4 border-t px-4 pt-3">
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
