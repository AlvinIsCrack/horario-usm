<script lang="ts">
	import { Calendario } from '$lib/states/calendario.svelte';
	import Time from '$lib/helpers/time';
	import { TipoBloque } from '$lib/types/horario';
	import { BLOQUE_DURATION_MINUTES } from '$lib/constants/usm';

	let {
		theme = 'light',
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

	// 1. Cálculo de límites (igual que antes)
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

	// 2. Helper para tipos de clase (Filtrar cátedras)
	function formatClassType(type: string = '') {
		const t = type.toUpperCase();
		if (!t || t.includes('CAT') || t === 'C' || t === 'CLA') return null;
		return t.slice(0, 3); // Ej: "LAB", "AYU", "TAL"
	}

	// --- ESTILOS ---
	const styles = {
		light: {
			bg: 'bg-white!',
			text: 'text-slate-950!',
			border: 'border-slate-300!',
			subtext: 'text-slate-500!',
			gridLine: 'bg-black/10!'
		},
		dark: {
			bg: 'bg-[#0f0f11]',
			text: 'text-slate-50',
			border: 'border-slate-800!',
			subtext: 'text-slate-400',
			gridLine: 'bg-white/5'
		},
		bw: {
			bg: 'bg-white!',
			text: 'text-black!',
			border: 'border-black!',
			subtext: 'text-black/60!',
			gridLine: 'bg-black/10!'
		}
	};
	let s = $derived(styles[theme as keyof typeof styles]);
</script>

<div
	id="export-schedule-target"
	class="{s.bg} {s.text} flex w-[1100px] flex-col gap-6 p-10 font-sans antialiased"
>
	<div
		class="flex items-start justify-between gap-8 {s.border} {showHeader
			? 'border-b-2 pb-2'
			: 'pb-1'}"
	>
		{#if showHeader}
			<div class="space-y-1">
				<h1 class="text-4xl font-black tracking-tight uppercase">Horario</h1>
				<p class="{s.subtext} text-sm font-medium tracking-wide uppercase">
					Universidad Técnica Federico Santa María
				</p>
			</div>
		{/if}

		{#if nomenclature === 'codes'}
			<div class="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 self-end">
				{#each Calendario.ramos as ramo}
					<div
						class="flex items-baseline gap-2 border-b text-[10px] leading-tight {s.border} border-dashed pb-0.5"
					>
						<span class="font-bold whitespace-nowrap">{ramo.sigla}</span>
						<span class="{s.subtext} truncate">{ramo.nombre}</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if showHeader}
			<div class="shrink-0 text-right">
				<div class="font-mono text-[10px] {s.subtext} tracking-wider uppercase">Generado el</div>
				<div class="text-sm font-bold uppercase">
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
		class="grid border-t border-l {s.border} w-full"
		style="grid-template-columns: auto repeat({activeDaysIndices.length}, 1fr);"
	>
		<div class="border-r border-b p-2 {s.border}"></div>
		{#each activeDaysIndices as diaIndex}
			<div
				class="border-r border-b py-2 text-center text-xs font-bold tracking-widest uppercase {s.border} {s.gridLine}"
			>
				{DAYS_LABEL[diaIndex]}
			</div>
		{/each}

		{#each blocks as bloque}
			<div
				class="flex w-14 flex-col items-center justify-center border-r border-b p-2 px-3 font-mono text-xs {s.border} {s.subtext} {s.gridLine}"
			>
				<span class="text-sm font-bold">{bloque}º</span>
				<span class="mt-0.5 text-[9px] opacity-60">
					<div>{Time.bloqueToHHMM(bloque)}</div>
					{#if showBloqueEnd}
						<div class="mx-auto scale-150 text-center font-normal tracking-tighter">↓</div>
						<div>{Time.MinutesToHHMM(Time.bloqueToMinutes(bloque) + BLOQUE_DURATION_MINUTES)}</div>
					{/if}
				</span>
			</div>

			{#each activeDaysIndices as dia}
				{@const ramo = Calendario.ramos.find((r) =>
					r.horario.some((h) => h.dia === dia && h.bloque === bloque)
				)}
				{@const info = ramo?.horario.find((h) => h.dia === dia && h.bloque === bloque)}

				<div
					class="relative min-h-[70px] border-r border-b {s.border} flex flex-col items-center justify-center p-1.5 text-center"
				>
					{#if ramo && info}
						<div
							class="absolute inset-0 opacity-15 {theme === 'bw' ? 'bg-slate-300' : ''}"
							style:background-color={theme !== 'bw' ? ramo.color?.hex() : undefined}
						></div>

						<div class="relative z-10 flex w-full flex-col items-center">
							{#if nomenclature === 'detailed'}
								<div class="text-xs leading-tight font-bold">
									{ramo.nombre}
								</div>
								<div
									class="flex flex-wrap justify-center gap-1 text-[9px] font-medium tracking-tight uppercase opacity-80"
								>
									<span
										>{ramo.sigla}
										{#if showParalelos}
											<i>P{ramo.paralelo}</i>
										{/if}
									</span>
									{#if showRooms && info.sala}
										<span class="font-bold">[{info.sala}]</span>
									{/if}
								</div>
							{:else}
								<div class="text-lg leading-none font-black tracking-tight opacity-90">
									{ramo.sigla}
								</div>
								<div class="mt-1 flex items-center gap-1.5 text-[10px] font-medium">
									{#if showParalelos}
										<span class="opacity-70">P{ramo.paralelo}</span>
									{/if}
									{#if showRooms && info.sala}
										<span
											class="rounded {theme === 'dark'
												? 'bg-white/10'
												: 'bg-black/10'} px-1 font-bold">{info.sala}</span
										>
									{/if}
								</div>
							{/if}
						</div>

						{#if showClassType && info.tipo !== TipoBloque.Cátedra}
							{@const typeLabel = formatClassType(info.tipo)}
							{#if typeLabel}
								<div
									class="absolute right-1 bottom-1 mt-1 px-1.5 py-0 text-[10px] font-bold uppercase {s.border} rounded-sm {theme ===
									'dark'
										? 'bg-white/30 text-white'
										: 'bg-black/30 text-black'} "
								>
									{typeLabel}
								</div>
							{/if}
						{/if}
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>
