<script lang="ts">
	import '../app.css';

	import { Calendario } from '$lib/states/calendario.svelte';
	$effect(() => {
		Calendario.init(localStorage);
	});

	let { children } = $props();
</script>

<svelte:head>
	<title>Horario USM</title>
</svelte:head>
{@render children()}
