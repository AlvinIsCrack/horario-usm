<script lang="ts">
	import { getContext } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	const itemStyle = tv({
		base: 'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		variants: {
			inset: {
				true: 'pl-8'
			}
		}
	});

	let {
		children,
		class: _class,
		onclick,
		inset = false,
		disabled = false,
		...props
	}: HTMLButtonAttributes & {
		inset?: boolean;
	} = $props();

	// Obtener el contexto para cerrar el menú padre
	const menuCtx = getContext<{ close: () => void }>('MENU_CTX');

	function handleClick(e: MouseEvent) {
		if (disabled) return;
		onclick?.(e as any);
		menuCtx?.close(); // Cierra el menú al hacer click
	}
</script>

<button
	class={itemStyle({ inset, class: _class as string })}
	onclick={handleClick}
	{disabled}
	data-disabled={disabled ? true : undefined}
	type="button"
	{...props}
>
	{@render children?.()}
</button>
