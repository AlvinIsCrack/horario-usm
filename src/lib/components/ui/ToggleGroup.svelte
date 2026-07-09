<script lang="ts">
	import { tv } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Component, Snippet } from 'svelte';

	// Definimos los estilos con Tailwind Variants
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

	// Tipado flexible para los items (pueden ser strings simples u objetos)
	type ItemValue = string | number;
	type ItemObj = {
		value: ItemValue;
		label?: string;
		icon?: Component;
		disabled?: boolean;
		metadata?: any;
	};

	let {
		items = [],
		value = $bindable(),
		type = 'single',
		nullable = false,
		variant = 'default',
		size = 'default',
		justified = false,
		class: _class,
		labelView,
		...props
	}: {
		items: (ItemValue | ItemObj)[];
		value?: ItemValue | ItemValue[] | null;
		type?: 'single' | 'multiple';
		nullable?: boolean;
		variant?: 'default' | 'outline';
		size?: 'default' | 'sm' | 'lg';
		justified?: boolean;
		labelView?: Snippet<[ItemObj]>;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'type'> = $props();

	const { root, item: itemStyle } = toggleGroupStyles({ variant, size, justified });

	// Normalizamos los items a objetos
	const parsedItems = $derived(
		items.map((i) =>
			typeof i === 'object' && i !== null && 'value' in i
				? (i as ItemObj)
				: ({ value: i, label: String(i) } as ItemObj)
		)
	);

	function handleSelect(itemValue: ItemValue) {
		if (type === 'single') {
			if (value === itemValue) {
				if (nullable) value = null;
			} else {
				value = itemValue;
			}
		} else {
			// Lógica Multiple
			const current = Array.isArray(value) ? value : [];
			if (current.includes(itemValue)) {
				value = current.filter((v) => v !== itemValue);
			} else {
				value = [...current, itemValue];
			}
		}
	}

	function isChecked(v: ItemValue) {
		if (type === 'single') return value === v;
		return Array.isArray(value) && value.includes(v);
	}
</script>

{#snippet defaultLabelView(item: ItemObj)}
	{#if item.label}
		{item.label}
	{:else}
		{item.value}
	{/if}
{/snippet}

<div class={root({ class: _class as string })} role="group" {...props}>
	{#each parsedItems as item (item.value)}
		{@const checked = isChecked(item.value)}
		<button
			type="button"
			class={itemStyle()}
			data-state={checked ? 'on' : 'off'}
			disabled={item.disabled}
			onclick={() => handleSelect(item.value)}
		>
			{#if item.icon}
				<item.icon class="mr-2 size-4" />
			{/if}

			{@render (labelView ?? defaultLabelView)(item)}
		</button>
	{/each}
</div>
