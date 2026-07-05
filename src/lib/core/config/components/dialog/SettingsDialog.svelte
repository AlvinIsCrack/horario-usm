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
</script>

<DialogComponent bind:open={isOpen} closable={isConfigComplete} class="gap-0 p-0 sm:max-w-md">
	<div class="bg-card border-b p-5 pb-4">
		<h2 class="text-xl leading-none font-black tracking-tight">Ajustes</h2>
		<p class="text-muted-foreground mt-2 text-xs leading-relaxed">
			Determina tu entorno institucional. Toda la información de la plataforma (paralelos
			disponibles, asignaturas, bloques horarios y analíticas) se sincronizará automáticamente según
			la sede y el período académico que definas.
		</p>
	</div>

	<div class="flex flex-col gap-4 p-4">
		<SedeSelector />
		<UserData />
	</div>
</DialogComponent>
