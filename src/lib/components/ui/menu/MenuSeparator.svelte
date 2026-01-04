<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	const separatorStyle = tv({
		base: '-mx-1 my-1 h-[2px] bg-muted' // h-[2px] para igualar el grosor del borde del Tooltip si se desea robustez
	});

	let { class: _class, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div role="separator" class={separatorStyle({ class: _class as string })} {...props}></div>
