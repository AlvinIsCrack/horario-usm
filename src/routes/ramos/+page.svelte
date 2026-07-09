<script lang="ts">
	import RamoRepoWindow from '$lib/components/sidebar/windows/RamoRepoWindow.svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import { onDestroy, onMount } from 'svelte';

	onMount(() => {
		SidebarState.open(RamoRepoWindow, {}, { title: 'Ramos', description: 'Repositorio de cursos' });
	});

	onDestroy(() => {
		SidebarState.reset();
	});
</script>
