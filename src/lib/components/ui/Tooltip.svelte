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
		interactive = false, // NUEVA PROPIEDAD
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
		interactive?: boolean; // Propiedad para habilitar interacción
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

	// --- Estado y Lógica ---
	let visible = $state(false);
	let wrapperEl: HTMLDivElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout>;

	// Lógica de apertura inmediata
	function show() {
		clearTimeout(timer);
		visible = true;
	}

	// Lógica de cierre (con delay si es interactivo)
	function hide() {
		if (interactive) {
			timer = setTimeout(() => {
				visible = false;
			}, 150); // 150ms de gracia para mover el cursor
		} else {
			visible = false;
		}
	}
</script>

<div
	class="relative inline-flex {wrapperClass}"
	onpointerenter={show}
	onpointerleave={hide}
	{...closeOnClick ? { onclick: () => (visible = false) } : {}}
	bind:this={wrapperEl}
	{...props}
>
	{@render children?.()}

	<Floating
		trigger={wrapperEl}
		visible={forceVisible || visible}
		{position}
		{offset}
		class="z-[inherit] {tooltip({
			position: followCursor ? undefined : position,
			class: _class as string
		})}"
	>
		<div
			role="presentation"
			onpointerenter={interactive ? show : undefined}
			onpointerleave={interactive ? hide : undefined}
		>
			{#if typeof content === 'string'}
				{content}
			{:else if content}
				{@render content()}
			{/if}
		</div>
	</Floating>
</div>
