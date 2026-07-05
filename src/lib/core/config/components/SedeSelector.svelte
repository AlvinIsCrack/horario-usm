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

	// Automatically update the session period or shift when the chosen campus changes
	$effect(() => {
		if (lockedLocation) return;
		if (
			selectedSede &&
			Data.jornadas[selectedSede] &&
			!Data.jornadas[selectedSede].includes(selectedJornada)
		) {
			selectedJornada = Data.jornadas[selectedSede][0] || '';
		}
	});

	// Updates the target academic semester based on the selected campus and shift context
	$effect(() => {
		if (lockedLocation) return;

		const disponible = Data.semestres[selectedSede]?.[selectedJornada] || [];
		if (selectedSede && selectedJornada && disponible.length > 0) {
			if (!selectedSemestre || !disponible.includes(selectedSemestre)) {
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
		[(sede: string) => sede.match(/casa central/gi) !== null, 'campus_casa_central.jpg'],
		[(sede: string) => sede.match(/concepci.n/gi) !== null, 'campus_concepcion.jpg'],
		[(sede: string) => sede.match(/vitacura/gi) !== null, 'campus_vitacura.jpg'],
		[(sede: string) => sede.match(/viña|JMC/gi) !== null, 'campus_viña_del_mar.jpg'],
		[(_: string) => true, 'campus_san_joaquin.jpg']
	];

	const sedeImageSrc = $derived(
		(sedeMap.find(([fn]) => fn(selectedSede)) as SedeMatcher)?.[1] || 'campus_san_joaquin.jpg'
	);
	const isVespertina = $derived(selectedJornada === 'Vespertina');
	const invalid = $derived(!Config.sede);
</script>

{#snippet warningState()}
	<div
		class="sede-selector-warning-bg absolute top-0 left-0 h-full w-full origin-bottom scale-150 object-cover"
	></div>
	<div
		class="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center leading-4"
	>
		<Warning class="scale-200 text-amber-500" />
		<p class="z-10 text-sm font-medium">Por favor, selecciona tu sede y jornada para comenzar</p>
	</div>
{/snippet}

{#snippet selectorFields()}
	<div
		class="flex flex-col gap-2 {lockedLocation ? 'pointer-events-none opacity-50 grayscale' : ''}"
	>
		<div>
			<p class="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
				Sede Universitaria
			</p>
			<Select
				placeholder="Selecciona tu sede..."
				class="w-full"
				items={Data.sedes.map((s) => ({ value: s }))}
				bind:value={selectedSede}
			/>
		</div>
		<div class="flex w-full flex-row justify-between gap-2">
			{#if selectedSede && Data.jornadas[selectedSede]}
				{@const disabled = Data.jornadas[selectedSede].length <= 1}
				<div class="h-full flex-1">
					<p class="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
						Jornada
					</p>
					<Select
						{disabled}
						class="w-full"
						items={Data.jornadas[selectedSede].map((jornada) => ({ value: jornada }))}
						bind:value={selectedJornada}
					/>
				</div>
			{/if}
			{#if selectedSede && selectedJornada && semestres.length > 0}
				<div class="flex flex-2 flex-col">
					<p class="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
						Semestre
					</p>
					<div class="scrollbar-hide flex w-full flex-1 snap-x gap-1 overflow-x-auto">
						{#each [...semestres] as sem}
							{@const isSelected = selectedSemestre === sem}
							<button
								onclick={() => (selectedSemestre = sem)}
								class="hover:border-accent-foreground! relative flex h-full w-full cursor-pointer snap-center items-center justify-center rounded border px-2 py-1 text-left transition-all focus:outline-none {isSelected
									? 'bg-primary hover:bg-primary/80 border-transparent'
									: ''}"
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
{/snippet}

<div class="relative h-fit w-full opacity-100 duration-400 starting:opacity-0">
	<Card class="{_class} flex flex-col gap-2 overflow-hidden" {...props}>
		<div class="pointer-events-none relative mb-2 h-20 w-full will-change-contents">
			{#if invalid}
				{@render warningState()}
			{:else}
				{#key sedeImageSrc}
					<img
						transition:fade
						class="absolute top-0 left-0 h-full w-full origin-bottom scale-150 mask-r-from-40% mask-r-to-90% object-cover"
						alt="Campus Background Image"
						src={sedeImageSrc}
					/>
				{/key}
			{/if}
		</div>

		{#if lockedLocation}
			<div
				class="flex items-center gap-1.5 rounded bg-amber-500/10 p-2 text-xs font-medium text-amber-600 dark:text-amber-400"
			>
				<Lock class="inline shrink-0" />
				<span
					>No es posible modificar la ubicación actual porque ya posees asignaturas inscritas en tu
					horario.</span
				>
			</div>
		{:else}
			{@render selectorFields()}
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
