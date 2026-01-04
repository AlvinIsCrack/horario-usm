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
	<polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
	<polyline points="17 18 23 18 23 12" />
</svg>
