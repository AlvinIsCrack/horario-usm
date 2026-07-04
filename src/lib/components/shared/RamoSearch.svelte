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

	const listStyle = tv({
		base: 'absolute z-50 w-full mt-2 bg-popover text-popover-foreground border rounded-lg shadow-md/50 p-0 flex flex-col max-h-100 overflow-y-auto overflow-x-hidden'
	});

	const itemStyle = tv({
		base: 'relative w-full text-left py-2.5 px-4 transition-all duration-150 border-b border-border/50! group-even:bg-black/40 overflow-hidden hover:cursor-pointer',
		variants: {
			active: {
				true: 'bg-primary/20! brightness-125'
			},
			tipo: {
				AMBOS: 'to-green-500/40',
				PAR: 'to-amber-400/40',
				IMPAR: 'to-sky-500/40',
				ELECTIVO: 'to-rose-600/40'
			},
			added: {
				true: 'opacity-70 bg-green-500/5 hover:bg-green-500/10 border-green-500/20'
			}
		}
	});

	let {
		this: _this = $bindable(),
		value = $bindable(),
		placeholder = 'Buscar ramo...',
		disabled = false,
		class: _class,
		...props
	}: {
		this?: HTMLInputElement;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	let query = $state('');
	let debouncedQuery = $state('');

	let isFocused = $state(false);
	let highlightedIndex = $state(0);
	let itemNodes: Array<HTMLLIElement> = $state([]);
	let containerEl: HTMLDivElement | undefined = $state();

	// --- Lógica de Malla Interactiva ---
	const mallaState = new MallaState();

	// Estado del filtro: 'none' | 'malla' | 'available'
	let filterMode = $state<'none' | 'malla' | 'available'>('none');

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

	$effect(() => {
		// Dependencia: se ejecuta cuando cambia el modo de filtro
		const _ = [filterMode];

		untrack(() => {
			// Si cambió el filtro, asumimos interacción del usuario.
			// Cancelamos el timeout de cierre (si el click en la opción robó el foco)
			clearTimeout(blurTimeout);

			// Aseguramos que el estado sea 'abierto'
			if (!isFocused) isFocused = true;

			// Devolvemos el foco al input amablemente
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

	const filteredItems = $derived.by(async () => {
		if (disabled) return [];
		const q = debouncedQuery.trim();

		const splittedQuery = q
			.deaccent()
			.toLowerCase()
			.split(/\s+|\*+/g)
			.filter(Boolean);

		let count = 0;
		const results = [];
		const entries = cachedRamos;

		for (const [k, paralelos] of entries) {
			// --- Lógica de Filtro ---
			if (isMallaCompatible && filterMode !== 'none') {
				if (filterMode === 'malla' && !allowedSiglas.has(k)) continue;
				if (filterMode === 'available' && !availableSiglas.has(k)) continue;
			}

			const ramo = Object.values(paralelos).at(0);
			if (!ramo) continue;

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
				results.push([k, paralelos] as const);
				count++;
			}
		}
		return results;
	});

	$effect(() => {
		// Reset index on query change
		highlightedIndex = 0;
		// Wait for render update then scroll
		if (itemNodes[0]) itemNodes[0].scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		if (highlightedIndex >= 0 && itemNodes[highlightedIndex]) {
			itemNodes[highlightedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (!filteredItems) return;
		const { key } = event;

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();
			const nextIndex = key === 'ArrowDown' ? highlightedIndex + 1 : highlightedIndex - 1;
			const len = itemNodes.length || 1; // Corrección menor: usar length de nodos o items
			highlightedIndex = (nextIndex + len) % len;
		} else if (key === 'Enter') {
			event.preventDefault();
			if (highlightedIndex > -1) {
				onItemClicked(itemNodes[highlightedIndex]?.dataset.sigla ?? '');
			}
		} else if (key === 'Escape') {
			isFocused = false;
			(event.target as HTMLElement).blur();
		}
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
	<div class="relative">
		<Search
			class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
		/>
		<input
			bind:this={_this}
			class="border-input placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border bg-transparent pr-4 pl-9 text-sm transition-all focus-visible:ring-1 focus-visible:outline-none"
			bind:value={query}
			{placeholder}
			{disabled}
			role="combobox"
			aria-autocomplete="list"
			aria-controls="listbox-ramo-search"
			aria-expanded={isFocused}
			onfocus={() => !disabled && (isFocused = true)}
			onblur={() => (blurTimeout = setTimeout(() => (isFocused = false), 100))}
			onkeydown={handleKeydown}
		/>
	</div>

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
			class="{listStyle()} h-auto max-h-(--max-h)! min-w-3xl overflow-y-auto"
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
			{#snippet ramoRow(sigla: string, ramo: Ramo, inHorario: boolean, index: number)}
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
							tipo: (ramo?.tipoCurricular ?? '').toUpperCase() as any
						})} grid grid-cols-[100px_3fr_1fr_1fr_50px] items-center gap-4 text-sm"
						onmousedown={(e) => {
							e.preventDefault();
							onItemClicked(sigla);
						}}
					>
						<span class="font-mono text-base tracking-wider tabular-nums" title={sigla}>
							{sigla}
						</span>

						<span class="text-muted-foreground truncate text-left font-medium" title={ramo.nombre}>
							{ramo.nombre}
						</span>

						{#if ramo.tipoCurricular}
							{@const isImpar = ramo.tipoCurricular === 'IMPAR' || ramo.tipoCurricular === 'AMBOS'}
							{@const isPar = ramo.tipoCurricular === 'PAR' || ramo.tipoCurricular === 'AMBOS'}
							{@const isElectivo = ramo.tipoCurricular === 'ELECTIVO'}

							{@const tooltipText = isElectivo
								? 'Ramo Electivo'
								: `Disponible en ${isImpar ? 'semestres impares' : ''}${isImpar && isPar ? ' y ' : ''}${isPar ? 'semestres pares' : ''}`}

							{@const segmentBase = cn(
								'h-3 w-3 min-h-3 min-w-3 aspect-square rounded-full border transition-colors text-center text-[11px] text-primary-foreground/60'
							)}

							<span>
								<Tooltip content={tooltipText} wrapperClass="w-full">
									<span class="flex w-full flex-row items-center justify-center gap-1">
										{#if isElectivo}
											<span class="scale-110 text-center font-mono text-base font-light"> # </span>
										{:else}
											<div class="{segmentBase} {isImpar ? 'bg-primary' : ''}"></div>
											<div class="{segmentBase} {isPar ? 'bg-primary/80 -hue-rotate-5' : ''}"></div>
										{/if}
									</span>
								</Tooltip>
							</span>
						{:else}
							<span class="text-center"> &mdash; </span>
						{/if}

						<span
							class="text-muted-foreground/70 truncate text-left text-xs"
							title="DEPTO. DE {ramo.departamento}"
						>
							{ramo.departamento ?? 'N/A'}
						</span>

						<span
							class="text-right font-mono tracking-tight tabular-nums"
							class:opacity-40={ramo.creditos === 0}
							class:opacity-60={ramo.creditos! > 0 && ramo.creditos! < 5}
							class:opacity-80={ramo.creditos! >= 5 && ramo.creditos! < 7}
							class:font-bold={ramo.creditos! >= 7}
							class:text-sky-300={ramo.creditos! < 7}
							class:text-primary={ramo.creditos! >= 7}
						>
							{#if ramo.creditos === null || ramo.creditos === undefined}
								&mdash;
							{:else}
								<span title="Créditos SCT">
									{ramo.creditos}
								</span>
							{/if}
						</span>
					</button>
				</li>
			{/snippet}

			<div class="bg-card sticky top-0 z-10 rounded-tl-lg border-b p-3 pb-0 text-sm">
				<p>
					Para el semestre <span class="highlight">{Config.semestre}</span> hay
					<span class="highlight">{cachedRamos.length}</span> ramos registrados.
				</p>

				{#await filteredItems then items}
					<div transition:slide={{ axis: 'y' }} class="flex flex-col gap-0.5">
						{#if query.length && cachedRamos.length !== items.length}
							<p>
								Actualmente filtrando <span class="highlight secondary">{items.length}</span> ramos.
							</p>
						{/if}

						{#if filterMode === 'malla'}
							<p>
								Mostrando <span class="highlight tertiary">{items.length}</span> ramos de tu carrera.
							</p>
						{:else if filterMode === 'available'}
							<p>
								Mostrando <span class="highlight tertiary">{items.length}</span> ramos matriculables
								de tu carrera.
							</p>
						{/if}
					</div>
				{/await}

				{#if isMallaCompatible}
					<button
						transition:slide={{ axis: 'y' }}
						class="w-full py-2"
						onmousedown={(e) => e.preventDefault()}
					>
						<Select
							items={filterOptions}
							bind:value={filterMode}
							class="w-full"
							placeholder="Filtrar búsqueda..."
						/>
					</button>
				{/if}

				<div
					class="text-primary-foreground/60 bg-primary/60 -mx-3 grid grid-cols-[100px_3fr_1fr_1fr_50px] gap-4 border-t px-4 py-2 text-xs"
				>
					<span>Sigla</span>
					<span>Asignatura</span>
					<span class="text-center">Tipo</span>
					<span>Departamento</span>
					<span class="text-right">Créditos</span>
				</div>
			</div>

			{#await filteredItems}
				<li class="text-muted-foreground animate-pulse p-4 text-center text-sm">
					Buscando asignaturas...
				</li>
			{:then items}
				{#if items.length === 0}
					<li class="text-muted-foreground p-4 text-sm">
						{#if query}
							No hay resultados para lo que introduciste. Revisa en SIGA horarios del semestre {Config.semestre},
							y comprueba si el ramo que buscas tiene registrado horario para ese semestre.
						{:else}
							Escribe para empezar a filtrar ramos.
						{/if}
					</li>
				{:else}
					{#each items as item, i (item[0])}
						{@const sigla = item[0]}
						{@const paralelos = Object.values(item[1])}
						{@const ramo = paralelos.at(0)!}
						{@const inHorario = Calendario.hasRamo({ sigla })}

						{@render ramoRow(sigla, ramo, inHorario, i)}
					{/each}
				{/if}
			{:catch error}
				<li class="text-destructive p-2 text-sm">Error: {error.message}</li>
			{/await}
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
