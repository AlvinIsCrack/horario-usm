<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { tv } from 'tailwind-variants';

	const toggle = tv({
		base: 'group relative inline-flex items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer select-none shadow-sm/50',
		variants: {
			pressed: {
				true: 'shadow-sm',
				false: 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
			},
			variant: {
				default: '',
				success: '',
				warning: '',
				danger: ''
			},
			size: {
				sm: 'py-0.5 px-2 h-6',
				default: 'py-1 px-3 h-8',
				lg: 'py-1.5 px-4 h-9 text-sm'
			}
		},
		compoundVariants: [
			// --- ESTADO INACTIVO (Unchecked) - Variación sutil de color ---
			{
				pressed: false,
				variant: 'default',
				class: 'border-input'
			},
			{
				pressed: false,
				variant: 'success',
				class: 'text-green-50 bg-green-500/20 hover:bg-green-600/40'
			},
			{
				pressed: false,
				variant: 'warning',
				class: 'text-amber-50 bg-amber-500/20 hover:bg-amber-500/40'
			},
			{
				pressed: false,
				variant: 'danger',
				class: 'text-red-50 bg-red-500/20 hover:bg-red-500/40'
			},

			// --- ESTADO ACTIVO (Pressed) ---
			{
				pressed: true,
				variant: 'default',
				class: 'bg-primary border-primary text-primary-foreground'
			},
			{
				pressed: true,
				variant: 'success',
				class: 'bg-green-700  text-white hover:bg-green-800'
			},
			{
				pressed: true,
				variant: 'warning',
				class: 'bg-amber-600 text-white hover:bg-amber-700'
			},
			{
				pressed: true,
				variant: 'danger',
				class: 'bg-red-600 text-white hover:bg-red-600'
			}
		],
		defaultVariants: {
			pressed: false,
			size: 'default',
			variant: 'default'
		}
	});

	let {
		pressed = $bindable(false),
		size = 'default',
		variant = 'default',
		class: _class,
		children,
		...props
	}: {
		pressed?: boolean;
		size?: keyof typeof toggle.variants.size;
		variant?: keyof typeof toggle.variants.variant;
	} & HTMLButtonAttributes = $props();
</script>

<button
	type="button"
	aria-pressed={pressed}
	onclick={() => (pressed = !pressed)}
	class={toggle({ pressed, size, variant, class: _class as string })}
	{...props}
>
	{#if pressed}
		<div
			class="grid place-items-center overflow-hidden transition-all duration-200 ease-in-out"
			style:grid-template-columns={pressed ? '1fr' : '0fr'}
			style:width={pressed ? 'auto' : '0px'}
			style:opacity={pressed ? 1 : 0}
			style:margin-right={pressed ? '2px' : '0px'}
			aria-hidden="true"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="min-w-[14px]"
			>
				<polyline points="20 6 9 17 4 12" />
			</svg>
		</div>
	{/if}

	<span class="truncate">
		{@render children?.()}
	</span>
</button>
