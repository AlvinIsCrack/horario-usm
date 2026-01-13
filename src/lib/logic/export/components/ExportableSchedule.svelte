<script lang="ts">
	import { Calendario } from '$lib/states/calendario.svelte';
	import Time from '$lib/helpers/time';
	import { BLOQUE_DURATION_MINUTES } from '$lib/constants/usm';
	import { truncate } from 'lodash';

	// Importamos la nueva función tv
	import { scheduleStyles } from '../styles';
	import { TipoBloque } from '$lib/logic/ramos/types';

	let {
		theme = undefined as undefined | keyof typeof scheduleStyles.variants.theme,
		showRooms = true,
		showClassType = true,
		nomenclature = 'detailed',
		showHeader = true,
		showParalelos = true,
		showBloqueEnd = true
	} = $props();

	const DAYS_LABEL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
	const MIN_BLOCKS = 8;

	// --- LÓGICA DE DATOS ---
	const maxBlock = $derived.by(() => {
		let max = MIN_BLOCKS;
		for (const ramo of Calendario.ramos) {
			for (const h of ramo.horario) {
				if (h.bloque > max) max = h.bloque;
			}
		}
		return max;
	});

	const hasSaturday = $derived.by(() => {
		return Calendario.ramos.some((r) => r.horario.some((h) => h.dia === 5));
	});

	const blocks = $derived(Array.from({ length: maxBlock }, (_, i) => i + 1));
	const activeDaysIndices = $derived(hasSaturday ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4]);

	function formatClassType(type: string = '') {
		const t = type.toUpperCase();
		if (!t || t.includes('CAT') || t === 'C' || t === 'CLA') return null;
		return t.slice(0, 3);
	}

	// --- ESTILOS REACTIVOS ---
	// Generamos las clases basadas en el tema actual
	const styles = $derived(scheduleStyles({ theme: theme as any }));
</script>

<div id="export-schedule-target" class={styles.root()}>
	<div class={styles.header({ class: showHeader ? '' : 'border-none pb-0' })}>
		{#if showHeader}
			<div class="space-y-1">
				<h1 class={styles.title()}>Horario</h1>
				<p class="{styles.subtext()} text-sm">Universidad Técnica Federico Santa María</p>
			</div>
		{/if}

		{#if nomenclature === 'codes'}
			<div class="mx-8 grid flex-1 grid-cols-2 gap-x-6 gap-y-1 self-end">
				{#each Calendario.ramos as ramo}
					<div class="flex items-baseline gap-2 text-[10px] leading-tight {styles.dashedBorder()}">
						<span class="font-bold whitespace-nowrap">{ramo.sigla}</span>
						<span class="{styles.subtext()} truncate">{ramo.nombre}</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if showHeader}
			<div class="shrink-0 text-right">
				<div class={styles.metaText()}>Generado el</div>
				<div class="-mt-1 text-sm font-bold uppercase">
					{new Date().toLocaleDateString('es-CL', {
						month: 'long',
						day: 'numeric',
						year: 'numeric'
					})}
				</div>
			</div>
		{/if}
	</div>

	<div
		class={styles.gridContainer()}
		style="grid-template-columns: auto repeat({activeDaysIndices.length}, 1fr);"
	>
		<div class="border-r border-b p-2 {styles.gridHeader().split(' ')[0]}"></div>
		{#each activeDaysIndices as diaIndex}
			<div class={styles.gridHeader()}>
				{DAYS_LABEL[diaIndex]}
			</div>
		{/each}

		{#each blocks as bloque}
			<div class={styles.blockTime()}>
				<span class="text-sm font-bold">{bloque}º</span>
				<span class="mt-0.5 text-[10px]">
					<div class="font-semibold opacity-80">{Time.bloqueToHHMM(bloque)}</div>
					{#if showBloqueEnd}
						<div class="opacity-60">
							{Time.MinutesToHHMM(Time.bloqueToMinutes(bloque) + BLOQUE_DURATION_MINUTES)}
						</div>
					{/if}
				</span>
			</div>

			{#each activeDaysIndices as dia}
				{@const ramo = Calendario.ramos.find((r) =>
					r.horario.some((h) => h.dia === dia && h.bloque === bloque)
				)}
				{@const info = ramo?.horario.find((h) => h.dia === dia && h.bloque === bloque)}

				<div class={styles.cell()}>
					{#if ramo && info}
						<div class={styles.overlay()} style:background-color={ramo.color?.hex() ?? ''}></div>

						<div class="relative z-10 mb-2 flex w-full scale-105 flex-col items-center px-1.5">
							{#if nomenclature === 'detailed'}
								<div class="text-base leading-4 font-bold">
									{truncate(ramo.nombre, { length: 30 })}
								</div>
								<div
									class="flex flex-wrap justify-center gap-2 text-xs font-medium tracking-tight uppercase opacity-80"
								>
									<span class="font-mono font-bold">{ramo.sigla} </span>
									<span class="opacity-80">
										{#if showParalelos}
											PAR. {ramo.paralelo}
										{/if}
									</span>
								</div>
							{:else}
								<div class="scale-110 font-mono text-2xl leading-none font-black tracking-tight">
									{ramo.sigla}
								</div>
								<div class="-mt-1 flex items-center gap-1.5 text-sm font-medium">
									{#if showParalelos}
										<span class="tracking-tight opacity-80">PAR. {ramo.paralelo}</span>
									{/if}
								</div>
							{/if}
						</div>

						{#if showClassType && info.tipo !== TipoBloque.Cátedra}
							{@const typeLabel = formatClassType(info.tipo)}
							{#if typeLabel}
								<div class="absolute right-1 bottom-1 mt-1 {styles.badge()}">
									{typeLabel}
								</div>
							{/if}
						{/if}

						{#if showRooms && info.sala}
							<div class="absolute bottom-1 left-2 text-[10px] font-bold mix-blend-hard-light">
								{info.sala}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>
