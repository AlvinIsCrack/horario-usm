<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';
	import Floating from '$lib/components/ui/Floating.svelte';
	import Down from '$lib/icons/down.svelte';

	// Estilos del Trigger (Botón principal)
	const selectTrigger = tv({
		base: 'flex w-full items-center justify-between rounded border border-input bg-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer transition-all',
		variants: {
			open: {
				true: 'ring-2 ring-ring ring-offset-2'
			},
			disabled: {
				false: '',
				true: 'cursor-not-allowed opacity-50'
			},
			size: {
				default: 'h-10 px-3 py-2 text-sm',
				sm: 'h-8 px-2 text-xs rounded gap-1'
			}
		},
		defaultVariants: {
			size: 'default'
		}
	});

	// Estilos del Contenedor del Menú
	const optionsWrapper = tv({
		base: 'relative z-50 min-w-full w-max overflow-hidden rounded border bg-popover text-popover-foreground shadow-md outline-none'
	});

	// Estilos de cada Opción
	const optionItem = tv({
		base: 'relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 transition-colors',
		variants: {
			selected: {
				true: 'bg-accent/50 text-accent-foreground font-medium'
			}
		}
	});

	let {
		placeholder,
		value = $bindable(''),
		items,
		disabled = false,
		size,
		class: _class,
		...props
	}: Omit<HTMLSelectAttributes, 'size'> & {
		items: { label?: string; value: string }[];
		size?: keyof typeof selectTrigger.variants.size;
	} = $props();

	// Estado interno
	let open = $state(false);
	let triggerRef: HTMLDivElement | undefined = $state();
	let menuRef: HTMLDivElement | undefined = $state();

	// Label derivado (busca el label asociado al value actual)
	let selectedLabel = $derived(
		items.find((i) => i.value === value)?.label ??
			items.find((i) => i.value === value)?.value ??
			placeholder ??
			'Seleccionar...'
	);

	function handleSelect(newValue: string) {
		value = newValue;
		open = false;
	}

	// Cierre al hacer click fuera (similar a Menu.svelte)
	function handleWindowClick(event: MouseEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (triggerRef && !triggerRef.contains(target) && menuRef && !menuRef.contains(target)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="relative w-full">
	<div
		bind:this={triggerRef}
		role="combobox"
		aria-controls="select-options"
		aria-expanded={open}
		aria-haspopup="listbox"
		tabindex={disabled ? -1 : 0}
		class={selectTrigger({ open, size, disabled: disabled ?? false, class: _class as string })}
		onclick={() => !disabled && (open = !open)}
		onkeydown={(e) => {
			if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				open = !open;
			}
		}}
	>
		<span class="truncate {value ? '' : 'text-muted-foreground'}">
			{selectedLabel}
		</span>
		<Down class="h-4 w-4 opacity-50 transition-transform {open ? 'rotate-180' : ''}" />
	</div>

	<select bind:value class="hidden" {disabled} {...props}>
		{#if placeholder}
			<option value="" disabled selected>{placeholder}</option>
		{/if}
		{#each items as item}
			<option value={item.value}>{item.label ?? item.value}</option>
		{/each}
	</select>

	<Floating
		trigger={triggerRef}
		visible={open}
		position="bottom"
		anchor="start"
		offset={5}
		class="z-[inherit]"
	>
		<div
			bind:this={menuRef}
			id="select-options"
			class={optionsWrapper()}
			style="width: {triggerRef?.offsetWidth}px"
			role="listbox"
		>
			<div class="scroller max-h-75 overflow-y-auto p-1">
				{#if items.length === 0}
					<div class="text-muted-foreground py-2 text-center text-sm">Sin opciones</div>
				{:else}
					{#each items as item (item.value)}
						<div
							role="option"
							aria-selected={item.value === value}
							tabindex="0"
							class={optionItem({ selected: item.value === value })}
							onclick={() => handleSelect(item.value)}
							onkeydown={(e) => e.key === 'Enter' && handleSelect(item.value)}
						>
							<span class="truncate">{item.label ?? item.value}</span>

							{#if item.value === value}
								<span
									class="text-primary absolute right-2 flex h-3.5 w-3.5 items-center justify-center"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="h-4 w-4"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</span>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</Floating>
</div>

<style>
	/* Scrollbar minimalista para el dropdown */
	.scroller::-webkit-scrollbar {
		width: 4px;
	}
	.scroller::-webkit-scrollbar-track {
		background: transparent;
	}
	.scroller::-webkit-scrollbar-thumb {
		background-color: rgba(156, 163, 175, 0.3);
		border-radius: 4px;
	}
	.scroller::-webkit-scrollbar-thumb:hover {
		background-color: rgba(156, 163, 175, 0.5);
	}
</style>
