<script lang="ts">
	import type { Component } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	// Component slots schema mapping isolated UI regions
	const inputStyles = tv({
		slots: {
			root: 'relative group w-full',
			decorator:
				'text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 transition-colors duration-200 group-focus-within:text-foreground',
			input:
				'border-input hover:border-muted-foreground/50 focus:border-primary placeholder:text-muted-foreground/60 h-10 w-full rounded border bg-transparent pr-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50'
		},
		variants: {
			hasDecorator: {
				true: {
					input: 'pl-10'
				},
				false: {
					input: 'pl-4'
				}
			}
		},
		defaultVariants: {
			hasDecorator: false
		}
	});

	let {
		value = $bindable(),
		startDecorator: StartDecorator,
		class: _class,
		disabled = false,
		el = $bindable(),
		...props
	}: {
		value?: string | number | null;
		el?: HTMLInputElement;
		startDecorator?: Component;
	} & HTMLInputAttributes = $props();

	// Reactive derivation of active slots configuration
	const { root, decorator, input } = $derived(inputStyles({ hasDecorator: !!StartDecorator }));
</script>

<div class={root({ class: _class as string })}>
	{#if StartDecorator}
		<StartDecorator class={decorator()} />
	{/if}

	<input bind:this={el} bind:value {disabled} class={input()} {...props} />
</div>
