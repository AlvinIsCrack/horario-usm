<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import type { TagDefinition } from '../types';

	let { tag }: { tag: TagDefinition } = $props();
</script>

<Tooltip content={tag.description}>
	<Badge
		class="h-5 cursor-help px-1.5! text-[10px] font-normal saturate-120! select-none hover:brightness-120! hover:saturate-80!"
		variant={{
			NEUTRAL: 'default',
			ALERT: 'warning',
			POSITIVE: 'success',
			NEGATIVE: 'danger'
		}[tag.sentiment] as any}
	>
		<span class="opacity-80 mix-blend-plus-lighter">{tag.label}</span>
	</Badge>
</Tooltip>
