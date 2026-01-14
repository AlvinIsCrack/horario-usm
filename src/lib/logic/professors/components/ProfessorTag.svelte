<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import type { TagDefinition } from '../types';

	let { tag, heavy = false }: { tag: TagDefinition & { score?: number }; heavy?: boolean } =
		$props();
</script>

{#snippet tooltipContent()}
	<p>
		{tag.description}
	</p>
	{#if heavy}
		<span class="text-xs opacity-50">Etiqueta detacada por ser tendencia.</span>
	{/if}
{/snippet}

<Tooltip content={tooltipContent}>
	<Badge
		class="relative isolate cursor-help overflow-hidden px-2! py-px! text-[10px] font-normal saturate-120! transition-all duration-500 select-none
        {heavy
			? 'border-white/40! font-semibold!'
			: 'border-white/20! hover:opacity-100 hover:brightness-150!'}"
		variant={{
			NEUTRAL: 'default',
			ALERT: 'warning',
			POSITIVE: 'success',
			NEGATIVE: 'danger'
		}[tag.sentiment] as any}
	>
		<span class="mix-blend-plus-lighter text-shadow-sm/100 {heavy ? 'opacity-100' : 'opacity-75'}">
			{tag.label}
		</span>
		<div
			class="absolute top-0 left-0 size-full saturate-150 {heavy
				? 'tag-shimmer z-10 mix-blend-plus-lighter shadow-[inset_0_0_4px_rgba(255,255,255,1)]'
				: ''}"
		></div>
	</Badge>
</Tooltip>

<style>
	:global(.tag-shimmer) {
		/* Usamos background-image para añadir el brillo ENCIMA del color base del Badge (bg-green, bg-red, etc.) */
		background-image: linear-gradient(
			120deg,
			transparent 30%,
			rgba(255, 255, 255, 0.25) 60%,
			transparent 75%
		);
		background-size: 200% 100%;
		animation: shimmer 2.2s infinite linear;
	}

	@keyframes shimmer {
		/* Mueve el destello de Izquierda a Derecha */
		0% {
			background-position: 150% 0;
		}
		100% {
			background-position: -50% 0;
		}
	}
</style>
