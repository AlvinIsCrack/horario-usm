<script module>
	const iconToggleStyles = tv({
		slots: {
			button:
				'focus-visible:ring-ring flex min-w-20 flex-col items-center justify-end rounded text-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
			iconContainer: 'mb-1 transition-transform duration-200',
			label: 'text-sm leading-none font-semibold transition-colors'
		},
		variants: {
			active: {
				true: {
					button: 'text-foreground',
					iconContainer: 'text-primary brightness-125 drop-shadow-md/20 scale-110',
					label: 'text-foreground'
				},
				false: {
					button:
						'text-muted-foreground hover:text-foreground cursor-pointer group-has-data-[state=on]:opacity-80',
					iconContainer: 'text-current',
					label: 'text-current'
				}
			},
			nullable: {
				true: {},
				false: {}
			}
		},
		compoundVariants: [
			{
				active: true,
				nullable: true,
				class: {
					button: 'cursor-pointer!'
				}
			}
		],
		defaultVariants: {
			active: false,
			nullable: false
		}
	});
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import type { FormStateManager } from '$lib/components/ui/form';
	import ToggleGroup from '$lib/components/ui/ToggleGroup.svelte';
	import { tv } from 'tailwind-variants';

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
		{@const styles = iconToggleStyles({ active, nullable })}

		<button
			type="button"
			role="radio"
			aria-checked={active}
			data-state={active ? 'on' : 'off'}
			onclick={() => {
				if (active && nullable) {
					form.setFieldValue(id, null);
				} else {
					form.setFieldValue(id, typedItem.value);
				}
			}}
			class={styles.button()}
		>
			<div class={styles.iconContainer()}>
				{#if active}
					<ActiveIcon class="size-8" />
				{:else}
					<InactiveIcon class="size-8" />
				{/if}
			</div>

			<span class={styles.label()}>
				{typedItem.label}
			</span>

			{#if typedItem.desc}
				<p class="text-muted-foreground max-w-45 text-[11px] leading-tight font-medium">
					{typedItem.desc}
				</p>
			{/if}
		</button>
	{/snippet}
</ToggleGroup>
