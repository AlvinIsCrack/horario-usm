<script>
	import { MAIN_RENDERER } from '$lib/constants/ids';
	import { fade } from 'svelte/transition';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import { onMount } from 'svelte';
	import Spinner from '$lib/components/shared/Spinner.svelte';

	// Aseguramos que la sidebar esté limpia al volver al home
	onMount(() => {
		SidebarState.reset();
	});
</script>

<div id={MAIN_RENDERER} class="relative h-full w-full p-2">
	{#await import('$lib/components/calendar/Calendar.svelte')}
		<div class="relative flex h-full w-full items-center justify-center">
			<div transition:fade class="absolute">
				<Spinner size="lg" />
			</div>
		</div>
	{:then { default: Calendar }}
		<Calendar />
		{#await import('$lib/core/config/components/dialog/SettingsDialog.svelte') then { default: SettingsDialog }}
			<SettingsDialog />
		{/await}
	{/await}
</div>
