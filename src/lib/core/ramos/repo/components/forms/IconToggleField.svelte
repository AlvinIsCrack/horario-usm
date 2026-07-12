<script module>
	const iconToggleStyles = tv({
		slots: {
			button:
				'focus-visible:ring-ring flex flex-col items-center justify-end rounded text-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
			iconContainer: 'mb-1 transition-transform duration-200',
			label: 'text-sm leading-none font-semibold transition-colors'
		},
		variants: {
			active: {
				true: {
					button: 'text-foreground',
					iconContainer: 'text-sky-600 drop-shadow-md/20 scale-110',
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
			},
			size: {
				default: {
					button: ''
				},
				sm: {
					iconContainer: 'mb-0.5',
					label: 'text-xs'
				}
			}
		},
		compoundVariants: [
			{
				active: true,
				nullable: true,
				class: {
					button: 'cursor-pointer!'
				}
			},
			{
				active: true,
				nullable: true,
				class: {
					iconContainer: 'text-sky-300'
				}
			}
		],
		defaultVariants: {
			active: false,
			nullable: false,
			size: 'default'
		}
	});

	// Domain-focused interface matching infrastructure requirements
	export interface IconToggleItem {
		value: string;
		label?: string;
		desc?: string;
		tooltip?: string;
		/** Rendered when active state evaluates to true */
		iconOn: Component<any>;
		/** Rendered when active state evaluates to false */
		iconOff: Component<any>;
		/** Badge */
		badge?: Component<any>;
		/** Optional class */
		labelClass?: string;
		containerClass?: string;
	}

	interface Props extends VariantProps<typeof iconToggleStyles> {
		items: IconToggleItem[];
		nullable?: boolean;
		required?: boolean;
		class?: string;
	}
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import { getFormContext, getFieldContext } from '$lib/components/ui/form';
	import ToggleGroup from '$lib/components/ui/ToggleGroup.svelte';
	import { tv, type VariantProps } from 'tailwind-variants';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { cn } from '$lib/utils';
	import { shrinkwrap } from '$lib/helpers/actions';

	let { items, nullable = false, required = true, size, class: _class }: Props = $props();

	const form = getFormContext();
	const id = getFieldContext();
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
	class="w-full gap-4 place-self-center bg-transparent {_class}"
>
	{#snippet itemView({ item, active })}
		{@const typedItem = item as IconToggleItem}
		{@const ActiveIcon = typedItem.iconOn}
		{@const InactiveIcon = typedItem.iconOff}
		{@const styles = iconToggleStyles({ active, nullable, size })}

		<Tooltip content={typedItem.tooltip}>
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
				class={styles.button({ class: ['max-w-24', typedItem.containerClass] })}
			>
				<div class={styles.iconContainer({ class: 'relative' })}>
					{#if active}
						<ActiveIcon class={size === 'sm' ? 'size-6' : 'size-8'} />
					{:else}
						<InactiveIcon class={size === 'sm' ? 'size-6' : 'size-8'} />
					{/if}

					{#if typedItem.badge}
						<div
							class={cn(
								'bg-card absolute -right-1 bottom-0 z-1 rounded-full p-0.5',
								active && 'text-foreground'
							)}
						>
							<typedItem.badge class="size-3 scale-125" />
						</div>
					{/if}
				</div>

				<span
					style:margin-inline="auto"
					class={styles.label({
						class: [size === 'sm' ? '' : 'text-pretty', typedItem.labelClass]
					})}
				>
					{typedItem.label}
				</span>

				{#if typedItem.desc}
					<span
						use:shrinkwrap
						style:margin-inline="auto"
						class={cn(
							'text-muted-foreground/80 max-w-full text-xs leading-tight font-medium text-pretty'
						)}
					>
						{typedItem.desc}
					</span>
				{/if}
			</button>
		</Tooltip>
	{/snippet}
</ToggleGroup>
