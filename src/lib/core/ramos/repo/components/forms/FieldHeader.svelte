<script lang="ts">
	interface Props {
		title?: string;
		description: string;
		htmlFor: string;
		styles: {
			label: (config?: { class?: string }) => string;
			description: (config?: { class?: string }) => string;
		};
	}

	let { title, description, htmlFor, styles }: Props = $props();
</script>

<div>
	{#if title}
		<label for={htmlFor} class={styles.label({})}>{title}</label>
	{/if}
	<small id="{htmlFor}-help" class={styles.description({ class: 'mt-0 block' })}>
		{description}
	</small>
</div>
