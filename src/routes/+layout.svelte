<script lang="ts">
	import '../app.css';

	import { Calendario } from '$lib/states/calendario.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	
	$effect(() => {
		Calendario.init(localStorage);
	});

	let { children } = $props();
</script>

<svelte:head>
	<title>Horario USM</title>
</svelte:head>

<div role="application" class="relative h-full w-full overflow-hidden">
	{@render children()}
</div>

<Dialog />
<div
	id="tooltip-portal"
	class="pointer-events-none fixed top-0 left-0 z-[1000] h-full w-full"
></div>

<style>
	:global(.loader-usm) {
		rotate: 0;
		animation: loader-usm-animation 1s linear infinite;
	}

	@keyframes -global-loader-usm-animation {
		to {
			rotate: 360deg;
		}
	}
</style>
