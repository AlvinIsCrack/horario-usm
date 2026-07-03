<script module>
	let isOpen = $state(false);

	export const SettingsDialogState = {
		open() {
			isOpen = true;
		},
		close() {
			isOpen = false;
		}
	};
</script>

<script lang="ts">
	import DialogComponent from '$lib/components/ui/Dialog.svelte';
	import { onMount } from 'svelte';
	import { Config } from '../../store.svelte';
	import SedeSelector from '../SedeSelector.svelte';
	import UserData from '../UserData.svelte';

	onMount(() => {
		if (Config.isReady) return;

		const timeout = setTimeout(() => {
			SettingsDialogState.open();
		}, 500);

		return () => {
			clearTimeout(timeout);
		};
	});
</script>

<DialogComponent bind:open={isOpen} class="gap-0 p-0">
	<div class="bg-card border-b p-4 pb-3">
		<h2 class="text-lg leading-none font-bold">Ajustes</h2>
		<p class="text-muted-foreground mt-1 text-xs">
			Especifica sede, jornada y otros parámetros para personalización.
		</p>
	</div>

	<SedeSelector />
	<UserData />
</DialogComponent>
