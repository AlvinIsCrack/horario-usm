<script lang="ts" generics="T">
	import { tv, type VariantProps } from 'tailwind-variants';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Component, Snippet } from 'svelte';

	const toggleGroupStyles = tv({
		slots: {
			root: 'group group/togglegroup flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground gap-1',
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
				},
				unstyled: {
					root: '',
					item: ''
				}
			},
			size: {
				default: {},
				sm: { item: 'px-2.5 py-1 text-xs' },
				lg: { item: 'px-5 py-2 text-base' }
			},
			justified: {
				true: { root: 'w-full', item: 'flex-1' },
				false: {}
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
			justified: false
		}
	});

	type ItemValue = T extends PropertyKey ? T : string;

	interface ItemObj<V> {
		value: V;
		label?: string;
		[key: string]: any;
	}

	type ToggleGroupVariants = VariantProps<typeof toggleGroupStyles>;

	interface BaseProps extends HTMLAttributes<HTMLDivElement>, ToggleGroupVariants {
		name?: string;
		required?: boolean;
		disabled?: boolean;
		nullable?: boolean;
		items: ItemObj<ItemValue>[];
		labelView?: Snippet<[ItemObj<ItemValue> & { index: number }]>;
		/** Custom item renderer snippet to bypass standard pill design */
		itemView?: Snippet<[{ item: ItemObj<ItemValue>; active: boolean; index: number }]>;
	}

	interface SingleProps extends BaseProps {
		type?: 'single';
		value?: ItemValue | null;
		onValueChange?: (value: ItemValue | null) => void;
	}

	interface MultipleProps extends BaseProps {
		type: 'multiple';
		value?: ItemValue[];
		onValueChange?: (value: ItemValue[] | null) => void;
	}

	type Props = SingleProps | MultipleProps;

	let {
		class: className,
		variant = 'default',
		size = 'default',
		justified = false,
		type = 'single',
		value = $bindable(),
		onValueChange,
		name,
		required = false,
		disabled = false,
		nullable = false,
		items = [],
		labelView,
		itemView,
		...props
	}: Props = $props();

	const slotClasses = $derived(() => toggleGroupStyles({ variant, size, justified }));
	const valuesArray = $derived(Array.isArray(value) ? value : []);
	const hasSelection = $derived(
		type === 'single' ? value !== null && value !== undefined : valuesArray.length > 0
	);

	function handleSelect(itemValue: ItemValue) {
		if (disabled) return;

		if (type === 'single') {
			if (value === itemValue) {
				if (nullable) value = null;
			} else {
				value = itemValue;
			}
			onValueChange?.(value);
		} else {
			const current = Array.isArray(value) ? value : [];
			if (current.includes(itemValue)) {
				value = current.filter((v) => v !== itemValue);
			} else {
				value = [...current, itemValue];
			}
			onValueChange?.(value);
		}
	}

	function isChecked(v: ItemValue) {
		if (type === 'single') return value === v;
		return Array.isArray(value) && value.includes(v);
	}
</script>

{#snippet defaultLabelView(item: ItemObj<ItemValue> & { index: number })}
	{#if item.label}
		{item.label}
	{:else}
		{String(item.value)}
	{/if}
{/snippet}

<div class={slotClasses().root({ class: className as string })} role="group" {...props}>
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

	{#each items as item, index (item.value)}
		{@const active = isChecked(item.value)}
		{#if itemView}
			{@render itemView({ item, active, index })}
		{:else}
			<button
				type="button"
				role={type === 'single' ? 'radio' : 'checkbox'}
				aria-checked={active}
				disabled={disabled || item.disabled}
				data-state={active ? 'on' : 'off'}
				class={slotClasses().item()}
				onclick={() => handleSelect(item.value)}
			>
				{#if labelView}
					{@render labelView({ ...item, index })}
				{:else}
					{@render defaultLabelView({ ...item, index })}
				{/if}
			</button>
		{/if}
	{/each}
</div>
