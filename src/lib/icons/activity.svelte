<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	let { class: _class, ...props }: SVGAttributes<SVGElement> = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={_class}
	{...props}
>
	<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
</svg>
