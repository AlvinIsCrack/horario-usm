<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setFieldContext } from './state.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		/** Unique identifier matching the schema property */
		name: string;
		class?: string;
		children: Snippet;
	}

	let { name, class: className, children }: Props = $props();

	// Establishes a localized context boundary for this specific field
	setFieldContext(name);
</script>

<div class={cn('group/field', className)}>
	{@render children()}
</div>
