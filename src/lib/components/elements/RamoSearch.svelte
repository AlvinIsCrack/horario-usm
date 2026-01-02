<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import { tv } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import Button from '$lib/components/ui/Button.svelte';
	import Search from '$lib/icons/search.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import Paralelos from '$lib/icons/paralelos.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { debounce } from 'lodash';
	import { onMount } from 'svelte';

	const inputStyle = tv({
		base: 'border border-input bg-input rounded-md p-2 w-full transition-colors duration-100 focus:ring-2 focus:ring-ring focus:outline-none'
	});

	const listStyle = tv({
		base: 'absolute z-10 w-full mt-2 bg-popover text-popover-foreground border rounded-md shadow-lg p-1 flex flex-col gap-1'
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

	const updateDebouncedQuery = debounce((query: string) => {
		debouncedQuery = query;
	}, 200);

	$effect(() => {
		updateDebouncedQuery(query);
	});

	const filteredItems = $derived.by(async () => {
		if (disabled) return [];
		const q = debouncedQuery.trim();

		const splittedQuery = q
			.deaccent()
			.toLowerCase()
			.split(/\s+|\*+/g)
			.filter(Boolean);

		return Object.entries(Data.cachedRamos).filter(([k, paralelos]) => {
			for (const s of splittedQuery) {
				if (
					!k.deaccent().toLowerCase().includes(s) &&
					!Object.values(paralelos).at(0)?.nombre.deaccent().toLowerCase().includes(s)
				)
					return false;
			}
			return true;
		});
	});

	$effect(() => {
		highlightedIndex = 0;
		itemNodes = [];
	});

	$effect(() => {
		if (highlightedIndex > 0) {
			itemNodes[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (!filteredItems) return;
		const { key } = event;

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();
			const nextIndex = key === 'ArrowDown' ? highlightedIndex + 1 : highlightedIndex - 1;
			highlightedIndex = (nextIndex + (itemNodes.length || 1)) % (itemNodes.length || 1);
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

	function onItemClicked(item: string) {
		value = item;
		query = '';
		isFocused = false;
		(document.activeElement as HTMLElement)?.blur();
	}
</script>

<div
	class="relative w-full {_class}"
	class:pointer-events-none={disabled}
	class:opacity-50={disabled}
	{...props}
>
	<div class="{inputStyle()} whitespace-nowrap">
		<Search class="mx-1 inline scale-150" />
		<input
			bind:this={_this}
			class="w-full outline-0!"
			bind:value={query}
			{placeholder}
			{disabled}
			role="combobox"
			aria-autocomplete="list"
			aria-controls="listbox-ramo-search"
			aria-expanded={isFocused}
			onfocus={() => !disabled && (isFocused = true)}
			onblur={() => setTimeout(() => (isFocused = false), 100)}
			onkeydown={handleKeydown}
		/>
	</div>

	{#if isFocused}
		<ul class="{listStyle()} max-h-[400px] overflow-y-auto" role="listbox" id="listbox-ramo-search">
			{#await filteredItems}
				<li class="text-muted-foreground p-2 text-sm">Buscando...</li>
			{:then items}
				{#if items.length === 0}
					<li class="text-muted-foreground p-2 text-sm">No hay resultados</li>
				{:else}
					{#each items as item, i (item[0])}
						{@const sigla = item[0]}
						{@const paralelos = Object.values(item[1])}
						{@const ramo = paralelos.at(0)!}
						{@const inHorario = Calendario.hasRamo({ sigla })}

						<li
							bind:this={itemNodes[i]}
							data-sigla={sigla}
							id="option-ramo-search-{i}"
							role="option"
							aria-selected={highlightedIndex === i}
							onmousemove={() => (highlightedIndex = i)}
						>
							<Button
								variant="ghost"
								class="relative h-auto w-full justify-start px-2 py-1.5 text-left font-normal {highlightedIndex ===
								i
									? 'bg-accent'
									: ''} {inHorario ? 'text-orange-400 line-through opacity-50' : ''}"
								onclick={() => onItemClicked(sigla)}
							>
								<Tooltip wrapperClass="absolute! top-0 right-0 m-1" content="Paralelos">
									<Badge icon={Paralelos} class="scale-90 text-sm">
										{paralelos.length}
									</Badge>
								</Tooltip>
								<div class="max-w-3/4">
									<b>{sigla}</b>
									<p class="text-xs">{ramo.nombre}</p>
								</div>
							</Button>
						</li>
					{/each}
				{/if}
			{:catch error}
				<li class="text-destructive p-2 text-sm">Error: {error.message}</li>
			{/await}
		</ul>
	{/if}
</div>
