<script lang="ts">
	import type { Component } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	const cornerBadge = tv({
		base: 'absolute z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border drop-shadow-md/50 font-bold',
		variants: {
			variant: {
				default: 'bg-accent text-accent-foreground',
				danger: 'bg-destructive/90 text-destructive-foreground',
				primary: 'bg-primary text-primary-foreground',
				success: 'bg-emerald-500 text-white shadow-emerald-900/20',
				warning: 'bg-amber-500 text-white shadow-amber-900/20',
				outline: 'bg-background border border-input'
			},
			position: {
				'top-left': 'top-0 left-0 rounded-br-lg rounded-tl-[inherit] border-r border-b',
				'top-right': 'top-0 right-0 rounded-bl-lg rounded-tr-[inherit] border-l border-b',
				'bottom-left': 'bottom-0 left-0 rounded-tr-lg rounded-bl-[inherit] border-r border-t',
				'bottom-right': 'bottom-0 right-0 rounded-tl-lg rounded-br-[inherit] border-l border-t'
			}
		},
		defaultVariants: {
			variant: 'default',
			position: 'bottom-right'
		}
	});

	let {
		variant = 'default',
		position = 'bottom-right',
		children,
		icon: Icon,
		class: _class,
		...props
	}: {
		variant?: keyof typeof cornerBadge.variants.variant;
		position?: keyof typeof cornerBadge.variants.position;
		icon?: Component;
	} & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={cornerBadge({ variant, position, class: _class as string })} {...props}>
	{#if Icon}
		<Icon class="size-3.5 scale-125" />
	{/if}
	{@render children?.()}
</div>
