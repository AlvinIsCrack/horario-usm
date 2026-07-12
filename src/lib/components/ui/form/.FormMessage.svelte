<script lang="ts">
	import { getFormContext, getFieldContext } from './state.svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	const form = getFormContext();
	const fieldName = getFieldContext();

	// Reactive subscription to the specific field's error state
	const errorMessage = $derived(form.getFieldError(fieldName));
</script>

{#if errorMessage}
	<p
		transition:slide={{ axis: 'y', duration: 200 }}
		class="text-destructive text-xs font-medium {className}"
	>
		{errorMessage}
	</p>
{/if}
