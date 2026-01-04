<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	const headerStyle = tv({
		base: 'px-2 py-1.5 text-xs font-semibold text-muted-foreground select-none'
	});

	let { children, class: _class, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div class={headerStyle({ class: _class as string })} {...props}>
	{@render children?.()}
</div>
