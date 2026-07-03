<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Data } from '$lib/data/data.svelte';
	import Moon from '$lib/icons/moon.svelte';
	import Sun from '$lib/icons/sun.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Lock from '$lib/icons/lock.svelte';
	import Warning from '$lib/icons/warning.svelte';
	import { fade } from 'svelte/transition';
	import { Config } from '../store.svelte';

	let { class: _class, ...props }: HTMLAttributes<HTMLDivElement> = $props();

	let lockedLocation: boolean = $derived(Calendario.lockedLocation);
	let selectedSede: string = $state(Config.sede);
	let selectedJornada: string = $state(Config.jornada);
	let selectedSemestre: string = $state(Config.semestre);

	// Actualiza la jornada cuando cambia la sede
	$effect(() => {
		if (lockedLocation) return;
		if (
			selectedSede &&
			Data.jornadas[selectedSede] &&
			!Data.jornadas[selectedSede].includes(selectedJornada)
		)
			selectedJornada = Data.jornadas[selectedSede][0] || '';
	});

	// Updates the semester when the schedule context or available fields change
	$effect(() => {
		if (lockedLocation) return;

		const disponible = Data.semestres[selectedSede]?.[selectedJornada] || [];
		if (selectedSede && selectedJornada && disponible.length > 0) {
			// If the active semester is empty (due to reset/expiration) or no longer valid, select the newest
			if (!selectedSemestre || !disponible.includes(selectedSemestre)) {
				// Business logic: Sort descending to guarantee the latest semester (e.g., '2026-2' > '2026-1') is always at index 0
				const sortedCronologicamente = [...disponible].sort((a, b) => b.localeCompare(a));
				selectedSemestre = sortedCronologicamente[0];
			}
		}
	});

	// Synchronizes local states with the global Config manager
	$effect(() => {
		if (lockedLocation) return;
		Config.sede = selectedSede;
		Config.jornada = selectedJornada;

		// Use setSemestre to trigger the timestamp update only if it actually changed manually
		if (Config.semestre !== selectedSemestre) {
			Config.setSemestre(selectedSemestre);
		}
	});

	let semestres = $derived(
		selectedSede && selectedJornada
			? Data.semestres[selectedSede][selectedJornada].filter((semestreKey: string) => {
					const semestreData = Data.ASIGNATURAS[selectedSede][selectedJornada][semestreKey];
					return semestreData && Object.keys(semestreData).length > 0;
				})
			: []
	);

	type SedeMatcher = [(sede: string) => boolean, string];

	const sedeMap: SedeMatcher[] = [
		[(sede: string) => sede.match(/casa central/gi) !== null, 'campus_casa_central.jpg'], // Mejorado para asegurar boolean
		[(sede: string) => sede.match(/concepci.n/gi) !== null, 'campus_concepcion.jpg'], // Mejorado para asegurar boolean
		[(sede: string) => sede.match(/vitacura/gi) !== null, 'campus_vitacura.jpg'], // Mejorado para asegurar boolean
		[(sede: string) => sede.match(/viña|JMC/gi) !== null, 'campus_viña_del_mar.jpg'], // Mejorado para asegurar boolean
		[(_: string) => true, 'campus_san_joaquin.jpg']
	];

	const sedeImageSrc = $derived(
		(sedeMap.find(([fn]) => fn(selectedSede)) as SedeMatcher)?.[1] || 'campus_san_joaquin.jpg'
	);
	const isVespertina = $derived(selectedJornada === 'Vespertina');
	const invalid = $derived(!Config.sede);
</script>

<div class="relative h-fit w-full opacity-100 duration-400 starting:opacity-0">
	<Card class="{_class} flex flex-col gap-2 overflow-hidden" {...props}>
		<div class="pointer-events-none relative mb-2 h-20 w-full will-change-contents">
			{#if invalid}
				<div
					class="sede-selector-warning-bg absolute top-0 left-0 h-full w-full origin-bottom scale-150 object-cover"
				></div>
				<div
					class="flex h-full w-full flex-col items-center justify-center gap-2 text-center leading-4"
				>
					<Warning class="scale-200" />
					<p class="z-10">Ingresa tu sede, jornada y semestre</p>
				</div>
			{:else}
				{#key sedeImageSrc}
					<img
						transition:fade
						class="absolute top-0 left-0 h-full w-full origin-bottom scale-150 mask-r-from-40% mask-r-to-90% object-cover"
						alt=""
						src={sedeImageSrc}
					/>
				{/key}
			{/if}
		</div>
		{#if lockedLocation}
			<div class="text-xs">
				<Lock class="inline" /> No se puede cambiar la ubicación al tener ramos inscritos en el horario.
			</div>
		{:else}
			<div
				class="flex flex-col gap-2 {lockedLocation
					? 'pointer-events-none opacity-50 grayscale'
					: ''}"
			>
				<div>
					<p class="text-sm">Sede</p>
					<Select
						placeholder="Selecciona una sede..."
						class="w-full"
						items={Data.sedes.map((s) => ({
							value: s
						}))}
						bind:value={selectedSede}
					/>
				</div>
				<div class="flex w-full flex-row justify-between gap-2">
					{#if selectedSede && Data.jornadas[selectedSede]}
						{@const disabled = Data.jornadas[selectedSede].length <= 1}
						<div class="h-full flex-1">
							<p class="text-sm">Jornada</p>
							<Select
								{disabled}
								class="w-full"
								items={Data.jornadas[selectedSede].map((jornada) => ({
									value: jornada
								}))}
								bind:value={selectedJornada}
							/>
						</div>
					{/if}
					{#if selectedSede && selectedJornada && semestres.length > 0}
						<div class="flex flex-2 flex-col">
							<p class="text-sm">Semestre</p>

							<div class="scrollbar-hide flex w-full flex-1 snap-x gap-1 overflow-x-auto">
								{#each [...semestres] as sem}
									{@const isSelected = selectedSemestre === sem}

									<button
										onclick={() => (selectedSemestre = sem)}
										class="hover:border-accent-foreground! flex h-full w-full cursor-pointer snap-center items-center justify-center rounded border px-2 py-1 text-left transition-all focus:outline-none {isSelected &&
											'bg-primary hover:bg-primary/80 border-transparent'}"
									>
										<span
											class="text-sm font-bold {isSelected
												? 'text-foreground'
												: 'text-muted-foreground'}"
										>
											{sem}
										</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</Card>
	{#if !invalid}
		{#key isVespertina}
			{@const Icon = isVespertina ? Moon : Sun}
			<div
				transition:fade
				class="absolute top-0 right-0 m-2 mix-blend-difference drop-shadow-sm drop-shadow-black"
			>
				<Icon class="inline h-20 w-auto" />
			</div>
		{/key}
	{/if}
</div>

<style>
	:global(.sede-selector-warning-bg) {
		background-color: #a00a;
		animation: sede-selector-warning 500ms ease infinite alternate;
	}

	@keyframes -global-sede-selector-warning {
		from {
			background-color: #8008;
		}
	}
</style>
