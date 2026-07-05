<script lang="ts">
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import ProfessorCard from '$lib/core/professors/components/ProfessorCard.svelte';
	import type { Ramo } from '$lib/core/ramos/types';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { cn } from '$lib/utils';
	import DialogComponent from '../ui/Dialog.svelte';
	import MaterialSymbolsInfo from '$lib/icons/MaterialSymbolsInfo.svelte';

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
	 */
	const [code, extraInfo] = $derived(
		paralelo.paralelo.replace(/\(modalidad (\w+)\)/gi, ';$1').split(';')
	);

	/**
	 * Evaluates whether the current parallel conflicts with scheduled hours.
	 */
	const hasCollision = $derived(
		Calendario.hasRamo({ sigla: paralelo.sigla }) ? false : Calendario.checkCollision(paralelo)
	);

	/**
	 * State to manage the currently inspected professor for the decoupled dialog.
	 */
	let inspectedProfessor = $state<string | null>(null);
</script>

<div class="{disabled ? 'pointer-events-none opacity-40 grayscale' : ''} flex w-full">
	<div
		role="button"
		tabindex="0"
		class={cn([
			'relative flex min-h-10 w-full cursor-pointer items-center gap-2 rounded border p-2 text-left transition-colors',
			!selected
				? 'bg-background hover:border-accent-foreground/20 hover:bg-accent active:bg-accent/80'
				: 'bg-primary text-primary-foreground ring-primary/20 hover:bg-primary/90 shadow-md ring-1',
			hasCollision && 'border-amber-600 hover:bg-amber-600/20',
			hasCollision && selected && 'bg-amber-900'
		])}
		{onclick}
		onkeydown={(e) => e.key === 'Enter' && onclick?.()}
	>
		{@render codeSection()}
		{@render professorsSection()}
	</div>
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
	<div class="z-10 flex flex-1 flex-col items-end overflow-hidden text-right leading-snug">
		{#each paralelo.profesor as professor (professor)}
			<div class="my-auto truncate text-sm font-medium">
				{#if professor.includes('NN')}
					<span class="opacity-50">{professor}</span>
				{:else}
					<button
						type="button"
						class="group inline-flex cursor-help items-center justify-end gap-1 rounded-sm align-middle outline-none focus-visible:ring-2"
						onclick={(e) => {
							e.stopPropagation();
							inspectedProfessor = professor;
						}}
					>
						<Tooltip content="Ver información del profesor" wrapperClass="gap-1 items-center">
							<MaterialSymbolsInfo
								class="text-muted-foreground hover:text-accent-foreground size-4 transition-opacity"
							/>

							<span
								class="decoration-foreground/50 underline decoration-dotted transition-colors group-hover:decoration-solid"
							>
								{professor}
							</span>
						</Tooltip>
					</button>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<DialogComponent
	open={!!inspectedProfessor}
	onclose={() => (inspectedProfessor = null)}
	class="max-w-md gap-0 p-4"
>
	{#if inspectedProfessor}
		<ProfessorCard id={inspectedProfessor} />
	{/if}
</DialogComponent>
