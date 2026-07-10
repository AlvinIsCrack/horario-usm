<script lang="ts">
	import RamoRepoWindow from '$lib/components/sidebar/windows/RamoRepoWindow.svelte';
	import RamoForm from '$lib/core/ramos/repo/RamoForm.svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import { onDestroy, onMount } from 'svelte';

	onMount(() => {
		SidebarState.open(RamoRepoWindow, {}, { title: 'Ramos', description: 'Repositorio de cursos' });
	});

	onDestroy(() => {
		SidebarState.reset();
	});
</script>

<div class="flex h-full w-full flex-col">
	<div class="flex-1 overflow-y-auto p-6 pt-8">
		<div class="bg-card rounded border p-4">
			<RamoForm />
		</div>
	</div>
</div>
