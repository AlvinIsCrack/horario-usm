<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import { BLOQUE_COMIDA, BLOQUE_DURATION_MINUTES } from '$lib/constants/usm';
	import Time from '$lib/helpers/time';
	import GroupedCell from './GroupedCell.svelte';
	import _ from 'lodash';
	import { fade } from 'svelte/transition';
	import ForkSpoon from '$lib/icons/fork-spoon.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { Días } from '$lib/types/horario';

	const [bloqueBegin, bloqueEnd] = $derived(Calendario.bloqueRange);
	const [díaBegin, díaEnd] = $derived(Calendario.range);
	const numDias = $derived(díaEnd - díaBegin + 1);
	const bloquePairs = $derived.by(() => {
		const pairs = [];
		for (let i = bloqueBegin; i <= bloqueEnd; i += 2) pairs.push(i);
		return pairs;
	});
</script>

<div transition:fade class="relative h-full w-full">
	{#if !Calendario.visible}
		{#await import('../elements/Title.svelte') then { default: Title }}
			<div class="absolute flex h-full w-full items-center justify-center">
				<Title />
			</div>
		{/await}
	{:else}
		<div
			id="calendar-main"
			transition:fade={{ duration: 200 }}
			class="calendar-grid absolute h-full w-full"
			style="--num-dias: {numDias};"
		>
			<div class="opacity-0"></div>
			<div class="opacity-0"></div>
			{#each _.range(díaBegin, díaEnd + 1) as día (día)}
				{@const dayName = Días[día]}

				<div
					class="text-foreground -mb-1 flex gap-1.5 text-sm font-bold uppercase transition-colors duration-300 select-none"
				>
					{dayName}
				</div>
			{/each}

			{#each bloquePairs as bloquePar, i (bloquePar)}
				<div class="flex w-3 items-center justify-center text-xs font-bold select-none">
					<div class="rotate-180 text-center text-lg font-bold [writing-mode:vertical-rl]">
						<span class="whitespace-nowrap">{bloquePar + 1} — {bloquePar}</span>
					</div>
				</div>

				{#key bloquePar}
					{@const bloqueComida = bloquePar - 1 === BLOQUE_COMIDA}
					<div class="relative h-full w-3">
						{#if bloqueComida}
							<div class="absolute -top-4 -right-2 z-50 translate-x-full">
								<Badge variant="primary" class="whitespace-nowrap">
									<ForkSpoon class="mr-1 inline scale-150" />
									Post-almuerzo
								</Badge>
							</div>
						{/if}
						<div
							class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-transparent text-xs font-bold select-none"
						>
							<div
								class="absolute top-0 left-0 h-full w-full animate-[bloque-animation_1s] rounded-sm bg-white opacity-0"
							></div>
							<div
								class="absolute top-1 z-50 flex w-full origin-top flex-col items-center justify-center"
							>
								<div class="rotate-180 items-center gap-2 text-center [writing-mode:vertical-rl]">
									<span>{Time.bloqueToHHMM(bloquePar)}</span><br />
								</div>
							</div>
							<div class="absolute bottom-1 flex w-full origin-bottom justify-center">
								<div class="rotate-180 font-light opacity-50 [writing-mode:vertical-rl]">
									<span
										>{Time.MinutesToHHMM(
											Time.bloqueToMinutes(bloquePar + 1) + BLOQUE_DURATION_MINUTES
										)}</span
									>
								</div>
							</div>
						</div>
					</div>
				{/key}

				{#each _.range(díaBegin, díaEnd + 1) as día (día)}
					<GroupedCell {día} bloque={bloquePar} />
				{/each}
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	@import 'tailwindcss';

	@keyframes -global-bloque-animation {
		0% {
			opacity: 1;
		}
	}

	.calendar-grid {
		display: grid;
		/* [!] Modificado: Se mantiene min-content para la hora, pero las filas ahora son flexibles */
		grid-template-columns: min-content auto repeat(var(--num-dias), 1fr);
		grid-template-rows: 0fr; /* Header row */

		/* ANTES: grid-auto-rows: auto; */
		/* AHORA: Define un alto mínimo (ej. 6rem) pero permite crecer (1fr) para llenar pantallas grandes */
		grid-auto-rows: minmax(6rem, 1fr);

		@apply h-full w-full gap-1 overflow-visible;
	}
</style>
