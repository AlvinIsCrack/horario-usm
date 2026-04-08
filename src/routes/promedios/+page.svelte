<script module>
	class OptimizadorPageManager {
		graph: Graph | null = $state(null);
		calculating: boolean = $state(false);
		finalGrade: number | null = $state(null);
		engine: Engine | null = $state(null);

		constructor() {
			this.reset();
		}

		reset() {
			this.graph = null;
			this.engine = null;
			this.calculating = false;
			this.finalGrade = null;
		}

		init(graph: Graph) {
			this.graph = { ...graph };
			this.engine = new Engine(this.graph);
		}
	}

	export const PromediosPageState = new OptimizadorPageManager();
</script>

<script lang="ts">
	import { Engine } from '$lib/logic/promedios/engine';
	import type { Graph } from '$lib/logic/promedios/types';
	import { onDestroy, onMount } from 'svelte';
	import { SidebarState } from '$lib/logic/sidebar/state.svelte';
	import OptimizadorWindow from '$lib/components/sidebar/windows/PromediosWindow.svelte';
	import { fade } from 'svelte/transition';
	import GraphVisualizer from '$lib/logic/promedios/components/GraphVisualizer.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { toast } from '$lib/components/ui/sonner/ctx.svelte';
	import { Solver } from '$lib/logic/promedios/solver';
	import Button from '$lib/components/ui/Button.svelte';
	import MaterialSymbolsAutoFix from '$lib/icons/MaterialSymbolsAutoFix.svelte';

	onMount(() => {
		SidebarState.open(
			OptimizadorWindow,
			{},
			{
				title: 'Calculadora de promedios',
				description: 'Selecciona un ramo pre-cargado o diseña tu propia estrategia'
			}
		);
	});

	onDestroy(() => {
		SidebarState.reset();
		PromediosPageState.reset();
	});

	const passing = $derived(Math.round(PromediosPageState.finalGrade ?? 0) >= 55);

	async function handleOptimize() {
		const targetNode = PromediosPageState.graph!.nodes.find((n) => n.id === 'nf');
		if (!targetNode) {
			toast.error("Error: No se encontró el nodo final 'nf'");
			return;
		}

		const missing = PromediosPageState.graph!.nodes.filter(
			(n) => n.type === 'input_grade' && n.data.value === null
		);
		if (missing.length === 0) {
			toast.info('No hay notas pendientes para calcular.');
			return;
		}

		try {
			const solver = new Solver(PromediosPageState.graph!);

			const TARGET_GRADE = 55;
			const solution = await solver.calculateRequirementsForAllMissing('nf', TARGET_GRADE);

			if (solution === null) {
				toast.error('Imposible aprobar con las condiciones actuales (incluso con 100).');
				return;
			}

			let appliedCount = 0;
			Object.entries(solution).forEach(([id, val]) => {
				const node = PromediosPageState.graph!.nodes.find((n) => n.id === id);
				if (node) {
					if (val !== null) {
						node.data.value = val;
						appliedCount++;
					}
				}
			});

			if (appliedCount > 0) {
				toast.success(`Calculado: Se rellenaron ${appliedCount} notas para aprobar.`);
			} else {
				toast.success('¡Ya cumples los requisitos con las notas actuales!');
			}
		} catch (e) {
			console.error(e);
			toast.error('Ocurrió un error al intentar optimizar.');
		} finally {
		}
	}
</script>

<div
	class="mx-auto h-screen max-h-full w-full max-w-6xl space-y-4 overflow-y-auto p-6 pb-24 md:p-10"
>
	<div class="absolute top-0 left-0 size-full bg-[#111]">
		{#if PromediosPageState.engine && PromediosPageState.graph}
			<GraphVisualizer />
			<!-- <Button class="absolute! bottom-2 left-2" onclick={handleOptimize}>
				<MaterialSymbolsAutoFix class="mr-1 inline size-4" />
				<span>Calcular mínimo de aprobación</span>
			</Button> -->
		{/if}
	</div>

	{#if PromediosPageState.graph}
		<div transition:fade={{ duration: 200 }} class="absolute top-4 right-4 w-xs">
			<Card class="shadow-sm/50!">
				<h2 class="text-muted-foreground mb-4 text-xs font-bold uppercase">
					{PromediosPageState.finalGrade === null ? 'Esperando notas...' : 'Calificación Actual'}
				</h2>

				<div class="flex w-full items-end justify-end gap-2">
					<span
						class="text-6xl font-black tracking-tighter {PromediosPageState.finalGrade === null
							? 'text-muted-foreground/80'
							: passing
								? 'text-lime-500 drop-shadow-md drop-shadow-lime-600/50'
								: 'text-red-500 drop-shadow-md drop-shadow-red-600/50'}"
					>
						{PromediosPageState.finalGrade?.toFixed(2) ?? '--'}
					</span>
					<span class="text-muted-foreground text-xl font-bold">/100</span>
				</div>

				<div class="flex w-full flex-row justify-end">
					{#if PromediosPageState.finalGrade !== null}
						<div class="flex flex-col gap-2">
							<span
								class="w-fit rounded border px-2 py-1 text-[10px] font-bold tracking-wider uppercase {passing
									? 'bg-lime-600/20 text-lime-400'
									: 'bg-red-600/20 text-red-400'}"
							>
								{passing ? 'Aprobado' : 'Reprobando'}
							</span>
						</div>
					{/if}
				</div>

				{#if PromediosPageState.calculating}
					<div class="absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
				{/if}
			</Card>
		</div>
	{:else}{/if}
</div>
