<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import type { TagDefinition } from '../types';

	let { tag, heavy }: { tag: TagDefinition & { score?: number }; heavy?: boolean } = $props();
</script>

<Tooltip content={tag.description}>
	<Badge
		class="cursor-help px-2! py-px! {false
			? 'border-white/25'
			: 'border-white/20!'} text-[10px] font-normal saturate-120! select-none hover:brightness-150!"
		variant={{
			NEUTRAL: 'default',
			ALERT: 'warning',
			POSITIVE: 'success',
			NEGATIVE: 'danger'
		}[tag.sentiment] as any}
	>
		<span class="mix-blend-plus-lighter text-shadow-sm/100 {false ? 'font-medium' : 'opacity-75'}"
			>{tag.label}</span
		>
	</Badge>
</Tooltip>
