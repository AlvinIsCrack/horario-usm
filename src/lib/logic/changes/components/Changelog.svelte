<script lang="ts">
	import { onMount } from 'svelte';
	import MaterialSymbolsToolsWrench from '$lib/icons/MaterialSymbolsToolsWrench.svelte';
	import RiEmotionHappyFill from '$lib/icons/RiEmotionHappyFill.svelte';
	import { SmartReadTracker } from '$lib/logic/changes/readStatus';

	const UPDATES = {
		'Corrección de topes al imprimir o generar imagen': {
			icon: MaterialSymbolsToolsWrench,
			description:
				'Ahora se muestran bien los topes de horario en el documento generado para motivos de impresión o visualización.'
		},
		'Nuevas etiquetas y sistema visual de calificación': {
			icon: RiEmotionHappyFill,
			description:
				'Rediseño total de la semántica y visualización de notas. Se mejoraron nombres y descripciones para eliminar ambigüedades, junto con un nuevo sistema de iconos dinámicos. Además, hay nuevas etiquetas para catalogar a los profesores.'
		},
		'Corrección en el desbloqueo de malla': {
			icon: MaterialSymbolsToolsWrench,
			description:
				'Ahora el sistema identifica correctamente los ramos equivalentes o alternativos. Ya no se te bloquearán asignaturas por no cursar una versión de un ramo que no corresponde a tu carrera. ¡Gracias por avisarrrr!'
		}
	};

	let newItems = $state(new Set<string>());
	onMount(() => {
		// Inicializamos el tracker inteligente
		// - 8 horas de duración para considerar algo "nuevo"
		// - Pausa el contador entre las 00:00 y las 06:00
		const tracker = new SmartReadTracker({
			storageKey: 'app_changelog_seen',
			thresholdHours: 4,
			nightStartHour: 0,
			nightEndHour: 7
		});

		// Procesamos las llaves y obtenemos cuáles son nuevas
		newItems = tracker.process(Object.keys(UPDATES)) as Set<string>;
	});
</script>

<div class="flex w-full max-w-xl flex-col gap-2">
	<h1 class="mb-1 w-full border-b text-center text-lg font-medium">Novedades</h1>
	{#each Object.entries(UPDATES) as [title, data], i}
		{@const isNew = newItems.has(title)}
		<div
			class="group flex items-start gap-3 rounded-lg p-2 px-4 transition-all duration-200 {isNew
				? 'bg-amber-600/40 hover:bg-amber-500/50'
				: 'hover:bg-muted/10'} {i > 1
				? 'max-h-12 mask-b-from-50% hover:max-h-40 hover:mask-b-from-100%'
				: ''}"
		>
			<div
				class="my-auto flex h-6 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-120 {isNew
					? 'text-amber-300'
					: 'text-foreground'}"
			>
				<data.icon class="size-full" />
			</div>

			<div class="flex min-w-0 flex-col overflow-hidden text-left">
				<div class="flex items-center gap-2">
					<span class="decoration-foreground/50 truncate leading-none font-medium select-none">
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
					class="mt-0.5 text-xs leading-tight transition-all duration-200 select-none {isNew
						? 'text-foreground opacity-90'
						: 'text-muted-foreground group-hover:text-foreground opacity-60 group-hover:opacity-100'}"
				>
					{@html data.description}
				</p>
			</div>
		</div>
	{/each}
</div>
