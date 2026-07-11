<script lang="ts">
	interface Props {
		title?: string;
		description: string;
		htmlFor: string;
		optional?: boolean;
		styles: {
			label: (config?: { class?: string }) => string;
			description: (config?: { class?: string }) => string;
		};
	}

	let { title, description, htmlFor, styles, optional = false }: Props = $props();
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
