<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import { fade } from 'svelte/transition';
	import Diffs from '../../logic/changes/components/Diffs.svelte';
	import Button from '../ui/Button.svelte';
	import MaterialSymbolsArrowLeftAlt from '$lib/icons/MaterialSymbolsArrowLeftAlt.svelte';
	import { SmartReadTracker } from '$lib/logic/changes/readStatus';
	import jsonlContent from '$lib/data/historial_cambios.jsonl?raw';
	import { onMount } from 'svelte';
	import Changelog from '$lib/logic/changes/components/Changelog.svelte';

	let visible = $state(false);
	let showChanges = $state(false);
	let hasNewChanges = $state(false);

	$effect(() => {
		setTimeout(() => {
			visible = true;
		}, 200);
	});

	onMount(() => {
		try {
			// Verificación inicial (backup para montaje rápido)
			const tracker = new SmartReadTracker({ storageKey: 'app_diffs_seen' });
			const lines = jsonlContent
				.trim()
				.split('\n')
				.filter((l) => l);
			const timestamps = lines.map((l) => JSON.parse(l).metadata.timestamp);
			const newItems = tracker.process(timestamps);
			hasNewChanges = newItems.size > 0;
		} catch (e) {
			console.error(e);
		}
	});
</script>

{#if visible}
	<div
		transition:fade={{ duration: 400 }}
		class="relative h-full w-full overflow-hidden select-none"
	>
		<div
			class="absolute inset-0 flex flex-col items-center justify-center transition-all duration-200 ease-in-out will-change-transform"
			class:opacity-0={showChanges}
			class:pointer-events-none={showChanges}
			class:-translate-x-4={showChanges}
			class:opacity-100={!showChanges}
			class:translate-x-0={!showChanges}
		>
			<div class="z-10 flex flex-col items-center justify-center">
				<div class="text-foreground peer flex cursor-help flex-col items-center">
					<span
						class="mb-1 text-center text-xl font-black
								tracking-tight opacity-70 lg:text-3xl xl:text-4xl"
					>
						INFORMACIÓN DE RAMOS ACTUALIZADA HACE
					</span>
					<div
						class="font-gothic-expanded text-foreground w-full
							text-center text-7xl
							leading-[0.85] font-black
							tracking-tighter
							uppercase lg:-mt-3 lg:text-8xl lg:leading-[0.8] xl:text-9xl"
					>
						{Data.updateDate?.fromNow().replace('hace', '').deaccent() ?? '...'}
					</div>
				</div>
				<div
					class="max-h-0 w-full text-center italic opacity-0 transition-all duration-500 peer-hover:max-h-8 peer-hover:opacity-50"
				>
					Actualizado el {Data.updateDate?.format('dddd D [de] MMM/YYYY[, a las] HH:mm')}
				</div>
			</div>

			<div class="mt-4">
				<Changelog />
			</div>

			<div class="absolute bottom-8 left-1/2 w-full -translate-x-1/2 px-4">
				<div class="mx-auto max-w-2xl text-center text-xs opacity-50">
					Esta página no está afiliada, asociada, autorizada, respaldada ni conectada de ninguna
					manera oficialmente con la <b>Universidad Técnica Federico Santa María</b> o cualquiera de
					sus subsidiarias o afiliadas. La página no recopila información, ni utiliza cookies de terceros.
				</div>
			</div>
		</div>

		<div
			class="absolute inset-0 h-full w-full px-4 pt-16 pb-4 transition-all duration-200 ease-in-out lg:px-20"
			class:opacity-0={!showChanges}
			class:pointer-events-none={!showChanges}
			class:translate-x-4={!showChanges}
			class:opacity-100={showChanges}
			class:translate-x-0={showChanges}
		>
			<Diffs bind:hasNewEvents={hasNewChanges} />
		</div>

		<div class="absolute top-1/2 right-0 z-50 -translate-y-1/2">
			{#if !showChanges}
				<div transition:fade class="flex items-center gap-2 pr-1">
					<Button
						variant="ghost"
						class="hover:bg-foreground/5 relative h-24 w-12 rounded-full!"
						onclick={() => (showChanges = true)}
					>
						<MaterialSymbolsArrowLeftAlt
							class="size-10 scale-200 rotate-180 opacity-50 transition-opacity hover:opacity-100"
						/>

						{#if hasNewChanges}
							<span class="absolute top-6 right-3 flex h-3 w-3">
								<span
									class="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"
								></span>
								<span class="relative inline-flex h-3 w-3 rounded-full bg-rose-500"></span>
							</span>
						{/if}
					</Button>

					<span
						class="text-muted-foreground/50 rotate-180 text-xs font-black tracking-wider uppercase select-none [writing-mode:vertical-rl]"
					>
						Cambios
					</span>
				</div>
			{/if}
		</div>

		<div class="absolute top-1/2 left-0 z-50 -translate-y-1/2 p-4">
			{#if showChanges}
				<div transition:fade>
					<Button
						variant="ghost"
						class="hover:bg-foreground/5 h-24 w-12 rounded-full!"
						onclick={() => (showChanges = false)}
					>
						<MaterialSymbolsArrowLeftAlt
							class="size-10 scale-200 opacity-50 transition-opacity hover:opacity-100"
						/>
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
