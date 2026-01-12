<script lang="ts">
	import '../app.css';

	import { Calendario } from '$lib/states/calendario.svelte';
	import DialogRenderer from '$lib/components/ui/helpers/DialogRenderer.svelte';
	import Toaster from '$lib/components/ui/sonner/Toaster.svelte';

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
