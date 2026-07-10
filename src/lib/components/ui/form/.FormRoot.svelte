<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setFormContext, type FormStateManager } from './state.svelte';

	type Props = {
		manager: FormStateManager<any>;
		children?: Snippet;
	};

	let { manager, children }: Props = $props();

	// Expose the state manager instance to all descendants down the DOM tree
	setFormContext(manager);
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		manager.submit();
	}}
>
	{@render children?.()}
</form>
