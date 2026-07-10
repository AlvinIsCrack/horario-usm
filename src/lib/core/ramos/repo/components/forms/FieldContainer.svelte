<script lang="ts">
	import { getFormContext } from '$lib/components/ui/form/state.svelte';
	import type { Snippet } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	interface Props {
		/** The unique identifier matching the field state key */
		id?: string;
		styles: any;
		children?: Snippet;
	}

	let { id, styles, children }: Props = $props();

	const form = id ? getFormContext() : null;

	// Reactive derivation checking whether the current field has a valid answer
	const isAnswered = $derived(
		id &&
			form &&
			form.values[id] !== undefined &&
			form.values[id] !== null &&
			form.values[id] !== ''
	);
</script>

<div
	transition:slide={{ axis: 'y' }}
	class="group w-full transition-all not-last:mb-2 starting:mb-0"
>
	<div
		transition:fade|global
		class={styles.container({
			class: [
				isAnswered ? 'to-primary/20! group-odd:to-primary/40! bg-linear-to-r from-transparent' : ''
			]
		})}
	>
		{@render children?.()}
	</div>
</div>
