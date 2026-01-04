<script lang="ts">
	import type { Component } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	const badge = tv({
		base: 'rounded-4xl ring ring-background/50 h-min w-fit py-0.5 px-3 text-xs font-bold border border-input',
		variants: {
			variant: {
				default: 'bg-accent text-accent-foreground',
				danger: 'bg-destructive/50 text-destructive-foreground',
				primary: 'bg-primary text-white shadow-sm/50 ring-transparent',
				success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
				warning: 'bg-amber-500/15 text-amber-700 border-amber-500/20 dark:text-amber-400',
				outline: ''
			}
		}
	});
	let {
		variant = 'default',
		children,
		icon: Icon,
		class: _class,
		...props
	}: {
		variant?: keyof typeof badge.variants.variant;
		icon?: Component;
	} & HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span class="{badge({ variant })} {_class}" {...props}>
	{#if Icon}
		<Icon class="mr-1 inline scale-140" />
	{/if}
	{@render children?.()}
</span>
