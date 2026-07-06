<script lang="ts">
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import MingcuteHashtagLine from '$lib/icons/MingcuteHashtagLine.svelte';
	import type { RamoPrograma } from '$lib/types/horario';
	import type { HTMLAttributes } from 'svelte/elements';
	import { tv, type VariantProps } from 'tailwind-variants';

	const segmentVariant = tv({
		base: 'aspect-square rounded-full border transition-colors text-center text-[11px] text-primary-foreground/60',
		variants: {
			size: {
				default: 'h-4 w-4 min-h-4 min-w-4',
				lg: 'h-5 w-5 min-h-5 min-w-5'
			}
		},
		defaultVariants: {
			size: 'default'
		}
	});

	interface Props extends VariantProps<typeof segmentVariant>, HTMLAttributes<HTMLDivElement> {
		/** The curricular classification code of the course. */
		curricularType: RamoPrograma['tipo'];
	}

	let { curricularType, size, class: className, ...props }: Props = $props();

	// Technical status evaluations derived from the runtime property.
	const isOdd = $derived(curricularType === 'IMPAR' || curricularType === 'AMBOS');
	const isEven = $derived(curricularType === 'PAR' || curricularType === 'AMBOS');
	const isElective = $derived(curricularType === 'ELECTIVO');

	// Computes localized user notifications safely based on structural state.
	const tooltipText = $derived.by(() => {
		if (isElective) return 'Ramo Electivo';

		const periods: string[] = [];
		if (isOdd) periods.push('semestres impares');
		if (isEven) periods.push('semestres pares');

		return `Disponible en ${periods.join(' y ')}`;
	});
</script>

<span>
	<Tooltip content={tooltipText} wrapperClass="w-full">
		<span class="flex w-full cursor-help flex-row items-center justify-center gap-1">
			{#if isElective}
				<MingcuteHashtagLine class={segmentVariant.variants.size[size || 'default']} />
			{:else}
				<div
					class="{segmentVariant({ size, className: className?.toString() })} {isOdd
						? 'bg-primary'
						: ''}"
					{...props}
				></div>
				<div
					class="{segmentVariant({ size, className: className?.toString() })} {isEven
						? 'bg-primary/80 -hue-rotate-5'
						: ''}"
					{...props}
				></div>
			{/if}
		</span>
	</Tooltip>
</span>
