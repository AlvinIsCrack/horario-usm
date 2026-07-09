<script lang="ts" generics="T">
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Component, Snippet } from 'svelte';

	const toggleGroupStyles = tv({
		slots: {
			root: 'flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground gap-1',
			item: 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground'
		},
		variants: {
			variant: {
				default: {
					item: 'cursor-pointer hover:bg-background/50 data-[state=on]:bg-primary data-[state=on]:text-foreground data-[state=on]:border'
				},
				outline: {
					root: 'bg-transparent border p-0 gap-0 divide-x rounded-md overflow-hidden',
					item: 'rounded-none border-none hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground'
				}
			},
			size: {
				default: { item: 'h-8 px-3' },
				sm: { item: 'h-7 px-2 text-xs' },
				lg: { item: 'h-10 px-3' }
			},
			justified: {
				true: {
					root: 'w-full',
					item: 'flex-1'
				},
				false: {
					root: 'w-fit'
				}
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
			justified: false
		}
	});

	type ItemValue = string | number;

	type ItemObj<T> = {
		value: ItemValue;
		label?: string;
		icon?: Component;
		disabled?: boolean;
		metadata?: T;
	};

	interface ToggleGroupProps extends VariantProps<typeof toggleGroupStyles> {
		/** The list of options to be rendered. Each can be a simple value or an object with label/icon. */
		items: (ItemValue | ItemObj<T>)[];
		/** The currently selected value(s). Bindable to parent state. */
		value?: ItemValue | ItemValue[] | null;
		/** Determines if the group allows selecting only one item or multiple items simultaneously. */
		type?: 'single' | 'multiple';
		/** If true, allows deselecting the active item in 'single' mode. */
		nullable?: boolean;
		/** If true, the root container fills the parent width and items expand equally. */
		justified?: boolean;
		/** The name attribute for the underlying hidden input, used for native form data submission. */
		name?: string;
		/** If true, ensures at least one item must be selected for form submission. */
		required?: boolean;
		/** If true, disables all interactions for the entire toggle group. */
		disabled?: boolean;
		/** An optional Svelte snippet for custom rendering of each toggle item's content. */
		labelView?: Snippet<[ItemObj<T> & { index: number }]>;
	}

	let {
		items = [],
		value = $bindable(),
		type = 'single',
		nullable = false,
		variant = 'default',
		size = 'default',
		justified = false,
		class: _class,
		name,
		required = false,
		disabled = false,
		labelView,
		...props
	}: ToggleGroupProps & Omit<HTMLAttributes<HTMLDivElement>, 'type'> = $props();

	const { root, item: itemStyle } = toggleGroupStyles({ variant, size, justified });

	/**
	 * Normalizes input items into a consistent object structure.
	 */
	const parsedItems = $derived(
		items.map(
			(i): ItemObj<T> =>
				typeof i === 'object' && i !== null && 'value' in i
					? (i as ItemObj<T>)
					: ({ value: i, label: String(i) } as ItemObj<T>)
		)
	);

	// Multi-value evaluation for native form binding state
	const valuesArray = $derived(Array.isArray(value) ? value : value != null ? [value] : []);

	// Fast validation check for the native hidden element state
	const hasSelection = $derived(valuesArray.length > 0);

	/**
	 * Handles selection logic based on group type (single vs multiple).
	 */
	function handleSelect(itemValue: ItemValue) {
		if (disabled) return;

		if (type === 'single') {
			if (value === itemValue) {
				if (nullable) value = null;
			} else {
				value = itemValue;
			}
		} else {
			const current = Array.isArray(value) ? value : [];
			if (current.includes(itemValue)) {
				value = current.filter((v) => v !== itemValue);
			} else {
				value = [...current, itemValue];
			}
		}
	}

	/**
	 * Determines if a specific value is currently selected.
	 */
	function isChecked(v: ItemValue) {
		if (type === 'single') return value === v;
		return Array.isArray(value) && value.includes(v);
	}
</script>

{#snippet defaultLabelView(item: ItemObj<T>)}
	{#if item.label}
		{item.label}
	{:else}
		{item.value}
	{/if}
{/snippet}

<div class={root({ class: _class as string })} role="group" {...props}>
	{#if name}
		{#if type === 'single'}
			<input type="hidden" {name} {required} {disabled} value={value ?? ''} />
		{:else}
			{#if required && !hasSelection}
				<input type="hidden" {name} required {disabled} value="" />
			{/if}
			{#each valuesArray as singleValue}
				<input type="hidden" {name} {disabled} value={singleValue} />
			{/each}
		{/if}
	{/if}

	{#each parsedItems as item, index (item.value)}
		{@const checked = isChecked(item.value)}
		<button
			type="button"
			class={itemStyle()}
			data-state={checked ? 'on' : 'off'}
			disabled={disabled || item.disabled}
			onclick={() => handleSelect(item.value)}
		>
			{#if item.icon}
				<item.icon class="mr-2 size-4" />
			{/if}

			{@render (labelView ?? defaultLabelView)({ ...item, index })}
		</button>
	{/each}
</div>
