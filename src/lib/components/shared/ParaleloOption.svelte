<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import ProfessorCard from '$lib/core/professors/components/ProfessorCard.svelte';
	import type { Ramo } from '$lib/core/ramos/types';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { cn } from '$lib/utils';

	/**
	 * Component props configuration for Parallel Options.
	 */
	interface Props {
		selected?: boolean;
		paralelo: Ramo;
		disabled?: boolean;
		onclick?: () => void;
	}

	let { selected = false, paralelo, disabled = false, onclick }: Props = $props();

	/**
	 * Extracts the section/parallel code and potential modality info from the text.
	 * Target format example: "Paralelo 1 (modalidad Virtual)" -> ["Paralelo 1", "Virtual"]
	 */
	const [code, extraInfo] = $derived(
		paralelo.paralelo.replace(/\(modalidad (\w+)\)/gi, ';$1').split(';')
	);

	/**
	 * Evaluates whether the current parallel conflicts with scheduled hours.
	 * Returns false if the course is already added to prevent self-collision highlights.
	 */
	const hasCollision = $derived(
		Calendario.hasRamo({ sigla: paralelo.sigla }) ? false : Calendario.checkCollision(paralelo)
	);
</script>

<div class="{disabled ? 'pointer-events-none opacity-40 grayscale' : ''} flex w-full">
	<Button
		class={cn([
			'relative flex w-full items-center gap-2 border px-2! py-1!',
			!selected
				? 'bg-background! hover:bg-accent! hover:border-accent-foreground/20 active:bg-accent/80'
				: 'bg-primary! text-primary-foreground ring-primary/20 hover:bg-primary/90! shadow-md ring-1',
			hasCollision && 'border-amber-600! hover:bg-amber-600/20!',
			hasCollision && selected && 'bg-amber-900!'
		])}
		{onclick}
		type="button"
	>
		{@render codeSection()}
		{@render professorsSection()}
	</Button>
</div>

{#snippet codeSection()}
	<div
		class="relative flex h-full min-w-12 flex-col items-center justify-center overflow-hidden leading-tight"
	>
		<div
			class="text-xs font-black tracking-tighter md:scale-150 xl:scale-200 {hasCollision
				? '-translate-y-1 text-amber-600'
				: 'opacity-60'}"
		>
			{code}
		</div>
		{#if hasCollision}
			<div class="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-medium text-amber-600">
				TOPE
			</div>
		{/if}
		{#if extraInfo}
			<p class="text-[10px] font-medium uppercase opacity-40">{extraInfo}</p>
		{/if}
	</div>
{/snippet}

{#snippet professorsSection()}
	<div class="flex flex-1 flex-col overflow-hidden text-left leading-snug">
		{#each paralelo.profesor as professor (professor)}
			{#snippet tooltipContent()}
				<div class="p-1">
					<ProfessorCard id={professor} />
				</div>
			{/snippet}

			<div class="truncate text-sm font-medium">
				<Tooltip interactive offset={50} position="right" content={tooltipContent}>
					<span
						class="decoration-foreground/50 cursor-help underline decoration-dotted hover:decoration-solid"
					>
						{professor}
					</span>
				</Tooltip>
			</div>
		{/each}
	</div>
{/snippet}
