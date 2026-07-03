<script module>
	// Contexto para comunicación Padre -> Hijo (Keep-Alive lógico)
	const TOOLTIP_CTX = Symbol('tooltip_ctx');

	// Registro global para cerrar vecinos (Anti-Cascada)
	type TooltipInstance = {
		id: symbol;
		forceClose: () => void;
		contains: (element: HTMLElement) => boolean;
	};
	const openTooltips = new Set<TooltipInstance>();
</script>

<script lang="ts">
	import { setContext, getContext } from 'svelte';
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
		interactive = false,
		closeDelay = undefined,
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
		interactive?: boolean;
		closeDelay?: number;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const tooltip = tv({
		base: 'fixed w-max border text-left leading-tight max-w-xs! font-normal rounded bg-popover px-2 py-1 text-sm text-popover-foreground shadow-sm/50',
		variants: {
			position: {
				top: 'bottom-full left-1/2',
				bottom: 'top-full left-1/2',
				left: 'right-full top-1/2',
				right: 'left-full top-1/2'
			}
		}
	});

	// --- ESTADO ---
	let visible = $state(false);
	let isHovered = $state(false);
	let activeChildren = $state(0); // Contador de hijos abiertos vía Contexto

	let wrapperEl: HTMLDivElement | undefined = $state();
	let contentEl: HTMLDivElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout>;

	const instanceId = Symbol('tooltip_instance');

	// --- CONTEXTO (Relación Padre-Hijo) ---
	// 1. Obtener padre (si existe) para registrarme
	const parentCtx = getContext<
		| {
				registerChild: () => void;
				unregisterChild: () => void;
		  }
		| undefined
	>(TOOLTIP_CTX);

	// 2. Proveer contexto para mis propios hijos
	setContext(TOOLTIP_CTX, {
		registerChild: () => {
			activeChildren++;
			clearTimeout(timer); // Si un hijo se abre, cancelo mi cierre
		},
		unregisterChild: () => {
			activeChildren = Math.max(0, activeChildren - 1);
			// Si el último hijo se cerró y yo no tengo mouse encima, intento cerrarme
			if (activeChildren === 0 && !isHovered) {
				scheduleHide();
			}
		}
	});

	// --- INSTANCIA GLOBAL (Anti-Cascada) ---
	const instance: TooltipInstance = {
		id: instanceId,
		forceClose: () => {
			clearTimeout(timer);
			visible = false;
		},
		contains: (element) => {
			// Soy ancestro si el elemento está en mi contenido o es mi trigger
			return (contentEl?.contains(element) || wrapperEl?.contains(element)) ?? false;
		}
	};

	// --- LÓGICA ---
	function show() {
		clearTimeout(timer);
		isHovered = true;

		// Lógica Anti-Cascada: Cerrar otros tooltips que NO sean mis ancestros
		for (const other of openTooltips) {
			if (other.id === instanceId) continue;

			// Si 'other' me contiene (es mi padre/abuelo), NO lo cierro.
			// Usamos contains del DOM porque el trigger del hijo vive en el padre.
			if (wrapperEl && other.contains(wrapperEl)) continue;

			other.forceClose();
		}

		visible = true;
	}

	function scheduleHide() {
		const effectiveDelay = closeDelay ?? (interactive ? 150 : 0);

		clearTimeout(timer);

		if (effectiveDelay > 0) {
			timer = setTimeout(() => {
				// Keep-Alive: No cerrar si tengo hijos activos o el mouse volvió
				if (isHovered || activeChildren > 0) return;
				visible = false;
			}, effectiveDelay);
		} else {
			if (activeChildren > 0) return;
			visible = false;
		}
	}

	function onPointerLeave() {
		isHovered = false;
		scheduleHide();
	}

	// Sincronización de estado
	$effect(() => {
		if (visible) {
			openTooltips.add(instance);
			parentCtx?.registerChild();
		} else {
			openTooltips.delete(instance);
			parentCtx?.unregisterChild();
		}

		return () => {
			openTooltips.delete(instance);
			if (visible) parentCtx?.unregisterChild(); // Cleanup seguro
			clearTimeout(timer);
		};
	});
</script>

<div
	class="relative inline-flex {wrapperClass}"
	onpointerenter={show}
	onpointerleave={onPointerLeave}
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
			bind:this={contentEl}
			onpointerenter={interactive ? show : undefined}
			onpointerleave={interactive ? onPointerLeave : undefined}
		>
			{#if typeof content === 'string'}
				{@html content}
			{:else if content}
				{@render content()}
			{/if}
		</div>
	</Floating>
</div>
