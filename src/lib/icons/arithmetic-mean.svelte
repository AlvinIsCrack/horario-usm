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
	<path d="M6 4L18 4" />

	<path d="M7 19L17 9" />
	<path d="M17 19L7 9" />
</svg>
