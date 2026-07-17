<script module>
	interface StarCalificationProps {
		star?: number;
		labels?: string[];
		onValueChange?: (newValue: number, oldValue: number) => void;
	}
</script>

<script lang="ts">
	import MingcuteStarFill from '$lib/icons/MingcuteStarFill.svelte';
	import MingcuteStarLine from '$lib/icons/MingcuteStarLine.svelte';
	import { cn } from '$lib/utils';

	let {
		star = $bindable(0),
		labels = ['1', '2', '3', '4', '5'],
		onValueChange
	}: StarCalificationProps = $props();
</script>

{#snippet starComponent(value: number)}
	{@const active = star >= value}
	{@const Icon = active ? MingcuteStarFill : MingcuteStarLine}
	{@const label = labels[value - 1]}
	<button type="button" class="flex flex-col items-center" onclick={() => onValueChange?.(value, star)}>
		<Icon
			class={cn(
				'text-muted-foreground size-8 cursor-pointer transition-all duration-200',
				star > 0 && 'text-muted-foreground/80',
				active ? 'text-sky-600' : 'hover:text-foreground'
			)}
		/>
		{#if label}
			<p
				class={cn(
					'text-muted-foreground text-sm font-medium tabular-nums select-none',
					active && 'text-foreground font-bold'
				)}
			>
				{label}
			</p>
		{/if}
	</button>
{/snippet}

<div class="flex flex-row gap-1" data-state={star !== 0 ? "on" : "off"}>
	{@render starComponent(1)}
	{@render starComponent(2)}
	{@render starComponent(3)}
	{@render starComponent(4)}
	{@render starComponent(5)}
</div>
