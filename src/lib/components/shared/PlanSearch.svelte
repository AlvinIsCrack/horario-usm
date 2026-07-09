<script lang="ts">
	import { tv } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import Search from '$lib/icons/search.svelte';
	import Floating from '$lib/components/ui/Floating.svelte';
	import { fade, slide } from 'svelte/transition';
	import { SearchMatcher } from '$lib/helpers/search';
	import { createDebouncedState } from '$lib/helpers/debouce.svelte';
	import Input from '../ui/Input.svelte';

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
		items = [],
		placeholder = 'Buscar carrera o plan...',
		disabled = false,
		class: _class,
		...props
	}: {
		value?: string;
		items: Array<{ label: string; value: string; plan: string }>;
		placeholder?: string;
		disabled?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const searchQuery = createDebouncedState('', 200);

	let isFocused = $state(false);
	let highlightedIndex = $state(0);
	let containerEl: HTMLDivElement | undefined = $state();
	let itemNodes: Array<HTMLElement> = $state([]);
	let inputEl: HTMLInputElement | undefined = $state();

	const matcher = new SearchMatcher<{ label: string; value: string; plan: string }>({
		extractors: [(item) => item.label, (item) => item.value, (item) => item.plan]
	});

	const filteredItems = $derived.by(() => {
		if (disabled) return [];
		return matcher.filter(items, searchQuery.debounced);
	});

	$effect(() => {
		highlightedIndex = 0;
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
			searchQuery.flush();
			if (filteredItems[highlightedIndex]) selectItem(filteredItems[highlightedIndex]);
		} else if (key === 'Escape') {
			isFocused = false;
			(event.target as HTMLElement).blur();
		}
	}

	function selectItem(item: { label: string; value: string }) {
		value = item.value;
		searchQuery.current = '';
		searchQuery.flush();
		isFocused = false;
		inputEl?.blur();
	}

	const currentLabel = $derived(items.find((i) => i.value === value)?.label || '');
</script>

<div
	bind:this={containerEl}
	class="relative w-full {_class}"
	class:pointer-events-none={disabled}
	class:opacity-50={disabled}
	{...props}
>
	<Input
		bind:el={inputEl}
		bind:value={searchQuery.current}
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
		onblur={() => setTimeout(() => (isFocused = false), 100)}
		onkeydown={handleKeydown}
	/>

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
			class="{listStyle()} h-auto max-h-(--max-h) min-w-[300px] overflow-y-auto"
			style="width: {containerEl?.offsetWidth}px"
			role="listbox"
			id="listbox-plan-search"
		>
			<div class="relative p-3 px-4 text-sm">
				<p>Hay <span class="highlight">{items.length}</span> planes de estudio disponibles.</p>
				{#if searchQuery.current.length}
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
		scrollbar-color: var(--color-muted-foreground) transparent;
	}
</style>
