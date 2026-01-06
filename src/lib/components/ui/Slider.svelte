<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';
	import { fade, scale } from 'svelte/transition';

	// Definimos el estilo base y sus partes
	const slider = tv({
		slots: {
			root: 'relative hover:cursor-pointer flex w-full isolate touch-none select-none items-center py-2', // py-6 da espacio a los tooltips
			track: 'relative ring ring-input h-2 w-full grow overflow-hidden rounded-full bg-secondary',
			range: 'absolute h-full bg-primary/50 rounded-full',
			thumb:
				'block h-5 w-5 rounded-full border-2 border-primary bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-20',
			tick: 'absolute top-1/2 h-2 w-2 rounded-full -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/50 z-10 transition-all hover:bg-primary hover:scale-150 cursor-help',
			popup:
				'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border shadow-sm whitespace-nowrap pointer-events-none'
		}
	});

	const { root, track, range, thumb, tick: tickStyle, popup } = slider();

	type Tick = {
		value: number;
		label?: string; // Texto principal del tooltip
		description?: string; // Texto secundario
	};

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		ticks = [], // Puede ser number[] o Tick[]
		showValueTooltip = true, // Mostrar tooltip en el thumb al arrastrar/hover
		formatValue = (v) => v, // Formateador para el valor
		class: _class,
		disabled = false,
		...props
	}: {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		ticks?: (number | Tick)[];
		disabled?: boolean;
		showValueTooltip?: boolean;
		formatValue?: (v: number) => string | number;
	} & HTMLAttributes<HTMLDivElement> = $props();

	// Normalizar ticks a objetos
	let parsedTicks = $derived(ticks.map((t) => (typeof t === 'number' ? { value: t } : t)));

	// Estado interno
	let element: HTMLDivElement | undefined = $state();
	let isDragging = $state(false);
	let hoveredTick: Tick | null = $state(null);

	// Porcentaje para posicionamiento visual
	let percentage = $derived(((value - min) / (max - min)) * 100);

	function updateValue(clientX: number) {
		if (!element || disabled) return;
		const rect = element.getBoundingClientRect();
		const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
		const rawValue = min + percent * (max - min);
		const steppedValue = Math.round(rawValue / step) * step;

		// Ajuste de precisión decimal
		const precision = step.toString().split('.')[1]?.length || 0;
		value = parseFloat(steppedValue.toFixed(precision));
	}

	function handlePointerDown(e: PointerEvent) {
		if (disabled) return;
		isDragging = true;
		element?.setPointerCapture(e.pointerId);
		updateValue(e.clientX);
	}

	function handlePointerMove(e: PointerEvent) {
		if (isDragging) updateValue(e.clientX);
	}

	function handlePointerUp(e: PointerEvent) {
		if (isDragging) {
			isDragging = false;
			element?.releasePointerCapture(e.pointerId);
		}
	}
</script>

<div
	bind:this={element}
	class={root({ class: _class as string })}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	tabindex={disabled ? -1 : 0}
	{...props}
>
	<div class={track()}>
		<div class={range()} style="width: {percentage}%"></div>
	</div>

	{#each parsedTicks as tick}
		{@const tickPercent = ((tick.value - min) / (max - min)) * 100}
		{#if tickPercent >= 0 && tickPercent <= 100}
			<div
				class={tickStyle()}
				style="left: {tickPercent}%"
				role="presentation"
				onpointerenter={() => (hoveredTick = tick)}
				onpointerleave={() => (hoveredTick = null)}
			>
				{#if hoveredTick === tick && (tick.label || tick.description)}
					<div
						in:scale={{ duration: 150, start: 0.9 }}
						out:fade={{ duration: 100 }}
						class={popup()}
					>
						{#if tick.label}
							<span class="block font-bold">{tick.label}</span>
						{/if}
						{#if tick.description}
							<span class="text-muted-foreground block text-[10px]">{tick.description}</span>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/each}

	<span
		class={thumb()}
		style="position: absolute; left: {percentage}%; transform: translate(-50%, -50%); top: 50%;"
	>
		{#if showValueTooltip && (isDragging || hoveredTick === null)}
			<div
				class="{popup()} {isDragging
					? 'opacity-100'
					: 'opacity-0 group-hover:opacity-100 hover:opacity-100'} transition-opacity"
			>
				{formatValue(value)}
			</div>
		{/if}
	</span>
</div>
