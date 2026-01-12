<script lang="ts">
	import { toastState } from './ctx.svelte';
	import Toast from './Toast.svelte';
</script>

<div
	class="fixed right-0 bottom-0 z-200 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]"
>
	{#each toastState.toasts as t, i (t.id)}
		<Toast toast={t} index={i} />
	{/each}
</div>
