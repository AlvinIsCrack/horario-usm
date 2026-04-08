<script lang="ts">
	import { toast, type ToastOptions } from '$lib/components/ui/sonner/ctx.svelte';
	import type { ExecutionLog, Graph, NodeId } from '$lib/logic/promedios/types';
	import pkg from 'lodash';
	const { debounce } = pkg;
	import { PromediosPageState } from '../../../../routes/promedios/+page.svelte';

	let logs = $state<ExecutionLog[]>([]);

	const debouncedUpdate = debounce(() => {
		calculate();
	}, 150);

	let groups = $derived.by(() => {
		const g: Record<string, any[]> = {
			Certámenes: [],
			Controles: [],
			Tareas: [],
			Laboratorios: [],
			Otros: []
		};
		const patterns = [
			{ key: 'Certámenes', regex: /certamen|prueba|parcial|global/i },
			{ key: 'Controles', regex: /control|quiz|test|bocado/i },
			{ key: 'Tareas', regex: /tarea|entrega|proyecto/i },
			{ key: 'Laboratorios', regex: /lab|experiencia|informe/i }
		];

		if (!PromediosPageState.graph) return [];

		const sortedNodes = PromediosPageState.graph!.nodes.filter(
			(n) => n.type === 'input_grade'
		).sort((a, b) => Number(a.optional ?? false) - Number(b.optional ?? false));

		sortedNodes.forEach((node) => {
			const label = node.label || '';
			const match = patterns.find((p) => p.regex.test(label));
			if (match) g[match.key].push(node);
			else g['Otros'].push(node);
		});

		return Object.entries(g)
			.filter(([_, nodes]) => nodes.length > 0)
			.map(([name, nodes]) => ({
				name,
				nodes
			}));
	});

	let logsByNode = $derived.by(() => {
		const map: Record<NodeId, ExecutionLog[]> = {};
		const seen = new Set<string>();

		logs.forEach((log) => {
			if (log.targetNodeId) {
				const uniqueKey = `${log.targetNodeId}|${log.message}`;

				if (!seen.has(uniqueKey)) {
					if (!map[log.targetNodeId]) map[log.targetNodeId] = [];
					map[log.targetNodeId].push(log);
					seen.add(uniqueKey);
				}
			}
		});
		return map;
	});

	let shownSignatures = new Set<string>();

	$effect(() => {
		// Si el motor limpió los logs (array vacío), reseteamos nuestro historial
		if (logs.length === 0) {
			shownSignatures.clear();
			return;
		}

		const globalLogs = logs.filter((l) => !l.targetNodeId && !l.targetIndex);

		for (const log of globalLogs) {
			// Creamos una firma única para este aviso
			const signature = `${log.type}|${log.message}`;

			// Si ya mostramos este mensaje, lo saltamos
			if (shownSignatures.has(signature)) continue;

			// Lo marcamos como visto y lanzamos el toast
			shownSignatures.add(signature);

			const toastOptions: ToastOptions = {};
			switch (log.type) {
				case 'error':
					toast.error(log.message, toastOptions);
					break;

				case 'drop':
				case 'replace':
				case 'warning':
					toast.warning(log.message, toastOptions);
					break;

				case 'success':
					toast.success(log.message, toastOptions);
					break;

				case 'info':
				default:
					toast.info(log.message, toastOptions);
					break;
			}
		}
	});

	function isMissingRequired(node: any) {
		return !node.optional && node.data.value === null;
	}

	function validateAndNotify(node: any) {
		if (!Number.isNaN(node.data.value)) {
			if (node.data.value > 100) {
				node.data.value = 100;
			} else if (node.data.value < 0) {
				node.data.value = 0;
			}
		}

		debouncedUpdate();
	}

	$effect(() => {
		const _ = PromediosPageState.graph;
		calculate();
	});

	async function calculate() {
		if (!PromediosPageState.graph || !PromediosPageState.engine) return;

		PromediosPageState.calculating = true;
		PromediosPageState.engine.reset();

		PromediosPageState.finalGrade = (await PromediosPageState.engine.evaluate('nf')) as number;
		logs = PromediosPageState.engine.getLogs();

		PromediosPageState.calculating = false;
	}
</script>

{#each groups as group (group.name)}
	<button class="bg-muted mb-2 flex w-full items-center justify-between text-left">
		<span
			class="text-foreground flex items-center gap-2 text-base font-bold tracking-wider uppercase"
		>
			{group.name}
		</span>
	</button>

	<div class="grid grid-cols-1 gap-4">
		{#each group.nodes as node}
			{@const nodeLogs = logsByNode[node.id] || []}
			{@const isDropped = nodeLogs.some((l) => l.type === 'drop')}
			{@const isReplaced = nodeLogs.some((l) => l.type === 'replace')}

			<div class="flex flex-col gap-1.5">
				<div class="relative flex items-end justify-between">
					<label class="truncate pr-2 text-xs font-medium text-zinc-400" for={node.id}>
						{node.label}
						{#if !node.optional}
							<span class="font-bold text-red-400!"> * </span>
						{/if}
					</label>

					{#if isReplaced}
						<div class="absolute right-0 text-xs text-amber-500 italic">Reemplazado</div>
					{/if}

					{#if isDropped}
						<div class="absolute right-0 text-xs text-sky-500 italic">Ignorado</div>
					{/if}
				</div>

				<div class="group/input relative">
					<input
						id={node.id}
						type="number"
						min="0"
						max="100"
						placeholder={isMissingRequired(node) ? 'Nota requerida' : 'Pendiente'}
						class="w-full rounded border px-3 py-2 text-base tabular-nums transition-all focus:ring-1! focus:outline-none
                                    {isMissingRequired(node)
							? ' border-red-500! text-red-200 placeholder:text-rose-300/50 focus:border-red-500 focus:ring-red-500'
							: node.optional
								? ''
								: 'focus:border-lime-500 focus:ring-lime-600'}
                                    "
						bind:value={node.data.value}
						oninput={() => validateAndNotify(node)}
					/>
					{#if node.data.value !== null}
						<button
							class="absolute top-1/2 right-2 -translate-y-1/2 px-1 text-[10px] font-bold text-slate-500 uppercase opacity-0 transition-opacity group-hover/input:opacity-100 hover:text-red-400"
							onclick={() => {
								node.data.value = null;
								calculate();
							}}
							title="Marcar como pendiente"
						>
							X
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/each}
