<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import Floating from './Floating.svelte';

	let {
		children,
		content,
		position = 'bottom',
		followCursor = false,
		disablePortal = false,
		class: _class,
		offset = 8,
		wrapperClass,
		forceVisible = false,
		...props
	}: {
		wrapperClass?: ClassValue;
		content?: string | Snippet;
		position?: 'top' | 'bottom' | 'left' | 'right';
		followCursor?: boolean;
		disablePortal?: boolean;
		offset?: number;
		forceVisible?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const tooltip = tv({
		base: 'fixed w-max font-light max-w-xs text-center rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-sm/50',
		variants: {
			position: {
				top: 'bottom-full left-1/2',
				bottom: 'top-full left-1/2',
				left: 'right-full top-1/2',
				right: 'left-full top-1/2'
			}
		}
	});

	// --- Estado y Referencias ---
	let visible = $state(false);
	let wrapperEl: HTMLDivElement | undefined = $state();
</script>

<div
	class="relative inline-flex {wrapperClass}"
	onpointerenter={() => (visible = true)}
	onpointerleave={() => (visible = false)}
	bind:this={wrapperEl}
>
	{@render children?.()}

	<Floating
		trigger={wrapperEl}
		{visible}
		{position}
		{offset}
		class={tooltip({ position: followCursor ? undefined : position }) + ' ' + _class}
	>
		{#if typeof content === 'string'}
			{content}
		{:else if content}
			{@render content()}
		{/if}
	</Floating>
</div>
