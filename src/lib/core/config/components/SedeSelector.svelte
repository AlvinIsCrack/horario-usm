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

	// Actualiza el semestre cuando cambia la jornada
	$effect(() => {
		if (lockedLocation) return;
		if (
			selectedSede &&
			selectedJornada &&
			Data.semestres[selectedSede]?.[selectedJornada] &&
			!Data.semestres[selectedSede][selectedJornada].includes(selectedSemestre)
		)
			selectedSemestre = Data.semestres[selectedSede][selectedJornada][0] || '';
	});

	// Sincroniza los estados locales con el store Calendario
	// Este efecto se ejecuta cada vez que cualquiera de las variables de estado cambian
	$effect(() => {
		if (lockedLocation) return;
		Config.sede = selectedSede;
		Config.jornada = selectedJornada;
		Config.semestre = selectedSemestre;
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

	// Determine the semantic status of the selected semester
	const getSemesterStatus = (sem: string) => {
		const today = new Date();
		const currentSem = `${today.getFullYear()}-${today.getMonth() < 7 ? '1' : '2'}`;

		if (sem === currentSem)
			return {
				label: 'Actual',
				color: 'text-emerald-500',
				activeClass: 'border-emerald-500 bg-emerald-500/10'
			};
		if (sem > currentSem)
			return {
				label: 'Futuro',
				color: 'text-blue-500',
				activeClass: 'border-blue-500 bg-blue-500/10'
			};
		return {
			label: 'Pasado',
			color: 'text-amber-500',
			activeClass: 'border-amber-500 bg-amber-500/10'
		};
	};

	const semesterStatus = $derived(selectedSemestre ? getSemesterStatus(selectedSemestre) : null);
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
						<div class="h-full flex-[0.5]">
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
						<div class="h-full flex-1">
							<p class="text-sm">Semestre</p>
							<div class="scrollbar-hide flex w-full snap-x gap-1 overflow-x-auto">
								{#each [...semestres] as sem}
									{@const status = getSemesterStatus(sem)}
									{@const isSelected = selectedSemestre === sem}

									<button
										onclick={() => (selectedSemestre = sem)}
										class="hover:border-accent-foreground! flex flex-1 grow cursor-pointer snap-center flex-col items-start rounded border px-2 py-1 text-left transition-all focus:outline-none
											{isSelected ? status.activeClass : 'bg-muted hover:bg-muted/80 border-transparent'}"
									>
										<span
											class="text-sm font-bold {isSelected
												? 'text-foreground'
												: 'text-muted-foreground'}">{sem}</span
										>
										<span
											class="text-[9px] font-bold tracking-wider uppercase {isSelected
												? status.color
												: 'text-muted-foreground/50'}"
										>
											{status.label}
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
