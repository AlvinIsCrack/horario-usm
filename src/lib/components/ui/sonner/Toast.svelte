<script lang="ts">
	import { tv } from 'tailwind-variants';
	import { fade, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { toastState, type ToastProps } from './ctx.svelte';

	// Iconos opcionales (cámbialos por los que tengas en tu proyecto)
	import MaterialSymbolsVerifiedRounded from '$lib/icons/MaterialSymbolsVerifiedRounded.svelte';
	import MaterialSymbolsExclamationRounded from '$lib/icons/MaterialSymbolsExclamationRounded.svelte';
	import MaterialSymbolsWarningRounded from '$lib/icons/MaterialSymbolsWarningRounded.svelte';
	import MaterialSymbolsInfoOutlineRounded from '$lib/icons/MaterialSymbolsInfoOutlineRounded.svelte';
	import MaterialSymbolsCancelRounded from '$lib/icons/MaterialSymbolsCancelRounded.svelte';

	let { toast, index }: { toast: ToastProps; index: number } = $props();

	const toastVariants = tv({
		base: 'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-4 pr-8 shadow-lg transition-all hover:scale-[1.02] border-2 border-foreground/50! [&_svg]:scale-180',
		variants: {
			variant: {
				default: 'border-border bg-background text-foreground',
				success: 'bg-lime-600/50 text-green-50',
				error: 'bg-red-600/50 text-red-50',
				warning: 'bg-amber-600/50 text-amber-50',
				info: 'bg-sky-600/50 text-blue-50'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	const icons = {
		success: MaterialSymbolsVerifiedRounded,
		error: MaterialSymbolsExclamationRounded,
		warning: MaterialSymbolsWarningRounded,
		info: MaterialSymbolsInfoOutlineRounded,
		default: null
	};

	const Icon = icons[toast.type];
</script>

<div
	in:fly={{ y: 20, duration: 300, easing: backOut }}
	out:fade={{ duration: 200 }}
	class={toastVariants({ variant: toast.type })}
>
	{#if Icon}
		<div class="mt-0.5 shrink-0 opacity-80">
			<Icon class="size-4" />
		</div>
	{/if}

	<div class="grid flex-1 gap-1">
		{#if toast.title}
			<div class="text-sm leading-none font-medium tracking-tight">
				{toast.title}
			</div>
		{/if}
		{#if toast.description}
			<div class="text-xs opacity-80">
				{toast.description}
			</div>
		{/if}

		{#if toast.action}
			<button
				onclick={toast.action.onClick}
				class="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring mt-2 inline-flex h-6 items-center justify-center rounded-md border px-2 text-xs font-medium shadow-sm focus-visible:ring-1 focus-visible:outline-none"
			>
				{toast.action.label}
			</button>
		{/if}
	</div>

	<button
		onclick={() => toastState.dismiss(toast.id)}
		class="hover:text-foreground text-foreground/50 absolute top-2 right-2 cursor-pointer rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:outline-none"
	>
		<MaterialSymbolsCancelRounded class="size-3" />
	</button>
</div>
