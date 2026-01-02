<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import type { Ramo } from '$lib/types/horario';
	// import HorarioMiniRender from './HorarioMiniRender.svelte';

	let {
		selected = false,
		paralelo,
		disabled,
		onclick
	}: { selected: boolean; paralelo: Ramo; onclick?: () => any; disabled?: boolean } = $props();

	const [código, extra] = $derived(
		paralelo.paralelo.replace(/\(modalidad (\w+)\)/gi, ';$1').split(';')
	);
	const colision = $derived(
		Calendario.hasRamo({ sigla: paralelo.sigla }) ? false : Calendario.checkCollision(paralelo)
	);
</script>

<!-- 
{#snippet paraleloRender()}
	<HorarioMiniRender bloques={paralelo.horario} />
{/snippet} -->

<div class="{disabled ? 'pointer-events-none opacity-50 grayscale-50' : ''} flex w-full">
	<Tooltip wrapperClass="inline w-full h-full" position="right">
		<Button
			class="bg-background! relative block w-full overflow-hidden border {!selected
				? 'hover:bg-accent! active:bg-accent/50!'
				: 'bg-primary! hover:bg-primary/50! text-primary-foreground!'} whitespace-nowrap"
			{onclick}
			type="button"
		>
			<div class="flex h-full w-fit flex-col text-sm text-nowrap opacity-50">
				<p class="font-bold {colision ? 'text-orange-400' : ''}">
					{código}
				</p>
				{#if extra}
					<p class="text-xs uppercase italic">{extra}</p>
				{/if}
			</div>
			<Separator class="pl-1" vertical />

			<div class="flex flex-1 flex-col">
				{#each paralelo.profesor as profesor (profesor)}
					<div class="w-full truncate text-center text-sm" title={profesor}>
						{profesor}
					</div>
				{/each}
			</div>
		</Button>
	</Tooltip>
</div>
