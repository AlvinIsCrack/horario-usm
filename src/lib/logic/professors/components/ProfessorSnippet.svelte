<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import { findProfessor, getProfessorRenderData, orderTags } from '..';

	let { id }: { id: string } = $props();
	const profile = $derived(findProfessor(id));
</script>

<div class="text-left">
	<h1 class="font-medium capitalize">{profile?.name ?? id}</h1>
	{#if profile}
		{@const { tags, meta } = getProfessorRenderData(profile)!}
		{#if profile.email}
			<p class="text-xs opacity-50 -mt-0.5">{profile.email}</p>
		{/if}
		{#if tags.length}
			<div class="mt-3 flex flex-wrap gap-1">
				{#each orderTags(tags) as tag (tag.id)}
					<Badge
						variant={{
							NEUTRAL: 'default',
							ALERT: 'warning',
							POSITIVE: 'success',
							NEGATIVE: 'danger'
						}[tag.sentiment] as any}>{tag.label}</Badge
					>
				{/each}
			</div>
		{/if}
	{/if}
</div>
