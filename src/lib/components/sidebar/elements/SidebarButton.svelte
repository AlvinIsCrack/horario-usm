<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	let {
		text,
		onclick,
		Icon,
		variant = undefined as string | undefined,
		class: _class = ''
	} = $props();
</script>

<Button
	variant={(variant as any) ?? undefined}
	class="block h-auto flex-1 justify-start py-2 text-left leading-tight whitespace-normal {_class}"
	{onclick}
>
	<p class="display-[inherit] text-[inherit]">
		{#if Icon}
			<Icon class="mr-1 inline-block scale-125 align-middle" />
		{/if}
		{text}
	</p>
</Button>
