<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let {
		children,
		trigger,
		visible = false,
		position = 'bottom',
		anchor = 'center',
		offset = 8,
		padding = 12, // Nueva prop para el margen con el borde de la pantalla
		class: _class = ''
	}: {
		children: Snippet;
		trigger: HTMLElement | undefined;
		visible: boolean;
		position?: 'top' | 'bottom' | 'left' | 'right';
		anchor?: 'start' | 'center' | 'end';
		offset?: number;
		padding?: number;
		class?: string;
	} = $props();

	let floatingEl: HTMLDivElement | undefined = $state();
	let coords = $state({ x: 0, y: 0 });
	let maxHeight = $state(0);

	function updatePosition() {
		if (!visible || !trigger || !floatingEl) return;

		const tr = trigger.getBoundingClientRect();
		const fl = floatingEl.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let x = 0;
		let y = 0;

		// Posicionamiento Base
		if (position === 'top' || position === 'bottom') {
			if (anchor === 'start') x = tr.left;
			else if (anchor === 'end') x = tr.right - fl.width;
			else x = tr.left + tr.width / 2 - fl.width / 2;
			y = position === 'top' ? tr.top - fl.height - offset : tr.bottom + offset;
		} else {
			if (anchor === 'start') y = tr.top;
			else if (anchor === 'end') y = tr.bottom - fl.height;
			else y = tr.top + tr.height / 2 - fl.height / 2;
			x = position === 'left' ? tr.left - fl.width - offset : tr.right + offset;
		}

		// Flip Vertical si no cabe abajo
		if (position === 'bottom' && y + fl.height > vh - padding) {
			y = tr.top - fl.height - offset;
		} else if (position === 'top' && y < padding) {
			y = tr.bottom + offset;
		}

		// Ajuste de bordes (Shift horizontal)
		x = Math.max(padding, Math.min(x, vw - fl.width - padding));

		// Re-ajuste de Y y cálculo de maxHeight dinámico
		const finalY = Math.max(padding, y);
		coords = { x, y: finalY };

		// Calculamos el espacio disponible real según la posición final
		if (position === 'bottom' && finalY >= tr.bottom) {
			maxHeight = vh - finalY - padding;
		} else if (position === 'top' || finalY < tr.top) {
			maxHeight = tr.top - padding - offset;
		} else {
			maxHeight = vh - padding * 2;
		}
	}

	// Efecto para reactividad de props y listeners globales
	$effect(() => {
		if (visible) {
			updatePosition(); // Ejecución inicial al mostrar

			window.addEventListener('resize', updatePosition);
			window.addEventListener('scroll', updatePosition, true); // capture para detectar scroll en contenedores

			return () => {
				window.removeEventListener('resize', updatePosition);
				window.removeEventListener('scroll', updatePosition, true);
			};
		}
	});

	$effect(() => {
		if (visible && trigger && floatingEl) {
			const tr = trigger.getBoundingClientRect();
			const fl = floatingEl.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;

			let x = 0;
			let y = 0;

			// Lógica de Posicionamiento Base y Anchors
			if (position === 'top' || position === 'bottom') {
				if (anchor === 'start') x = tr.left;
				else if (anchor === 'end') x = tr.right - fl.width;
				else x = tr.left + tr.width / 2 - fl.width / 2;

				y = position === 'top' ? tr.top - fl.height - offset : tr.bottom + offset;
			} else {
				if (anchor === 'start') y = tr.top;
				else if (anchor === 'end') y = tr.bottom - fl.height;
				else y = tr.top + tr.height / 2 - fl.height / 2;

				x = position === 'left' ? tr.left - fl.width - offset : tr.right + offset;
			}

			// Manejo de Colisiones (Overflow)
			// Flip vertical si no cabe
			if (position === 'bottom' && y + fl.height > vh - padding) {
				y = tr.top - fl.height - offset;
			} else if (position === 'top' && y < padding) {
				y = tr.bottom + offset;
			}

			// Ajuste horizontal (desplazamiento para no salir de pantalla)
			if (x + fl.width > vw - padding) x = vw - fl.width - padding;
			if (x < padding) x = padding;

			// Calculamos el x/y final primero para saber dónde quedó el elemento
			const finalX = Math.max(padding, Math.min(x, vw - fl.width - padding));
			const finalY = Math.max(padding, Math.min(y, vh - fl.height - padding));

			// Espacio vertical disponible real desde el punto de origen y hasta el borde inferior
			if (position === 'bottom') {
				maxHeight = vh - finalY - padding;
			} else if (position === 'top') {
				maxHeight = tr.top - padding - offset;
			} else {
				maxHeight = vh - padding * 2;
			}

			coords = { x: finalX, y: finalY };
		}
	});

	function adaptiveScale(node: HTMLElement) {
		const origins = {
			top: 'bottom',
			bottom: 'top',
			left: 'right',
			right: 'left'
		};

		return {
			duration: 150,
			easing: cubicOut,
			css: (t: number) => `
                opacity: ${t};
                transform: scale(${0.95 + 0.05 * t});
                transform-origin: ${origins[position] || 'center'};
            `
		};
	}

	function portal(node: HTMLElement) {
		const target = document.querySelector('#tooltip-portal') || document.body;
		target.appendChild(node);

		return {
			destroy() {
				// Svelte llamará a esto DESPUÉS de que la transición de salida termine
				if (node.parentNode) node.parentNode.removeChild(node);
			}
		};
	}
</script>

{#if visible}
	<div
		use:portal
		bind:this={floatingEl}
		style="left: {coords.x}px; top: {coords.y}px; --max-h: {maxHeight}px;"
		class="pointer-events-auto fixed z-[100] {_class}"
		transition:adaptiveScale
	>
		{@render children()}
	</div>
{/if}
