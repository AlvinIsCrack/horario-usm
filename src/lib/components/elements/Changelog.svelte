<script lang="ts">
	import { onMount } from 'svelte';
	import MaterialSymbolsGrid4x4 from '$lib/icons/MaterialSymbolsGrid4x4.svelte';
	import MaterialSymbolsMagicButton from '$lib/icons/MaterialSymbolsMagicButton.svelte';
	import Teachers from '$lib/icons/teachers.svelte';

	// Configuración de persistencia
	const STORAGE_KEY = 'app_changelog_seen';
	const EXPIRATION_DAYS = 7;
	const MS_IN_DAY = 24 * 60 * 60 * 1000;

	const UPDATES = {
		'Repositorio y Reviews de Profesores': {
			icon: Teachers,
			description:
				'En la pestaña "profesores" se pueden visualizar y filtrar profesores, además de poder realizar una <b>encuesta no oficial para calificarlo.</b> Por el momento es EXPERIMENTAL, pero el envío de datos anónimos funciona. Por favor, usar con respeto.'
		},
		'Malla Interactiva': {
			icon: MaterialSymbolsGrid4x4,
			description:
				'Volvió la malla interactiva. Ofrece mejor visualización de relaciones entre ramos. Está aún en prueba, pero funciona lo básico.'
		},
		'Prompt para IA': {
			icon: MaterialSymbolsMagicButton,
			description:
				'Función EXPERIMENTAL de exportación de prompt para uso con IA (Gemini, ChatGPT, etc...). Este prompt consolida métricas de carga, logística y tiempos para facilitar una evaluación externa. <b>Los resultados son estrictamente referenciales y no sustituyen una planificación académica oficial.</b>'
		}
	};

	// Estado para saber qué keys son nuevas en esta sesión
	let newItems = $state(new Set<string>());

	onMount(() => {
		try {
			const rawData = localStorage.getItem(STORAGE_KEY);
			let seenData: Record<string, number> = rawData ? JSON.parse(rawData) : {};
			const now = Date.now();
			let hasChanges = false;

			// 1. Limpieza (Garbage Collection): Eliminar registros antiguos (> 1 semana)
			// Esto libera espacio y permite reutilizar keys a largo plazo.
			for (const [key, timestamp] of Object.entries(seenData)) {
				if (now - timestamp > EXPIRATION_DAYS * MS_IN_DAY) {
					delete seenData[key];
					hasChanges = true;
				}
			}

			// 2. Detección de nuevos ítems y marcado como vistos
			const currentNewItems = new Set<string>();

			for (const title of Object.keys(UPDATES)) {
				// Si no está en el registro, es nuevo
				if (!seenData[title]) {
					currentNewItems.add(title);
					seenData[title] = now; // Lo marcamos como visto ahora mismo
					hasChanges = true;
				}
			}

			// Actualizamos el estado para la UI
			newItems = currentNewItems;

			// 3. Guardar cambios en localStorage si hubo modificaciones
			if (hasChanges) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(seenData));
			}
		} catch (error) {
			console.warn('Error accediendo a localStorage para changelog:', error);
		}
	});
</script>

<div class="flex w-full max-w-xl flex-col gap-2">
	<h1 class="mb-1 w-full border-b text-center text-lg font-medium">Novedades</h1>
	{#each Object.entries(UPDATES) as [title, data]}
		{@const isNew = newItems.has(title)}
		<div
			class="group flex items-center gap-3 rounded-lg p-2 px-4 transition-all duration-500 {isNew
				? 'bg-amber-600/40 hover:bg-amber-500/50'
				: 'hover:bg-muted/10'}"
		>
			<div
				class="flex h-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-120 {isNew
					? 'text-amber-300'
					: 'text-foreground'}"
			>
				<data.icon class="size-full" />
			</div>

			<div class="flex min-w-0 flex-col overflow-hidden text-left">
				<div class="flex items-center gap-2">
					<span class="decoration-foreground/50 truncate leading-none font-medium">
						{title}
					</span>
					{#if isNew}
						<span
							class="animate-in fade-in zoom-in bg-amber-500 text-primary-foreground inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase duration-300"
						>
							Nuevo
						</span>
					{/if}
				</div>
				<p
					class="mt-0.5 text-xs leading-tight transition-opacity select-text {isNew
						? 'text-foreground opacity-90'
						: 'text-muted-foreground group-hover:text-foreground opacity-60 group-hover:opacity-100'}"
				>
					{@html data.description}
				</p>
			</div>
		</div>
	{/each}
</div>
