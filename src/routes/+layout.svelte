<script lang="ts">
	import '../app.css';

	import { Calendario } from '$lib/states/calendario.svelte';
	import DialogRenderer from '$lib/components/ui/helpers/DialogRenderer.svelte';
	import Toaster from '$lib/components/ui/sonner/Toaster.svelte';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { preIndexRegistry } from '$lib/core/professors/matcher';

	$effect(() => {
		Calendario.init(localStorage);
		preIndexRegistry();
	});

	let { children } = $props();
</script>

<svelte:head>
	<title>Horario USM</title>
</svelte:head>

<div role="application" class="flex size-full flex-row overflow-hidden">
	{#await import('$lib/components/sidebar/SideBar.svelte') then { default: SideBar }}
		<SideBar />
	{/await}

	<div class="relative size-full overflow-hidden">
		{#key page.url.pathname}
			<div
				in:fade={{ duration: 100, delay: 200 }}
				out:fade={{ duration: 100 }}
				class="absolute inset-0 top-0 left-0 size-full"
			>
				{@render children()}
			</div>
		{/key}
	</div>
</div>

<DialogRenderer />

<div
	id="dialogs-portal"
	class="pointer-events-none fixed top-0 left-0 isolate z-200 h-full w-full"
></div>
<Toaster />
<div
	id="tooltip-portal"
	class="pointer-events-none fixed top-0 left-0 isolate z-1000 h-full w-full"
></div>
