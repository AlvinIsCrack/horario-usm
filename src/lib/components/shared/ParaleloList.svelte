<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { cn } from '$lib/utils';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import ProfessorCard from '$lib/core/professors/components/ProfessorCard.svelte';
	import DialogComponent from '../ui/Dialog.svelte';
	import MaterialSymbolsInfo from '$lib/icons/MaterialSymbolsInfo.svelte';
	import type { Ramo } from '$lib/core/ramos/types';

	/**
	 * Component properties for the Parallel sections list.
	 */
	interface Props {
		/** The unique course identifier code used for index lookup. */
		sigla: string;
		/** The currently selected parallel section code, supporting two-way binding. */
		selectedParalelo: string;
	}

	let { sigla, selectedParalelo = $bindable() }: Props = $props();

	/**
	 * Tracked identifier for the professor profile view modal overlay.
	 */
	let inspectedProfessor = $state<string | null>(null);

	/**
	 * Resolves the collection of available parallel configurations for the active course identifier.
	 */
	const paraleloOptions = $derived(
		sigla && Data.cachedRamos[sigla] ? Object.values(Data.cachedRamos[sigla]) : []
	);

	/**
	 * Extracts the section/parallel code and potential modality info from raw section text configurations.
	 */
	function parseSectionDetails(sectionName: string): { code: string; extraInfo: string } {
		const [code, extraInfo] = sectionName.replace(/\(modalidad (\w+)\)/gi, ';$1').split(';');
		return { code, extraInfo: extraInfo || '' };
	}
</script>

<div class="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto">
	{#each paraleloOptions as ramo (ramo.paralelo)}
		{@const { code, extraInfo } = parseSectionDetails(ramo.paralelo)}
		{@const isSelected = ramo.paralelo === selectedParalelo}
		{@const isDisabled = Calendario.hasRamo({ sigla: ramo.sigla, paralelo: ramo.paralelo })}
		{@const hasCollision = Calendario.hasRamo({ sigla: ramo.sigla })
			? false
			: Calendario.checkCollision(ramo)}

		<div class={cn('flex w-full', isDisabled && 'pointer-events-none opacity-40 grayscale')}>
			<div
				role="button"
				tabindex="0"
				class={cn([
					'relative flex min-h-10 w-full cursor-pointer items-center gap-2 rounded border p-2 py-1 text-left transition-colors',
					!isSelected
						? 'bg-background hover:border-accent-foreground/20 hover:bg-accent active:bg-accent/80'
						: 'bg-primary text-primary-foreground ring-primary/20 hover:bg-primary/90 shadow-md ring-1',
					hasCollision && 'border-amber-600 hover:bg-amber-600/20',
					hasCollision && isSelected && 'bg-amber-800/40'
				])}
				onclick={() => {
					if (isSelected) {
						selectedParalelo = '';
						Calendario.ramoPreview = undefined;
					} else {
						selectedParalelo = ramo.paralelo;
						Calendario.ramoPreview = ramo;
					}
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						if (isSelected) {
							selectedParalelo = '';
							Calendario.ramoPreview = undefined;
						} else {
							selectedParalelo = ramo.paralelo;
							Calendario.ramoPreview = ramo;
						}
					}
				}}
			>
				<div
					class="relative flex h-full min-w-12 flex-col items-start justify-center overflow-hidden leading-none {hasCollision
						? '-mt-1'
						: ''}"
				>
					<div
						class={cn(
							'text-muted-foreground text-center text-2xl font-black tracking-tighter',
							hasCollision && 'text-amber-600'
						)}
					>
						{code}
						{#if hasCollision}
							<div class="-mt-2 text-xs font-semibold tracking-normal text-amber-600">TOPE</div>
						{/if}
					</div>
					{#if extraInfo}
						<p class="text-[10px] font-medium uppercase opacity-40">{extraInfo}</p>
					{/if}
				</div>

				<div class="z-10 flex flex-1 flex-col items-end overflow-hidden text-right leading-snug">
					{#each ramo.profesor as professor (professor)}
						<div class="my-auto truncate text-sm font-medium">
							{#if professor.includes('NN')}
								<span class="opacity-50">{professor}</span>
							{:else}
								<button
									type="button"
									class="group inline-flex cursor-help items-center justify-end gap-1 rounded-sm align-middle outline-none focus-visible:ring-2"
									onclick={(e) => {
										// Isolates execution contexts to prevent implicit section selection toggles
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
			</div>
		</div>
	{/each}
</div>

<DialogComponent
	open={!!inspectedProfessor}
	onclose={() => (inspectedProfessor = null)}
	class="max-w-md gap-0 p-4"
	showCloseButton={false}
>
	{#if inspectedProfessor}
		<ProfessorCard id={inspectedProfessor} />
	{/if}
</DialogComponent>
