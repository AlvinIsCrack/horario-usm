<script lang="ts" module>
	// Contador global para gestionar el apilamiento de diálogos anidados
	let globalZIndex = 100;
</script>

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { tv } from 'tailwind-variants';
	import { portal } from '$lib/helpers/actions';
	import type { Snippet } from 'svelte';
	import CancelClose from '$lib/icons/cancel-close.svelte';

	let {
		open = $bindable(false),
		showCloseButton = true, // Permite ocultar el botón en diálogos obligatorios
		closable = true, // Permite deshabilitar el cierre por completo (tecla Esc o click fuera)
		onclose, // Callback para que el padre valide o ejecute lógica al intentar cerrar
		children,
		class: className = ''
	}: {
		open: boolean;
		showCloseButton?: boolean;
		closable?: boolean;
		onclose?: () => void;
		children: Snippet;
		class?: string;
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
		base: 'fixed left-[50%] text-left top-[50%] pointer-events-auto grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-md/50 duration-200 rounded-md overflow-hidden md:w-full'
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			handleCloseAttempt();
		}
	}

	function handleCloseAttempt() {
		// 1. Si el diálogo está marcado explícitamente como no-cerrable, ignoramos.
		if (!closable) return;

		// 2. Si el padre provee una función de callback, le delegamos la responsabilidad del cierre.
		if (onclose) {
			onclose();
		} else {
			// 3. Comportamiento por defecto: cerrar inmediatamente.
			open = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<div
		use:portal={'dialogs-portal'}
		transition:fade={{ duration: 150 }}
		class={overlayStyle()}
		style="z-index: {zIndex};"
		onclick={handleCloseAttempt}
		role="button"
		tabindex="-1"
		aria-hidden="true"
	></div>

	<div
		tabindex={0}
		use:portal={'dialogs-portal'}
		transition:scale={{ start: 0.95, duration: 150, easing: cubicOut }}
		class={contentStyle({ className })}
		style="z-index: {zIndex + 1};"
		role="alertdialog"
		aria-modal="true"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape' && closable) handleCloseAttempt();
		}}
	>
		{#if showCloseButton && closable}
			<button
				type="button"
				onclick={handleCloseAttempt}
				aria-label="Cerrar diálogo"
				class="ring-offset-background focus:ring-ring absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
			>
				<CancelClose class="aspect-square h-5 w-5" />
			</button>
		{/if}

		{@render children()}
	</div>
{/if}
