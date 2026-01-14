<script>
	import { MAIN_RENDERER } from '$lib/constants/ids';
	import Loader from '$lib/icons/loader.svelte';
	import { fade } from 'svelte/transition';
	import { SidebarState } from '$lib/logic/sidebar/state.svelte';
	import { onMount } from 'svelte';

	// Aseguramos que la sidebar esté limpia al volver al home
	onMount(() => {
		SidebarState.reset();
	});
</script>

<div id={MAIN_RENDERER} class="relative h-full w-full p-2">
	{#await import('$lib/components/calendar/Calendar.svelte')}
		<div class="relative flex h-full w-full items-center justify-center">
			<div transition:fade class="absolute">
				<Loader class="loader-usm scale-200" />
			</div>
		</div>
	{:then { default: Calendar }}
		<Calendar />
	{/await}
</div>
