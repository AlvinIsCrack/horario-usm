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

		return () => clearTimeout(timeout);
	});

	let isConfigComplete = $derived(!!Config.sede && !!Config.semestre);

	function forceClose() {
		isOpen = false;
	}
</script>

<DialogComponent bind:open={isOpen} closable={isConfigComplete} class="gap-0 p-0 sm:max-w-md">
	<div class="bg-card border-b p-5 pb-4">
		<h2 class="text-xl leading-none font-black tracking-tight">Ajustes</h2>
		<p class="text-muted-foreground mt-2 text-xs leading-relaxed">
			Define el contexto institucional. Los datos como los paralelos, profesores y estadísticas se
			adaptarán a la ubicación y el semestre que especifiques aquí.
		</p>
	</div>

	<div class="bg-muted/20 flex flex-col gap-4 p-4">
		<SedeSelector />
		<UserData />
	</div>
</DialogComponent>
