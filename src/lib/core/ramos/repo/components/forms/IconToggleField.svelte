<script lang="ts">
	import type { Component } from 'svelte';
	import type { FormStateManager } from '$lib/components/ui/form';
	import ToggleGroup from '$lib/components/ui/ToggleGroup.svelte';

	// Domain-focused interface matching infrastructure requirements
	interface IconToggleItem {
		value: string;
		label: string;
		desc?: string;
		/** Rendered when active state evaluates to true */
		iconOn: Component<any>;
		/** Rendered when active state evaluates to false */
		iconOff: Component<any>;
	}

	interface Props {
		id: string;
		form: FormStateManager<any>;
		items: IconToggleItem[];
		nullable?: boolean;
		required?: boolean;
	}

	let { id, form, items, nullable = false, required = true }: Props = $props();
</script>

<ToggleGroup
	variant="unstyled"
	type="single"
	name={id}
	{nullable}
	{required}
	{items}
	value={form.values[id]}
	onValueChange={(val) => form.setFieldValue(id, val)}
	class="w-full gap-2 bg-transparent"
>
	{#snippet itemView({ item, active })}
		{@const typedItem = item as IconToggleItem}
		{@const ActiveIcon = typedItem.iconOn}
		{@const InactiveIcon = typedItem.iconOff}

		<button
			type="button"
			role="radio"
			aria-checked={active}
			onclick={() => {
				if (active && nullable) {
					form.setFieldValue(id, null);
				} else {
					form.setFieldValue(id, typedItem.value);
				}
			}}
			class="focus-visible:ring-ring flex min-w-20 flex-col items-center justify-end rounded text-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50
				{active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground cursor-pointer'}"
		>
			<div
				class="mb-1 transition-transform duration-200 {active
					? 'text-primary scale-110'
					: 'text-muted-foreground'}"
			>
				{#if active}
					<ActiveIcon class="size-8" />
				{:else}
					<InactiveIcon class="size-8" />
				{/if}
			</div>

			<span
				class="text-sm leading-none font-semibold transition-colors {active
					? 'text-foreground'
					: 'text-muted-foreground'}"
			>
				{typedItem.label}
			</span>

			{#if typedItem.desc}
				<p class="text-muted-foreground mt-1 max-w-[180px] text-[11px] leading-tight">
					{typedItem.desc}
				</p>
			{/if}
		</button>
	{/snippet}
</ToggleGroup>
