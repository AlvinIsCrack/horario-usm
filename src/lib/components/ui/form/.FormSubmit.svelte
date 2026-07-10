<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { getFormContext } from './state.svelte';

	type Props = {
		children?: Snippet<[{ isSubmitting: boolean; isValid: boolean }]>;
	} & HTMLButtonAttributes;

	let { children, class: className, disabled, ...props }: Props = $props();

	const form = getFormContext();
</script>

<button type="submit" disabled={disabled || form.isSubmitting} class={className} {...props}>
	{#if children}
		{@render children({ isSubmitting: form.isSubmitting, isValid: form.isValid })}
	{:else}
		{form.isSubmitting ? 'Saving...' : 'Submit'}
	{/if}
</button>
