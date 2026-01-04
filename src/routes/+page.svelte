<script>
	import { MAIN_RENDERER } from '$lib/constants/ids';
	import Loader from '$lib/icons/loader.svelte';
	import { fade } from 'svelte/transition';
	import Dialog from '$lib/components/ui/Dialog.svelte';
</script>

<div role="application" class="bg-primary/80 relative h-full w-full overflow-hidden">
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
