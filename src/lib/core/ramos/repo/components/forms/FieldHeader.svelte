<script lang="ts">
	import { ramoFormVariants } from '../../RamoForm.svelte';

	interface Props {
		title?: string;
		description: string;
		htmlFor: string;
		optional?: boolean;
	}

	let { title, description, htmlFor, optional = false }: Props = $props();

	const styles = ramoFormVariants({});
</script>

<div>
	{#if title}
		<label aria-required={!optional} for={htmlFor} class={styles.label()}>
			{title}
			<span class:hidden={optional} class="h-full text-amber-400" title="Requerido">*</span>
		</label>
	{/if}
	<small id="{htmlFor}-help" class={styles.description({ class: 'block' })}>
		{description}
	</small>
</div>
