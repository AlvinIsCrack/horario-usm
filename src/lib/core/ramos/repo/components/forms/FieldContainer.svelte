<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	interface Props {
		styles: any;
		children?: Snippet;
	}

	let { styles, children }: Props = $props();
</script>

<div
	transition:slide={{ axis: 'y' }}
	class="group w-full transition-all not-last:mb-2 starting:mb-0"
>
	<div transition:fade|global class={styles.container()}>
		{@render children?.()}
	</div>
</div>
