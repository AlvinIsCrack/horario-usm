<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { tv } from 'tailwind-variants';
	import { portal } from '$lib/helpers/actions';

	let {
		open = $bindable(false),
		class: _class = '',
		children,
		onclose
	}: {
		open?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
		onclose?: () => void;
	} = $props();

	// --- Estilos Base ---
	const overlayStyle = tv({
		base: 'fixed inset-0 pointer-events-auto z-[100] bg-black/60'
	});

	const contentStyle = tv({
		base: 'fixed left-[50%] top-[50%] pointer-events-auto z-[101] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 rounded-xl overflow-hidden md:w-full'
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			handleClose();
		}
	}

	function handleClose() {
		if (onclose) {
			onclose();
		} else {
			open = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		use:portal
		transition:fade={{ duration: 150 }}
		class={overlayStyle()}
		onclick={handleClose}
		role="button"
		tabindex="-1"
		aria-hidden="true"
	></div>

	<div
		use:portal
		transition:scale={{ start: 0.95, duration: 150, easing: cubicOut }}
		class="{contentStyle()} {_class}"
		role="alertdialog"
		aria-modal="true"
		onclick={(e) => e.stopPropagation()}
	>
		{@render children?.()}
	</div>
{/if}
