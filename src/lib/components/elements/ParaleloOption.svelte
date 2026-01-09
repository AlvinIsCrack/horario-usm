<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import ProfessorCard from '$lib/logic/professors/components/ProfessorCard.svelte';
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

<div class="{disabled ? 'pointer-events-none opacity-40 grayscale' : ''} flex w-full">
	<!-- {#snippet paraleloRender()}
		<HorarioMiniRender bloques={paralelo.horario} />
	{/snippet} -->
	<!-- <Tooltip content={paraleloRender} wrapperClass="inline w-full h-full" position="right"> -->
	<Button
		class="relative flex w-full items-center gap-3 border p-3
                {!selected
			? 'bg-background! hover:bg-accent! hover:border-accent-foreground/20 active:bg-accent/80'
			: 'bg-primary! text-primary-foreground ring-primary/20 hover:bg-primary/90! shadow-md ring-1'} 
                {colision && !selected ? 'border-destructive! hover:bg-destructive/40!' : ''}"
		{onclick}
		type="button"
	>
		<div
			class="flex h-full min-w-[3rem] flex-col items-center justify-center border-r pr-3 leading-tight"
		>
			<p
				class="text-xs font-black tracking-tighter md:scale-150 xl:scale-200 {colision
					? 'text-destructive'
					: 'opacity-60'}"
			>
				{código}
			</p>
			{#if extra}
				<p class="text-[10px] font-medium uppercase opacity-40">{extra}</p>
			{/if}
		</div>

		<div class="flex flex-1 flex-col overflow-hidden text-left leading-snug">
			{#each paralelo.profesor as profesor (profesor)}
				{#snippet tooltipContent()}
					<div class="p-1">
						<ProfessorCard id={profesor} />
					</div>
				{/snippet}

				<div class="truncate text-sm font-medium">
					{#if profesor.includes('NN')}
						NN (Profesor aún no asignado)
					{:else}
						<Tooltip offset={50} position="right" content={tooltipContent}>
							<span
								class="decoration-foreground/50 cursor-help underline decoration-dotted hover:decoration-solid"
								>{profesor}</span
							>
						</Tooltip>
					{/if}
				</div>
			{/each}
		</div>
	</Button>
	<!-- </Tooltip> -->
</div>
