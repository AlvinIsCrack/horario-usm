<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import type { TagDefinition } from '../types';

	let { tag }: { tag: TagDefinition } = $props();
</script>

<Tooltip content={tag.description}>
	<Badge
		class="cursor-help px-2! py-px! text-[10px] border-white/20! font-normal saturate-120! select-none hover:brightness-150!"
		variant={{
			NEUTRAL: 'default',
			ALERT: 'warning',
			POSITIVE: 'success',
			NEGATIVE: 'danger'
		}[tag.sentiment] as any}
	>
		<span class="text-shadow-sm/100 mix-blend-plus-lighter">{tag.label}</span>
	</Badge>
</Tooltip>
