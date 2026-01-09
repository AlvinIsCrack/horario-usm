<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';
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
		closeOnClick = true,
		...props
	}: {
		wrapperClass?: ClassValue;
		content?: string | Snippet;
		position?: 'top' | 'bottom' | 'left' | 'right';
		followCursor?: boolean;
		disablePortal?: boolean;
		offset?: number;
		closeOnClick?: boolean;
		forceVisible?: boolean;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const tooltip = tv({
		base: 'fixed w-max border-2 max-w-xs! text-center font-normal rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md/50',
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
	{...closeOnClick ? { onclick: () => (visible = false) } : {}}
	bind:this={wrapperEl}
	{...props}
>
	{@render children?.()}

	<Floating
		trigger={wrapperEl}
		{visible}
		{position}
		{offset}
		class="z-[inherit] {tooltip({
			position: followCursor ? undefined : position,
			class: _class as string
		})}"
	>
		{#if typeof content === 'string'}
			{content}
		{:else if content}
			{@render content()}
		{/if}
	</Floating>
</div>
