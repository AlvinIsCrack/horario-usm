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
	import Tooltip from '../ui/Tooltip.svelte';
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';

	let { class: _class, ...props }: HTMLAttributes<HTMLDivElement> = $props();

	let lockedLocation: boolean = $derived(Calendario.lockedLocation);
	let selectedSede: string = $state(Calendario.sede);
	let selectedJornada: string = $state(Calendario.jornada);
	let selectedSemestre: string = $state(Calendario.semestre);

	// Actualiza la jornada y el semestre cuando cambia la sede
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
		Calendario.sede = selectedSede;
		Calendario.jornada = selectedJornada;
		Calendario.semestre = selectedSemestre;
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
	const invalid = $derived(!Calendario.sede);

	let selectedTraslado = $state(Calendario.tiempoTraslado.toString());

	$effect(() => {
		// Sincronizar hacia el store cuando cambia la selección
		Calendario.tiempoTraslado = parseInt(selectedTraslado);
	});

	const trasladoOptions = [
		{ value: '30', label: 'Cerca (30 min)' },
		{ value: '60', label: 'Promedio (1 hr)' },
		{ value: '90', label: 'Lejos (1 hr 30)' },
		{ value: '120', label: 'Viaje largo (2 hrs+)' },
		{ value: '0', label: 'Vivo aquí / Online (0 min)' },
		{ value: '-1', label: 'Prefiero no decirlo' } // Fallback a 60 min internamente
	];
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
							<div class="flex flex-row items-center gap-1 text-sm">
								<p>Jornada</p>
								{#if disabled}
									<Tooltip content="Solo hay una jornada disponible">
										<Lock class="inline" />
									</Tooltip>
								{/if}
							</div>
							<Select
								{disabled}
								class="w-full text-sm"
								items={Data.jornadas[selectedSede].map((jornada) => ({
									value: jornada
								}))}
								bind:value={selectedJornada}
							/>
						</div>
					{/if}
					{#if selectedSede && selectedJornada}
						<div class="h-full w-2/5">
							<p class="text-sm">Semestre</p>
							<Select
								disabled={semestres.length === 1}
								class="w-full text-sm"
								items={semestres.map((s) => ({ value: s }))}
								bind:value={selectedSemestre}
							/>
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

{#if selectedSede && selectedJornada && selectedSemestre}
	<div class="mb-1" transition:fade>
		<div class="mb-1 flex flex-row items-center gap-1 text-sm">
			<MaterialSymbolsNestClockFarsightAnalogOutline
				class="mr-1 inline h-3 w-3 scale-150 opacity-70"
			/>
			<p>Tiempo de Traslado (Ida)</p>
		</div>
		<Select
			class="w-full text-sm"
			items={trasladoOptions}
			bind:value={selectedTraslado}
			placeholder="Selecciona tiempo aproximado..."
		/>
	</div>
{/if}

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
