<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import { fade } from 'svelte/transition';
	import Diffs from '$lib/core/changes/components/Diffs.svelte';
	import { SmartReadTracker } from '$lib/core/changes/readStatus';
	import jsonlContent from '$lib/data/historial_cambios.jsonl?raw';
	import { onMount } from 'svelte';
	import { Config } from '$lib/core/config/store.svelte';
	import { SettingsDialogState } from '$lib/core/config/components/dialog/SettingsDialog.svelte';
	import Tooltip from '../ui/Tooltip.svelte';
	import MaterialSymbolsRefresh from '$lib/icons/MaterialSymbolsRefresh.svelte';
	import Button from '../ui/Button.svelte';

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

	// Extrae y filtra linealmente los semestres disponibles para la Sede y Jornada activas en el Config
	let semestresDisponibles = $derived(
		Config.sede && Config.jornada
			? (Data.semestres[Config.sede]?.[Config.jornada] || []).filter((semestreKey: string) => {
					const semestreData = Data.ASIGNATURAS[Config.sede]?.[Config.jornada]?.[semestreKey];
					return semestreData && Object.keys(semestreData).length > 0;
				})
			: []
	);

	let semestreMasReciente = $derived(
		semestresDisponibles.length > 0
			? [...semestresDisponibles].sort((a, b) => b.localeCompare(a))[0]
			: null
	);

	let hayNuevoSemestre = $derived(
		semestreMasReciente &&
			Config.semestre &&
			semestreMasReciente !== Config.semestre &&
			semestreMasReciente > Config.semestre
	);
</script>

{#if visible}
	<div
		transition:fade={{ duration: 400 }}
		class="relative h-full w-full overflow-hidden select-none"
	>
		<img
			src="https://home.ripley.cl/minisitios/estatico/calefaccion/img/prod_estufagas.png"
			alt="Estufita a gas"
			draggable="false"
			class="pointer-events-none absolute right-8 bottom-0 w-40"
		/>

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
						class="mb-2 text-center text-xl font-black
								tracking-tight lg:text-3xl xl:text-4xl"
					>
						INFORMACIÓN DE RAMOS ACTUALIZADA HACE
					</span>
					<div
						class="font-gothic-expanded text-foreground w-full
							text-center text-7xl
							leading-[0.85] font-black
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

				{#if Config.sede && Config.jornada && Config.semestre}
					<div
						class="text-muted-foreground [&_span]:text-foreground! mt-4 inline-flex items-center gap-1.5 text-base"
					>
						Consultando la malla del semestre
						<Tooltip
							content={hayNuevoSemestre
								? `Semestre ${semestreMasReciente} disponible`
								: 'Cambiar configuración'}
						>
							<Button
								onclick={() => SettingsDialogState.open()}
								size="sm"
								startDecorator={MaterialSymbolsRefresh}
							>
								{Config.semestre}

								{#if hayNuevoSemestre}
									<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
										<span
											class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75"
										></span>
										<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
									</span>
								{/if}
							</Button>
						</Tooltip>
						para <span class="font-medium">{Config.sede}</span>, jornada
						<span class="font-medium">{Config.jornada}</span>.
					</div>
				{/if}
			</div>

			<!-- <div class="mt-4">
				<Changelog />
			</div> -->

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

		<!-- <div class="absolute top-1/2 right-0 z-50 -mr-2 -translate-y-1/2">
			{#if !showChanges}
				<div transition:fade={{ duration: 200 }} class="flex items-center gap-1 pr-1">
					<Button
						variant="ghost"
						class="hover:bg-foreground/5 relative h-24 w-12 rounded-full!"
						onclick={() => (showChanges = true)}
					>
						<MaterialSymbolsArrowLeftAlt
							class="size-10 scale-200 rotate-180 opacity-50 transition-opacity hover:opacity-100"
						/>

						{#if hasNewChanges}
							<span class="absolute top-7 right-1 flex h-3 w-3">
								<span
									class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400"
								></span>
								<span class="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
							</span>
						{/if}
					</Button>

					<span
						class="text-foreground rotate-180 text-sm font-black tracking-wider uppercase select-none [writing-mode:vertical-rl]"
					>
						Cambios SIGA
					</span>
				</div>
			{/if}
		</div> -->

		<!-- <div class="absolute top-1/2 left-0 z-50 -ml-2 -translate-y-1/2">
			{#if showChanges}
				<div transition:fade={{ duration: 200 }} class="flex items-center gap-1 pl-1">
					<span
						class="text-foreground text-sm font-black tracking-wider uppercase select-none [writing-mode:vertical-rl]"
					>
						Volver
					</span>

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
		</div> -->
	</div>
{/if}
