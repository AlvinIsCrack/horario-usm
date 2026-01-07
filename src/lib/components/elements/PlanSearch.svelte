<script lang="ts">
	import { tv } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import Search from '$lib/icons/search.svelte';
	import pkg from 'lodash';
	const { debounce } = pkg;
	import Floating from '$lib/components/ui/Floating.svelte';
	import { fade, slide } from 'svelte/transition';

	// --- Estilos idénticos a RamoSearch ---
	const inputStyle = tv({
		base: 'border border-input bg-input rounded-md p-2 w-full transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:outline-none flex items-center gap-2 shadow-sm'
	});

	const listStyle = tv({
		base: 'absolute z-50 w-full mt-2 bg-popover text-popover-foreground border rounded-lg shadow-md/50 p-1 flex flex-col gap-1 max-h-[400px] overflow-y-auto overflow-x-hidden'
	});

	const itemStyle = tv({
		base: 'relative w-full text-left p-2 px-4 rounded-md transition-all duration-150 border border-transparent group overflow-hidden hover:cursor-pointer',
		variants: {
			active: {
				true: 'bg-accent/50 border-accent'
			},
			selected: {
				true: 'opacity-70 bg-primary/5 hover:bg-primary/10 border-primary/20'
			}
		}
	});

	let {
		value = $bindable(''),
		items = [], // { label: string, value: string }[]
		placeholder = 'Buscar carrera o plan...',
		disabled = false,
		class: _class,
		...props
	}: {
		value?: string;
		items: Array<{ label: string; value: string; plan: string; }>;
		placeholder?: string;
		disabled?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	let query = $state('');
	let debouncedQuery = $state('');
	let isFocused = $state(false);
	let highlightedIndex = $state(0);
	let containerEl: HTMLDivElement | undefined = $state();
	let itemNodes: Array<HTMLElement> = $state([]);
	let inputEl: HTMLInputElement | undefined = $state();

	const updateDebouncedQuery = debounce((q: string) => {
		debouncedQuery = q;
	}, 200);

	$effect(() => {
		updateDebouncedQuery(query);
	});

	// Filtrado de planes avanzado (Lógica RamoSearch)
	const filteredItems = $derived.by(() => {
		if (disabled) return [];
		const q = debouncedQuery.trim();

		if (!q) return items;

		// Separamos la búsqueda en términos, normalizamos acentos y minúsculas
		const splittedQuery = q
			.deaccent()
			.toLowerCase()
			.split(/\s+|\*+/g)
			.filter(Boolean);

		return items.filter((item) => {
			// Normalizamos los datos del item para comparar
			const normalizedLabel = item.label.deaccent().toLowerCase();
			const normalizedValue = item.value.deaccent().toLowerCase();

			// "AND" Lógico: Todos los términos escritos deben coincidir
			// ya sea en el nombre (label) o en el ID (value)
			return splittedQuery.every((s) => normalizedLabel.includes(s) || normalizedValue.includes(s));
		});
	});
	// Reset de scroll y highlight
	$effect(() => {
		// Al cambiar el filtrado, reseteamos el índice
		highlightedIndex = 0;
		// Scroll al inicio
		if (itemNodes[0]) itemNodes[0].scrollIntoView({ block: 'nearest' });
	});

	$effect(() => {
		if (isFocused && highlightedIndex >= 0 && itemNodes[highlightedIndex]) {
			itemNodes[highlightedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		const { key } = event;

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();
			const nextIndex = key === 'ArrowDown' ? highlightedIndex + 1 : highlightedIndex - 1;
			const len = filteredItems.length || 1;
			highlightedIndex = (nextIndex + len) % len;
		} else if (key === 'Enter') {
			event.preventDefault();
			if (filteredItems[highlightedIndex]) {
				selectItem(filteredItems[highlightedIndex]);
			}
		} else if (key === 'Escape') {
			isFocused = false;
			(event.target as HTMLElement).blur();
		}
	}

	function selectItem(item: { label: string; value: string }) {
		value = item.value;
		query = ''; // Limpiar búsqueda al seleccionar, o dejar item.label si prefieres
		isFocused = false;
		inputEl?.blur();
	}

	// Etiqueta del plan seleccionado para mostrar placeholder dinámico
	const currentLabel = $derived(items.find((i) => i.value === value)?.label || '');
</script>

<div
	bind:this={containerEl}
	class="relative w-full {_class}"
	class:pointer-events-none={disabled}
	class:opacity-50={disabled}
	{...props}
>
	<div class={inputStyle()}>
		<Search class="text-muted-foreground h-5 w-5 shrink-0" />
		<input
			bind:this={inputEl}
			class="placeholder:text-muted-foreground/70 w-full bg-transparent outline-none"
			bind:value={query}
			placeholder={currentLabel || placeholder}
			{disabled}
			role="combobox"
			aria-autocomplete="list"
			aria-controls="listbox-plan-search"
			aria-expanded={isFocused}
			onfocus={() => !disabled && (isFocused = true)}
			onblur={() => setTimeout(() => (isFocused = false), 100)}
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
			class="{listStyle()} h-auto max-h-[var(--max-h)] min-w-lg overflow-y-auto"
			style="width: {containerEl?.offsetWidth}px"
			role="listbox"
			id="listbox-plan-search"
		>
			<div class="relative p-3 px-4 text-sm">
				<p>
					Hay <span class="highlight">{items.length}</span> planes de estudio disponibles.
				</p>
				{#if query.length}
					{#if items.length !== filteredItems.length}
						<p transition:slide={{ axis: 'y' }}>
							Filtrando <span class="highlight secondary">{filteredItems.length}</span> resultados.
						</p>
					{/if}
				{/if}
				<div
					class="border-border relative bottom-0 mt-auto w-full translate-y-2 scale-x-200 border-b"
				></div>
			</div>

			{#if filteredItems.length === 0}
				<li class="text-muted-foreground p-4 text-sm">
					No se encontraron planes para esa búsqueda.
				</li>
			{:else}
				{#each filteredItems as item, i (item.value)}
					{@const planCode = item.plan ?? item.label.match(/\(Plan\s(\d+)\)$/)?.[1]}

					<li
						bind:this={itemNodes[i]}
						role="option"
						aria-selected={highlightedIndex === i}
						onmousemove={() => (highlightedIndex = i)}
						class="list-none"
					>
						<button
							class={itemStyle({
								active: highlightedIndex === i,
								selected: value === item.value
							})}
							onmousedown={(e) => {
								e.preventDefault();
								selectItem(item);
							}}
						>
							<div class="flex flex-col gap-0.5 text-left">
								<p class="text-sm leading-tight">
									{item.label.replace(/\s\(Plan\s\d+\)$/, '')}
								</p>

								{#if planCode}
									<p class="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
										Plan de estudios: {planCode}
									</p>
								{/if}
							</div>
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	</Floating>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.highlight {
		&.secondary {
			color: var(--color-amber-500);
		}

		color: var(--color-primary);
		@apply font-medium! mix-blend-plus-lighter;
	}

	ul {
		/* Estilos generales para navegadores basados en Webkit (Chrome, Safari, Edge) */
		&::-webkit-scrollbar {
			@apply w-2;
		}

		&::-webkit-scrollbar-track {
			@apply bg-transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: var(--color-muted-foreground);
			@apply rounded-full border-2 border-transparent bg-clip-content;

			&:hover {
				background: var(--color-muted-foreground);
			}
		}

		/* Soporte básico para Firefox */
		scrollbar-color: var(--color-muted-foreground) transparent;
	}
</style>
