<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';
	import Floating from '$lib/components/ui/Floating.svelte';

	const menuStyle = tv({
		base: 'min-w-[8rem] overflow-hidden rounded-md border-2 bg-popover p-1 text-popover-foreground shadow-md/50 focus:outline-none'
	});

	let {
		children,
		trigger,
		open = $bindable(false),
		position = 'bottom',
		align = 'center', // Mapeado a 'anchor' en Floating
		offset = 6,
		class: _class,
		...props
	}: {
		children: Snippet;
		trigger: Snippet;
		open?: boolean;
		position?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		offset?: number;
	} & HTMLAttributes<HTMLDivElement> = $props();

	let triggerRef: HTMLDivElement | undefined = $state();
	let menuRef: HTMLDivElement | undefined = $state();

	// Compartir función de cierre con los items
	setContext('MENU_CTX', {
		close: () => (open = false)
	});

	// Manejo de click outside
	function handleWindowClick(event: MouseEvent) {
		if (!open) return;
		const target = event.target as Node;

		// Si el click no fue en el trigger ni en el menú (que está en un portal), cerrar.
		// Nota: Floating usa portal, así que menuRef no es hijo directo de triggerRef en el DOM.
		if (triggerRef && !triggerRef.contains(target) && menuRef && !menuRef.contains(target)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div
	bind:this={triggerRef}
	class="inline-flex w-fit cursor-pointer"
	onclick={() => (open = !open)}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && (open = !open)}
>
	{@render trigger()}
</div>

<Floating trigger={triggerRef} visible={open} {position} anchor={align} {offset} class="z-50">
	<div
		bind:this={menuRef}
		class={menuStyle({ class: _class as string })}
		role="menu"
		tabindex="-1"
		{...props}
	>
		{@render children()}
	</div>
</Floating>
