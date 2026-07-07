<script module>
	// Current query filter mode applied to search operations
	let filterMode = $state<'none' | 'malla' | 'available'>('none');
</script>

<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import { tv } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import Search from '$lib/icons/search.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import pkg from 'lodash';
	const { debounce } = pkg;
	import Floating from '$lib/components/ui/Floating.svelte';
	import { fade, slide } from 'svelte/transition';
	import { MallaState } from '$lib/core/malla/malla.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { tick, untrack } from 'svelte';
	import { Config } from '$lib/core/config/store.svelte';
	import type { Ramo } from '$lib/core/ramos/types';
	import Tooltip from '../ui/Tooltip.svelte';
	import { cn } from '$lib/utils';
	import SemesterAvailability from './SemesterAvailability.svelte';
	import Input from '../ui/Input.svelte';

	const listStyle = tv({
		base: 'absolute z-50 w-full mt-2 bg-popover text-popover-foreground border rounded-lg shadow-md/50 p-0 flex flex-col max-h-100 overflow-y-auto overflow-x-hidden'
	});
	const itemStyle = tv({
		base: 'relative w-full text-left py-2.5 px-4 transition-all duration-150 border-b border-border/50! group-even:bg-black/40 overflow-hidden hover:cursor-pointer justify-center items-center place-content-center',
		variants: {
			active: {
				true: 'bg-primary/20!'
			},
			tipo: {
				AMBOS: 'to-green-500/40',
				PAR: 'to-amber-400/40',
				IMPAR: 'to-sky-500/40',
				ELECTIVO: 'to-rose-600/40'
			},
			added: {
				true: 'opacity-70 bg-green-500/5 hover:bg-green-500/10 border-green-500/20'
			},
			missingMetadata: {
				true: 'opacity-60 hover:opacity-80 saturated-50 transition-opacity duration-300'
			}
		}
	});
	const GRID_CLASSES = 'grid grid-cols-[100px_4fr_1fr_60px_40px_40px]';

	let {
		this: _this = $bindable(),
		value = $bindable(),
		placeholder = 'Buscar ramo por sigla, nombre...',
		disabled = false,
		class: _class,
		autofocus = false,
		...props
	}: {
		this?: HTMLInputElement;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		autofocus?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	$effect(() => {
		if (autofocus && _this) {
			_this.focus();
		}
	});

	let query = $state('');
	let debouncedQuery = $state('');
	let isFocused = $state(false);
	let highlightedIndex = $state(0);
	let itemNodes: Array<HTMLLIElement> = $state([]);
	let containerEl: HTMLDivElement | undefined = $state();
	// --- Lógica de Malla Interactiva ---
	const mallaState = new MallaState();
	// Opciones del Select con redacción formal
	const filterOptions = [
		{ value: 'none', label: 'Mostrar todos los ramos' },
		{ value: 'malla', label: 'Solo asignaturas de tu carrera' },
		{ value: 'available', label: 'Solo asignaturas matriculables' }
	];
	// Compatibilidad: plan seleccionado y coincidencia de Sede/Jornada
	const isMallaCompatible = $derived(
		!!mallaState.selectedPlanId &&
			mallaState.selectedSede === Config.sede &&
			mallaState.selectedJornada === Config.jornada
	);
	// Resetear filtro si deja de ser compatible
	$effect(() => {
		if (!isMallaCompatible) filterMode = 'none';
	});
	// Guard to prevent autofocus on initial component render
	let isInitialMount = true;
	$effect(() => {
		// Dependency: executes whenever the filter mode changes
		const _ = [filterMode, selectedDepto, selectedTipo];

		untrack(() => {
			// Skip execution on the first render to prevent unwanted autofocus
			if (isInitialMount) {
				isInitialMount = false;
				return;
			}

			// If the filter changed, we assume user interaction.
			// Cancel the closure timeout (in case the option click stole the focus)
			clearTimeout(blurTimeout);

			// Ensure the dropdown state is set to 'open'
			if (!isFocused) isFocused = true;

			// Politely return focus to the input element
			tick().then(() => {
				_this?.focus();
			});
		});
	});
	// Derivados para optimizar la búsqueda
	const allowedSiglas = $derived.by(() => {
		if (!isMallaCompatible) return new Set<string>();
		const s = new Set<string>();
		mallaState.rawMalla.flat().forEach((r) => s.add(r.sigla));
		return s;
	});
	const availableSiglas = $derived.by(() => {
		if (!isMallaCompatible) return new Set<string>();
		const s = new Set<string>();
		// 'available' = ni aprobado (checked) ni bloqueado (locked)
		mallaState.currentMalla.flat().forEach((r) => {
			if (!r.checked && !r.locked) s.add(r.sigla);
		});
		return s;
	});
	const updateDebouncedQuery = debounce((query: string) => {
		debouncedQuery = query;
	}, 200);

	$effect(() => {
		updateDebouncedQuery(query);
	});

	const cachedRamos = Object.entries(Data.cachedRamos);

	// Filter state for Department and Course Type
	let selectedDepto = $state<string>('all');
	let selectedTipo = $state<string>('all');

	// Dynamically extract unique departments from the cached data
	const deptoOptions = $derived.by(() => {
		const deptos = new Set<string>();
		for (const [_, paralelos] of cachedRamos) {
			const ramo = Object.values(paralelos).at(0);
			if (ramo?.departamento) deptos.add(ramo.departamento);
		}
		return [
			{ value: 'all', label: 'Todos los deptos.' },
			...Array.from(deptos)
				.sort()
				.map((d) => ({ value: d, label: d }))
		];
	});

	// Static options based on the Ramo interface definition
	const tipoOptions = [
		{ value: 'all', label: 'Cualquier tipo' },
		{ value: 'PAR', label: 'Ramo Par' },
		{ value: 'IMPAR', label: 'Ramo Impar' },
		{ value: 'AMBOS', label: 'Ramo Par/Impar' },
		{ value: 'ELECTIVO', label: 'Ramo Electivo' }
	];

	/**
	 * Synchronously filters and prioritizes the cached courses data matrix.
	 * Evaluates queries against tags, names, departments, and enrollment criteria.
	 */
	const filteredItems = $derived.by(() => {
		if (disabled) return [];
		const q = debouncedQuery.trim();

		const splittedQuery = q
			.deaccent()
			.toLowerCase()
			.split(/\s+|\*+/g)
			.filter(Boolean);

		const standardResults: (readonly [string, Record<string, Ramo>])[] = [];
		const lowInfoResults: (readonly [string, Record<string, Ramo>])[] = [];

		const entries = cachedRamos;

		for (const [k, paralelos] of entries) {
			if (isMallaCompatible && filterMode !== 'none') {
				if (filterMode === 'malla' && !allowedSiglas.has(k)) continue;
				if (filterMode === 'available' && !availableSiglas.has(k)) continue;
			}

			const ramo = Object.values(paralelos).at(0);
			if (!ramo) continue;

			if (selectedDepto !== 'all' && ramo.departamento && ramo.departamento !== selectedDepto)
				continue;
			if (selectedTipo !== 'all' && ramo.tipoCurricular && ramo.tipoCurricular !== selectedTipo)
				continue;

			let matches = true;
			for (const s of splittedQuery) {
				if (
					!k.deaccent().toLowerCase().includes(s) &&
					!ramo.nombre.deaccent().toLowerCase().includes(s)
				) {
					matches = false;
					break;
				}
			}
			if (matches) {
				const hasLowInfo = !ramo.departamento && !ramo.tipoCurricular;

				if (hasLowInfo) {
					lowInfoResults.push([k, paralelos] as const);
				} else {
					standardResults.push([k, paralelos] as const);
				}
			}
		}

		return [...standardResults, ...lowInfoResults];
	});

	$effect(() => {
		const _ = filteredItems;
		highlightedIndex = 0;
		itemNodes = [];

		tick().then(() => {
			if (itemNodes[0]) itemNodes[0].scrollIntoView({ block: 'nearest' });
		});
	});

	$effect(() => {
		if (highlightedIndex >= 0 && itemNodes[highlightedIndex]) {
			itemNodes[highlightedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	});

	/**
	 * Processes keyboard interaction coordinates for structural accessibility.
	 * Guarantees cycle overflows over computed reference node array lengths.
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (!filteredItems || filteredItems.length === 0) return;
		const { key } = event;

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();
			const nextIndex = key === 'ArrowDown' ? highlightedIndex + 1 : highlightedIndex - 1;
			const len = filteredItems.length;

			highlightedIndex = (nextIndex + len) % len;
		} else if (key === 'Enter') {
			event.preventDefault();
			updateDebouncedQuery.flush();

			if (highlightedIndex > -1 && filteredItems[highlightedIndex]) {
				const targetSigla = filteredItems[highlightedIndex][0];
				onItemClicked(targetSigla);
			}
		} else if (key === 'Escape') {
			isFocused = false;
			(event.target as HTMLElement).blur();
		}
	}

	function handleBlur(event: FocusEvent) {
		const nextFocus = event.relatedTarget as HTMLElement;
		// Si el usuario clickeó algo dentro de nuestro propio buscador/filtros, ignorar el cierre
		if (containerEl?.contains(nextFocus)) return;

		isFocused = false;
	}

	let blurTimeout: any;
	function onItemClicked(sigla: string) {
		clearTimeout(blurTimeout);
		value = sigla;
		query = '';
		isFocused = false;
		_this?.blur();
	}
</script>

<div
	bind:this={containerEl}
	class="relative w-full {_class}"
	class:pointer-events-none={disabled}
	class:opacity-50={disabled}
	{...props}
>
	<Tooltip content="Desplegar catálogo de asignaturas" wrapperClass="w-full! block!">
		<Input
			bind:el={_this}
			bind:value={query}
			startDecorator={Search}
			{placeholder}
			{disabled}
			role="combobox"
			aria-autocomplete="list"
			aria-controls="listbox-ramo-search"
			aria-expanded={isFocused}
			aria-owns="listbox-ramo-search"
			aria-activedescendant={highlightedIndex > -1
				? `option-ramo-search-${highlightedIndex}`
				: undefined}
			onfocus={() => !disabled && (isFocused = true)}
			onblur={handleBlur}
			onkeydown={handleKeydown}
		/>
	</Tooltip>

	<Floating
		trigger={containerEl}
		visible={isFocused}
		position="bottom"
		anchor="start"
		offset={0}
		class="z-50"
	>
		<ul
			transition:fade={{ duration: 200 }}
			class="{listStyle()} h-auto max-h-(--max-h)! min-w-4xl overflow-y-auto"
			style="width: {containerEl?.offsetWidth}px"
			role="listbox"
			id="listbox-ramo-search"
			onmousedown={(e) => {
				// Evita que clicks en la lista (scroll, items vacíos) roben foco
				if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName))
					return;
				e.preventDefault();
			}}
		>
			{#snippet ramoRow(
				sigla: string,
				ramo: Ramo,
				paralelos: Ramo[],
				inHorario: boolean,
				index: number
			)}
				{@const hasLowInfo = !ramo.departamento && !ramo.tipoCurricular}

				<li
					bind:this={itemNodes[index]}
					data-sigla={sigla}
					id="option-ramo-search-{index}"
					role="option"
					aria-selected={highlightedIndex === index}
					onmousemove={() => (highlightedIndex = index)}
					class="group list-none"
				>
					<button
						class="{itemStyle({
							active: highlightedIndex === index,
							added: inHorario,
							tipo: (ramo?.tipoCurricular ?? '').toUpperCase() as any,
							missingMetadata: hasLowInfo
						})} {GRID_CLASSES} items-center gap-4 text-sm"
						onmousedown={(e) => {
							e.preventDefault();
							onItemClicked(sigla);
						}}
					>
						<span class="font-mono text-base font-normal tracking-wider tabular-nums" title={sigla}>
							{sigla}
						</span>

						<span class="text-muted-foreground truncate text-left font-medium" title={ramo.nombre}>
							{ramo.nombre}
						</span>

						<span
							class="text-muted-foreground/70 truncate text-left text-xs"
							title={ramo.departamento
								? `DEPTO. DE ${ramo.departamento}`
								: 'Sin departamento asignado'}
						>
							{ramo.departamento ?? 'Sin depto.'}
						</span>

						{#if ramo.tipoCurricular}
							<SemesterAvailability curricularType={ramo.tipoCurricular} />
						{:else}
							<span class="text-muted-foreground/40 text-center text-xs italic select-none"
								>Sin datos</span
							>
						{/if}

						<span class="text-right font-medium *:w-full">
							{#if paralelos.length}
								<div
									class={cn([
										'text-muted-foreground text-right font-mono tracking-tight tabular-nums',
										paralelos.length >= 3 && 'text-foreground'
									])}
								>
									{paralelos.length}
								</div>
							{:else}
								&mdash;
							{/if}
						</span>

						<span
							class={cn([
								'text-right font-mono font-medium tracking-tight tabular-nums',
								ramo.creditos === 0 && 'text-muted-foreground',
								ramo.creditos! > 0 && ramo.creditos! < 5 && 'text-muted-foreground',
								ramo.creditos! >= 5 && ramo.creditos! < 7 && 'text-foreground',
								ramo.creditos! >= 7 && 'font-black'
							])}
						>
							{#if ramo.creditos === null || ramo.creditos === undefined}
								&mdash;
							{:else}
								<Tooltip content="{ramo.creditos} Créditos SCT">
									{ramo.creditos}
								</Tooltip>
							{/if}
						</span>
					</button>
				</li>
			{/snippet}

			<div
				class="bg-card sticky top-0 z-10 flex flex-col gap-1 rounded-tl-lg border-b pt-2 text-sm"
			>
				<div class="flex w-full flex-row items-center justify-end gap-2 px-2">
					<button onmousedown={(e) => e.preventDefault()}>
						<Select items={deptoOptions} bind:value={selectedDepto} size="sm" class="min-w-36" />
					</button>

					<button onmousedown={(e) => e.preventDefault()}>
						<Select items={tipoOptions} bind:value={selectedTipo} size="sm" class="min-w-36" />
					</button>

					{#if isMallaCompatible}
						<button transition:slide={{ axis: 'x' }} onmousedown={(e) => e.preventDefault()}>
							<Select
								items={filterOptions}
								bind:value={filterMode}
								size="sm"
								class="min-w-xs"
								placeholder="Filtrar búsqueda..."
							/>
						</button>
					{/if}
				</div>

				<div class="w-full"></div>

				<div
					class="text-primary-foreground/60 bg-primary/60 {GRID_CLASSES} gap-4 border-t px-4 py-1 text-xs *:my-auto *:leading-tight"
				>
					<span>Sigla</span>
					<span>Asignatura</span>
					<span>Departamento</span>
					<span class="text-center">Tipo</span>
					<span class="block justify-self-end text-right">Núm. Paralelos</span>
					<span class="text-right">SCT</span>
				</div>
			</div>

			{#if filteredItems.length === 0}
				<li class="text-muted-foreground p-4 text-sm">
					{#if query}
						No hay resultados para lo que introduciste. Revisa en SIGA horarios del semestre {Config.semestre},
						y comprueba si el ramo que buscas tiene registrado horario para ese semestre.
					{:else}
						Escribe para empezar a filtrar ramos.
					{/if}
				</li>
			{:else}
				{#each filteredItems as item, i (item[0])}
					{@const sigla = item[0]}
					{@const paralelos = Object.values(item[1])}
					{@const ramo = paralelos.at(0)!}
					{@const inHorario = Calendario.hasRamo({ sigla })}

					{@render ramoRow(sigla, ramo, paralelos, inHorario, i)}
				{/each}
			{/if}

			<div class="sr-only" aria-live="polite" aria-atomic="true">
				{#if filteredItems.length > 0 && isFocused}
					{filteredItems.length} asignaturas encontradas.
				{/if}
			</div>
		</ul>
	</Floating>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	.highlight {
		&.secondary {
			color: var(--color-amber-500);
		}

		&.tertiary {
			color: oklch(0.5 0.2 25);
		}

		color: var(--color-primary);
		@apply font-medium! mix-blend-plus-lighter;
	}
</style>
