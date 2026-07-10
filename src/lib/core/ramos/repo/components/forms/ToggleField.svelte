<script lang="ts">
	import ToggleGroup from '$lib/components/ui/ToggleGroup.svelte';
	import type { FormStateManager } from '$lib/components/ui/form';

	interface ToggleItem {
		value: string;
		label: string;
		desc?: string;
	}

	interface Props {
		id: string;
		form: FormStateManager<any>;
		items: ToggleItem[];
		nullable?: boolean;
		required?: boolean;
	}

	let { id, form, items, nullable = false, required = true }: Props = $props();
</script>

<ToggleGroup
	{id}
	aria-describedby="{id}-help"
	{items}
	justified={true}
	{nullable}
	{required}
	value={form.values[id]}
	onValueChange={(val) => form.setFieldValue(id, val)}
	class={{
		root: 'h-auto flex-wrap',
		item: 'flex h-auto min-w-8 flex-1 flex-col items-center border px-3 py-4 text-center whitespace-normal'
	}}
>
	{#snippet labelView(item)}
		{@const currentItem = items[item.index]}
		<div>
			<h3>{item.label}</h3>
			{#if currentItem?.desc}
				<p class="text-muted-foreground text-[11px] leading-tight font-medium">
					{currentItem.desc}
				</p>
			{/if}
		</div>
	{/snippet}
</ToggleGroup>
