<script lang="ts">
	import MaterialSymbolsGrid4x4 from '$lib/icons/MaterialSymbolsGrid4x4.svelte';

	// Iconos
	import MaterialSymbolsMagicButton from '$lib/icons/MaterialSymbolsMagicButton.svelte';
	import MaterialSymbolsToolsWrench from '$lib/icons/MaterialSymbolsToolsWrench.svelte';

	const UPDATES = {
		'Correcciones: Ramos, horarios y salas': {
			icon: MaterialSymbolsToolsWrench,
			description:
				'Se corrigieron errores de salas mal registradas, y ramos no existentes. (Gracias por los avisos!!)'
		},
		'Correcciones: Sede Viña del Mar': {
			icon: MaterialSymbolsToolsWrench,
			description:
				'Ahora la sede de Viña del Mar está disponible en el selector de sedes, gracias por avisar ;(, era solo una línea en código.'
		},
		'Malla Curricular': {
			icon: MaterialSymbolsGrid4x4,
			description: 'Volvió la malla curricular. Está aún en prueba, pero funciona lo básico.'
		},
		'Prompt para IA': {
			icon: MaterialSymbolsMagicButton,
			description:
				'Función EXPERIMENTAL de exportación de prompt para uso con IA (Gemini, ChatGPT, etc...). Este prompt consolida métricas de carga, logística y tiempos para facilitar una evaluación externa. <b>Los resultados son estrictamente referenciales y no sustituyen una planificación académica oficial.</b>'
		}
	};
</script>

<div class="flex w-full max-w-xl flex-col gap-2">
	<h1 class="mb-1 w-full border-b text-center text-lg font-medium">Novedades</h1>
	{#each Object.entries(UPDATES) as [title, data]}
		<div class="group flex items-center gap-3">
			<div
				class="text-foreground flex h-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-120"
			>
				<data.icon class="size-full" />
			</div>

			<div class="flex min-w-0 flex-col overflow-hidden text-left">
				<span class="decoration-foreground/50 truncate leading-none font-medium">
					{title}
				</span>
				<p
					class="text-muted-foreground group-hover:text-foreground mt-0.5 text-xs leading-tight opacity-60 transition-opacity select-text group-hover:opacity-100"
				>
					{@html data.description}
				</p>
			</div>
		</div>
	{/each}
</div>
