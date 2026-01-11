<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import DialogComponent from '$lib/components/ui/Dialog.svelte';
	import MaterialSymbolsLinkRounded from '$lib/icons/MaterialSymbolsLinkRounded.svelte';
	import { Data } from '$lib/data/data.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';

	let { open = $bindable(false) } = $props();
</script>

<DialogComponent bind:open class="max-w-md gap-0 p-0">
	<div class="border-b p-4 pb-3">
		<h2 class="text-lg leading-none font-bold">Diagnóstico Copiado</h2>
		<p class="text-muted-foreground mt-1 text-xs">
			Pégalo en tu IA favorita. Para que analice la materia específica, puedes descargar los
			programas aquí y adjuntarlos manualmente al chat:
		</p>
	</div>

	<div class="flex max-h-[50vh] flex-col gap-2 overflow-y-auto p-4">
		{#each Calendario.ramos as ramo}
			{@const prog = Data.getProgramaRamo(Calendario.sede, ramo.sigla)}

			<Button
				class="bg-muted/10 group flex! items-center! justify-between! {prog?.programa
					? 'cursor-pointer'
					: 'cursor-not-allowed opacity-50'}"
				onclick={() => prog?.programa && window.open(prog?.programa, '_blank')}
				variant="outlined"
			>
				<div class="flex flex-col overflow-hidden text-left">
					<span class="truncate font-medium">{ramo.nombre}</span>
					<span class="text-muted-foreground text-[10px] tracking-wider uppercase"
						>{ramo.sigla}</span
					>
				</div>

				{#if prog?.programa}
					<div class="shrink-0 rounded-md p-3 transition-[inherit] group-hover:bg-sky-500/20">
						<MaterialSymbolsLinkRounded class="size-5" />
					</div>
				{:else}
					<span class="text-muted-foreground px-2 text-[10px] italic">Sin link</span>
				{/if}
			</Button>
		{/each}
	</div>

	<div class="bg-muted/20 border-t p-4">
		<Button class="w-full" onclick={() => (open = false)}>Entendido</Button>
	</div>
</DialogComponent>
