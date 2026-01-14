<script lang="ts" module>
	// Contador global para gestionar el apilamiento de diálogos anidados
	let globalZIndex = 100;
</script>

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

	// Estado local para el z-index de esta instancia
	let zIndex = $state(100);
	let wasOpen = false;

	// Detectamos la apertura antes de pintar para asignar el z-index correcto
	$effect.pre(() => {
		if (open && !wasOpen) {
			globalZIndex += 2; // Incrementamos en 2 (capa overlay + capa contenido)
			zIndex = globalZIndex;
		}
		wasOpen = open;
	});

	// --- Estilos Base (Se eliminaron z-[100] y z-[101]) ---
	const overlayStyle = tv({
		base: 'fixed inset-0 pointer-events-auto bg-black/60'
	});
	const contentStyle = tv({
		base: 'fixed left-[50%] text-left top-[50%] pointer-events-auto grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 rounded-xl overflow-hidden md:w-full'
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
		use:portal={'dialogs-portal'}
		transition:fade={{ duration: 150 }}
		class={overlayStyle()}
		style="z-index: {zIndex};"
		onclick={handleClose}
		role="button"
		tabindex="-1"
		aria-hidden="true"
	></div>

	<button
		tabindex={0}
		use:portal={'dialogs-portal'}
		transition:scale={{ start: 0.95, duration: 150, easing: cubicOut }}
		class="{contentStyle()} {_class}"
		style="z-index: {zIndex + 1};"
		role="alertdialog"
		aria-modal="true"
		onclick={(e) => e.stopPropagation()}
	>
		{@render children?.()}
	</button>
{/if}
