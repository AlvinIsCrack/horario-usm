<script lang="ts">
	import { cubicOut } from 'svelte/easing';

	let {
		children,
		trigger,
		visible = false,
		position = 'bottom',
		anchor = 'center',
		offset = 8,
		padding = 12,
		class: _class = ''
	}: {
		children: any;
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

		// CORRECCIÓN CLAVE: Usar offsetWidth/Height ignora la escala de la transición
		const flWidth = floatingEl.offsetWidth;
		const flHeight = floatingEl.offsetHeight;

		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let x = 0;
		let y = 0;

		// 1. Posicionamiento Base
		if (position === 'top' || position === 'bottom') {
			if (anchor === 'start') x = tr.left;
			else if (anchor === 'end') x = tr.right - flWidth;
			else x = tr.left + tr.width / 2 - flWidth / 2;
			y = position === 'top' ? tr.top - flHeight - offset : tr.bottom + offset;
		} else {
			if (anchor === 'start') y = tr.top;
			else if (anchor === 'end') y = tr.bottom - flHeight;
			else y = tr.top + tr.height / 2 - flHeight / 2;
			x = position === 'left' ? tr.left - flWidth - offset : tr.right + offset;
		}

		// 2. Flip Vertical
		if (position === 'bottom' && y + flHeight > vh - padding) {
			y = tr.top - flHeight - offset;
		} else if (position === 'top' && y < padding) {
			y = tr.bottom + offset;
		}

		// 3. Clamp Horizontal (Evitar desborde lateral)
		// Si se sale por la derecha (x + ancho > ancho_pantalla), lo empujamos
		if (x + flWidth > vw - padding) {
			x = vw - flWidth - padding;
		}
		// Si al empujar se sale por la izquierda, lo fijamos al borde izquierdo
		if (x < padding) {
			x = padding;
		}

		// 4. Max Height dinámico
		const finalY = Math.max(padding, y);
		if (position === 'bottom' || (position !== 'top' && finalY >= tr.bottom)) {
			maxHeight = vh - finalY - padding;
		} else {
			maxHeight = tr.top - padding - offset;
		}

		coords = { x, y: finalY };
	}

	$effect(() => {
		if (visible && trigger && floatingEl) {
			updatePosition();
			// Observer para cambios de tamaño en el contenido (filtrado)
			const resizeObserver = new ResizeObserver(() => updatePosition());
			resizeObserver.observe(floatingEl);

			window.addEventListener('resize', updatePosition);
			window.addEventListener('scroll', updatePosition, true);

			return () => {
				resizeObserver.disconnect();
				window.removeEventListener('resize', updatePosition);
				window.removeEventListener('scroll', updatePosition, true);
			};
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
				if (node.parentNode) node.parentNode.removeChild(node);
			}
		};
	}
</script>

{#if visible}
	<div
		use:portal
		bind:this={floatingEl}
		style="
            left: {coords.x}px; 
            top: {coords.y}px; 
            --max-h: {maxHeight}px;
			max-width: calc(100vw - {padding * 2}px);
        "
		class="pointer-events-auto fixed z-[100] {_class}"
		transition:adaptiveScale
	>
		{@render children()}
	</div>
{/if}
