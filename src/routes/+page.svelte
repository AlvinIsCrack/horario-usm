<script>
	import { MAIN_RENDERER } from '$lib/constants/ids';
	import Loader from '$lib/icons/loader.svelte';
	import { fade } from 'svelte/transition';
</script>

<div class="flex h-full w-full flex-row items-center justify-center">
	{#await import('$lib/components/sidebar/SideBar.svelte') then { default: SideBar }}
		<SideBar />
	{/await}
	<div id={MAIN_RENDERER} class="relative h-full w-full p-2">
		{#await (async () => {
				await new Promise(r => setTimeout(r, 500));
				return import('$lib/components/calendar/Calendar.svelte');
			})()}
			<div class="relative flex h-full w-full items-center justify-center">
				<div transition:fade class="absolute">
					<Loader class="loader-usm scale-200" />
				</div>
			</div>
		{:then { default: Calendar }}
			<Calendar />
		{/await}
	</div>
</div>
