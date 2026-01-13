<script lang="ts">
	import { onMount } from 'svelte';
	import MaterialSymbolsGrid4x4 from '$lib/icons/MaterialSymbolsGrid4x4.svelte';
	import Teachers from '$lib/icons/teachers.svelte';
	import MaterialSymbolsMagicButton from '$lib/icons/MaterialSymbolsMagicButton.svelte';
	import MaterialSymbolsFeedback from '$lib/icons/MaterialSymbolsFeedback.svelte';
	import MaterialSymbolsPrint from '$lib/icons/MaterialSymbolsPrint.svelte';
	import MaterialSymbolsToolsWrench from '$lib/icons/MaterialSymbolsToolsWrench.svelte';
	import RiEmotionHappyFill from '$lib/icons/RiEmotionHappyFill.svelte';

	const STORAGE_KEY = 'app_changelog_seen';
	const EXPIRATION_DAYS = 7;
	const MS_IN_DAY = 24 * 60 * 60 * 1000;
	const READ_THRESHOLD_MS = 1 * 60 * 60 * 1000;

	const UPDATES = {
		'Nuevas etiquetas de calificación de profesores': {
			icon: RiEmotionHappyFill,
			description:
				'Se mejoraron los nombres y descripciones de cada nivel de nota para que se entienda exactamente qué significan, sin confusiones. También hay nuevos iconos para facilitar la lectura visual de cada categoría.'
		},
		'Corrección en el desbloqueo de malla': {
			icon: MaterialSymbolsToolsWrench,
			description:
				'Ahora el sistema identifica correctamente los ramos equivalentes o alternativos. Ya no se te bloquearán asignaturas por no cursar una versión de un ramo que no corresponde a tu carrera. ¡Gracias por avisarrrr!'
		},
		'Exportar calendario, ajustes de exportación': {
			icon: MaterialSymbolsPrint,
			description:
				'Se puede generar un calendario de tipo ".ics", para poder exportarlo a Google Calendar, Microsoft Outlook o iCal. Además, se ha rediseñado la funcionalidad para exportar imagenes. Ahora la vista es mucho mejor, y ofrece parámetros para personalizar el documento.'
		}
	};

	let newItems = $state(new Set<string>());
	onMount(() => {
		try {
			const rawData = localStorage.getItem(STORAGE_KEY);
			let seenData: Record<string, number> = rawData ? JSON.parse(rawData) : {};
			const now = Date.now();
			let hasChanges = false;

			// 1. Limpieza (Garbage Collection)
			for (const [key, timestamp] of Object.entries(seenData)) {
				if (now - timestamp > EXPIRATION_DAYS * MS_IN_DAY) {
					delete seenData[key];
					hasChanges = true;
				}
			}

			// 2. Lógica de "Lectura Progresiva"
			const currentNewItems = new Set<string>();

			for (const title of Object.keys(UPDATES)) {
				const firstSeen = seenData[title];

				if (!firstSeen) {
					// Caso A: Nunca visto. Lo registramos ahora y aparece como nuevo.
					currentNewItems.add(title);
					seenData[title] = now;
					hasChanges = true;
				} else if (now - firstSeen < READ_THRESHOLD_MS) {
					// Caso B: Visto hace poco (menos de 1 hora). Sigue siendo "nuevo".
					currentNewItems.add(title);
				}
				// Caso C: Si pasó más de 1 hora, no se agrega a currentNewItems (aparece como leído)
			}

			newItems = currentNewItems;

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
							class="animate-in fade-in zoom-in text-primary-foreground inline-flex items-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase duration-300"
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
