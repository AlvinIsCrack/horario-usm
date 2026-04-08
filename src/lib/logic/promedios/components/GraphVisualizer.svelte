<script lang="ts">
	import type { Graph, NodeId } from '../types';
	import { nodeStyles, connectionStyles, simpleNodeStyles } from '../styles';
	import {
		generateWirePath,
		getNodePortPosition,
		SIMPLE_NODE_WIDTH,
		SIMPLE_NODE_HEIGHT,
		SIMPLE_CIRCLE_SIZE
	} from '../visuals';
	import { NODE_REGISTRY } from '../nodes';
	import MaterialSymbolsCircleNotifications from '$lib/icons/MaterialSymbolsCircleNotifications.svelte';
	import MaterialSymbolsFunction from '$lib/icons/MaterialSymbolsFunction.svelte';
	import { PromediosPageState } from '../../../../routes/promedios/+page.svelte';

	let {
		viewMode = 'simple'
	}: {
		viewMode?: 'simple' | 'advanced';
	} = $props();

	function isCompact(type: string): boolean {
		return ['notifier', 'logic_not', 'trigger'].includes(type);
	}

	// --- CÁMARA E INTERACCIÓN ---
	// 1. Límites del grafo (Derivado de positions)
	let graphBounds = $derived.by(() => {
		if (PromediosPageState.graph!.nodes.length === 0) return null;
		let minX = Infinity,
			maxX = -Infinity,
			minY = Infinity,
			maxY = -Infinity;

		PromediosPageState.graph!.nodes.forEach((node) => {
			const pos = positions[node.id] || { x: 0, y: 0 };
			const def = NODE_REGISTRY[node.type];
			// Estimación de tamaño (debe coincidir con la renderización)
			const inputsCount = Object.keys(def?.inputs || {}).length;
			const outputsCount = Object.keys(def?.outputs || {}).length;
			const h = 40 + inputsCount * 36 + outputsCount * 36 + 20;
			const w = 260; // NODE_WIDTH

			if (pos.x < minX) minX = pos.x;
			if (pos.x + w > maxX) maxX = pos.x + w;
			if (pos.y < minY) minY = pos.y;
			if (pos.y + h > maxY) maxY = pos.y + h;
		});

		return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
	});

	// 2. Estado de la cámara (Zoom y Pan)
	let camera = $state({ x: 0, y: 0, k: 1 });
	let isDragging = $state(false);
	let dragStart = { x: 0, y: 0 };
	let cameraStart = { x: 0, y: 0 };

	// 3. Auto-ajuste inicial (Fit to Screen)
	$effect(() => {
		// Se ejecuta cuando cambia la estructura del grafo
		PromediosPageState.graph!.nodes.length;
		if (containerW > 0 && graphBounds) {
			fitToScreen();
		}
	});

	function fitToScreen() {
		if (!graphBounds || containerW === 0) return;
		const { minX, maxX, minY, maxY, w, h } = graphBounds;
		const PADDING = 100;

		// Calcular escala para encajar
		const scaleX = (containerW - PADDING) / w;
		const scaleY = (containerH - PADDING) / h;
		const k = Math.min(Math.min(scaleX, scaleY), 1.2); // Tope de zoom inicial

		// Centrar
		const cx = minX + w / 2;
		const cy = minY + h / 2;

		camera = {
			x: containerW / 2 - cx * k,
			y: containerH / 2 - cy * k,
			k
		};
	}

	// 4. Lógica de Restricciones (Clamping)
	function constrainCamera(target: { x: number; y: number; k: number }) {
		if (!graphBounds) return target;

		// A. Limitar Zoom
		const MIN_ZOOM = 0.1;
		const MAX_ZOOM = 3.0;
		const k = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target.k));

		// B. Limitar Desplazamiento (Bounding Box)
		// Regla: Al menos 'OVERLAP' píxeles del grafo deben permanecer visibles
		const { minX, maxX, minY, maxY } = graphBounds;
		const OVERLAP = 100;

		// Límite Inferior X: El borde derecho del grafo (maxX) no debe irse muy a la izquierda
		const minCamX = OVERLAP - maxX * k;
		// Límite Superior X: El borde izquierdo del grafo (minX) no debe irse muy a la derecha
		const maxCamX = containerW - minX * k - OVERLAP;

		// Idem para Y
		const minCamY = OVERLAP - maxY * k;
		const maxCamY = containerH - minY * k - OVERLAP;

		// Aplicamos clamp (asegurando min < max por seguridad)
		const x = Math.max(minCamX, Math.min(maxCamX, target.x));
		const y = Math.max(minCamY, Math.min(maxCamY, target.y));

		return { x, y, k };
	}

	// 5. Manejadores de Eventos
	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		const zoomIntensity = 0.001;
		// Zoom exponencial para suavidad
		const newK = camera.k * Math.exp(-e.deltaY * zoomIntensity);

		// Zoom hacia el puntero del mouse
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Proyectar mouse al mundo, escalar, y reproyectar
		const worldX = (mouseX - camera.x) / camera.k;
		const worldY = (mouseY - camera.y) / camera.k;

		const nextCam = {
			k: newK,
			x: mouseX - worldX * newK,
			y: mouseY - worldY * newK
		};

		camera = constrainCamera(nextCam);
	}

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0) return; // Solo click izquierdo
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		isDragging = true;
		dragStart = { x: e.clientX, y: e.clientY };
		cameraStart = { ...camera };
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;

		camera = constrainCamera({
			...camera,
			x: cameraStart.x + dx,
			y: cameraStart.y + dy
		});
	}

	function handlePointerUp(e: PointerEvent) {
		isDragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}

	let nodeValues = $state<Record<NodeId, any>>({});
	let containerW = $state(1000);
	let containerH = $state(800);

	$effect(() => {
		if (!PromediosPageState.calculating) {
			// Forzamos reactividad leyendo graph.nodes.length
			PromediosPageState.graph!.nodes.length;
			updateVisualization();
		}
	});

	let currentAnimationId = 0;
	async function updateVisualization() {
		// 1. Incrementamos el ID de animación para invalidar ejecuciones anteriores
		const animId = ++currentAnimationId;

		// 2. Calculamos el estado final "ideal" (Snapshot del futuro)
		const targetValues: Record<NodeId, any> = {};
		for (const node of PromediosPageState.graph!.nodes) {
			const state = PromediosPageState.engine!.getNodeState(node.id);
			if (state) {
				targetValues[node.id] = state;
			} else if (node.type === 'input_grade' && node.data.value !== null) {
				targetValues[node.id] = { value: node.data.value };
			}
		}

		// 3. Calculamos la profundidad (Depth) para saber el orden de propagación.
		// (Reutilizamos la lógica BFS que usas para el layout, pero simplificada para lógica)
		const depths: Record<string, number> = {};
		const incomingEdges: Record<string, string[]> = {};
		PromediosPageState.graph!.nodes.forEach((n) => (incomingEdges[n.id] = []));
		PromediosPageState.graph!.connections.forEach((c) => {
			if (incomingEdges[c.toNode]) incomingEdges[c.toNode].push(c.fromNode);
		});

		const getDepth = (id: string, stack: string[] = []): number => {
			if (depths[id] !== undefined) return depths[id];
			// Protección contra ciclos
			if (stack.includes(id)) return 0;

			const parents = incomingEdges[id] || [];
			if (parents.length === 0) {
				depths[id] = 0;
				return 0;
			}
			const parentDepths = parents.map((p) => getDepth(p, [...stack, id]));
			const d = Math.max(...parentDepths) + 1;
			depths[id] = d;
			return d;
		};

		// Calculamos profundidad para todos
		PromediosPageState.graph!.nodes.forEach((n) => getDepth(n.id));

		// 4. Determinar la profundidad máxima para el bucle
		const maxDepth = Object.values(depths).length > 0 ? Math.max(...Object.values(depths)) : 0;

		// 5. ANIMACIÓN POR CAPAS (Propagación)
		// Iteramos desde la capa 0 (Inputs) hasta la última (Nota Final)
		for (let d = 0; d <= maxDepth; d++) {
			// Si otra animación comenzó mientras esperábamos, abortamos esta
			if (animId !== currentAnimationId) return;

			// Buscamos todos los nodos de esta capa
			const nodesInLayer = PromediosPageState.graph!.nodes.filter((n) => (depths[n.id] ?? 0) === d);

			// Actualizamos SOLO los nodos de esta capa en el estado visual
			// Esto dispara la reactividad de Svelte y "enciende" los cables que salen de ellos
			for (const node of nodesInLayer) {
				if (targetValues[node.id]) {
					nodeValues[node.id] = targetValues[node.id];
				}
			}

			// Pausa dramática para que el ojo humano vea el flujo
			// 100ms es un buen equilibrio entre "rápido" y "visible"
			if (nodesInLayer.length > 0) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}
	}

	/**
	 * Verifica si un valor es "significativo" para iluminar el grafo.
	 * Descarta nulls, undefineds y arrays llenos de nulls.
	 */
	function hasValidContent(val: any): boolean {
		if (val === null || val === undefined) return false;
		if (Array.isArray(val)) {
			// Un array es válido solo si tiene contenido real (no solo huecos)
			return val.length > 0 && val.some((item) => item !== null && item !== undefined);
		}
		return true; // Números, booleanos, strings cuentan como datos
	}

	/**
	 * Determina si un nodo debe estar ENCENDIDO (Active)
	 */
	function isNodeActive(outputs: any): boolean {
		if (!outputs) return false;
		// El nodo está activo si ALGUNA de sus salidas tiene contenido válido
		return Object.values(outputs).some((v) => hasValidContent(v));
	}

	function extractDisplayValue(outputs: any, outputKey: string): string | number | null {
		if (!outputs) return null;
		const val = outputs[outputKey];
		if (typeof val === 'number') return Math.round(val * 100) / 100;
		if (typeof val === 'boolean') return null; // Los booleanos van como Badge
		if (Array.isArray(val)) return `Lista(${val.length})`;
		if (val === null) return null;
		return val;
	}

	function getDebugBadge(
		nodeType: string,
		outputs: any
	): { label: string; state: 'success' | 'failure' | 'warning' | 'neutral' } | null {
		if (!outputs) return null;
		// Solo mostramos badges si el nodo tiene datos válidos (para evitar badges "FAIL" en nodos vacíos)
		if (!isNodeActive(outputs)) return null;

		if (nodeType === 'threshold_gate')
			return outputs.pass
				? { label: 'PASS', state: 'success' }
				: { label: 'FAIL', state: 'failure' };
		if (nodeType === 'ncr_gate')
			return outputs.is_ncr
				? { label: 'VETADO', state: 'failure' }
				: { label: 'OK', state: 'success' };
		if (typeof outputs.out === 'boolean')
			return outputs.out
				? { label: 'TRUE', state: 'success' }
				: { label: 'FALSE', state: 'failure' };
		if (typeof outputs.value === 'boolean')
			return outputs.value
				? { label: 'TRUE', state: 'success' }
				: { label: 'FALSE', state: 'failure' };
		return null;
	}

	// --- LAYOUT y CÁMARA (Sin cambios) ---
	let positions = $derived.by(() => {
		const pos: Record<string, { x: number; y: number }> = {};
		const depths: Record<string, number> = {};
		const incomingEdges: Record<string, string[]> = {};
		PromediosPageState.graph!.nodes.forEach((n) => (incomingEdges[n.id] = []));
		PromediosPageState.graph!.connections.forEach((c) => {
			if (incomingEdges[c.toNode]) incomingEdges[c.toNode].push(c.fromNode);
		});
		const getDepth = (id: string, stack: string[] = []): number => {
			if (depths[id] !== undefined) return depths[id];
			if (stack.includes(id)) return 0;
			const parents = incomingEdges[id] || [];
			if (parents.length === 0) {
				depths[id] = 0;
				return 0;
			}
			const parentDepths = parents.map((p) => getDepth(p, [...stack, id]));
			const d = Math.max(...parentDepths) + 1;
			depths[id] = d;
			return d;
		};
		PromediosPageState.graph!.nodes.forEach((n) => getDepth(n.id));
		const columns: Record<number, string[]> = {};
		Object.entries(depths).forEach(([id, depth]) => {
			if (!columns[depth]) columns[depth] = [];
			columns[depth].push(id);
		});

		const COLUMN_WIDTH = viewMode === 'simple' ? 200 : 320;
		const BASE_GAP_Y = viewMode === 'simple' ? 30 : 50;
		let maxColumnHeight = 0;

		const columnHeights: Record<number, number> = {};
		Object.entries(columns).forEach(([depthStr, nodeIds]) => {
			const depth = parseInt(depthStr);
			let currentH = 0;
			nodeIds.forEach((nodeId) => {
				const node = PromediosPageState.graph!.nodes.find((n) => n.id === nodeId);
				const def = NODE_REGISTRY[node?.type || ''];
				const h =
					40 +
					Object.keys(def?.inputs || {}).length * 36 +
					Object.keys(def?.outputs || {}).length * 36 +
					20;
				currentH += h + BASE_GAP_Y;
			});
			columnHeights[depth] = currentH;
			if (currentH > maxColumnHeight) maxColumnHeight = currentH;
		});
		Object.entries(columns).forEach(([depthStr, nodeIds]) => {
			const depth = parseInt(depthStr);
			const colHeight = columnHeights[depth];
			const startY = (maxColumnHeight - colHeight) / 2;
			let currentY = 50 + startY;
			nodeIds.forEach((nodeId) => {
				const node = PromediosPageState.graph!.nodes.find((n) => n.id === nodeId);
				const def = NODE_REGISTRY[node?.type || ''];
				const h =
					40 +
					Object.keys(def?.inputs || {}).length * 36 +
					Object.keys(def?.outputs || {}).length * 36 +
					20;
				pos[nodeId] = { x: 50 + depth * COLUMN_WIDTH, y: currentY };
				currentY += h + BASE_GAP_Y;
			});
		});
		return pos;
	});
</script>

<div
	class="relative size-full touch-none overflow-hidden transition-colors duration-300 select-none
    {PromediosPageState.calculating ? 'border-amber-500/50' : 'border-zinc-800'}
	{isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
	bind:clientWidth={containerW}
	bind:clientHeight={containerH}
	onwheel={handleWheel}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointerleave={handlePointerUp}
>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.1]"
		style="background-image: radial-gradient(circle, #ffffff 2px, transparent 2px); background-size: {20 *
			camera.k}px {20 * camera.k}px; background-position: {camera.x}px {camera.y}px;"
	></div>

	<!-- <div class="absolute top-4 left-4 z-50 flex gap-2">
		<div
			class="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase shadow-lg backdrop-blur"
		>
			{#if isCalculating}
				<div class="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
				<span class="text-amber-500">Calculando...</span>
			{:else}
				<div class="h-2 w-2 rounded-full bg-emerald-500"></div>
				<span class="text-emerald-500">Live Monitor</span>
			{/if}
		</div>
	</div> -->

	<div
		class="absolute inset-0 h-full w-full origin-top-left transition-transform duration-0 ease-linear"
		style="transform: translate({camera.x}px, {camera.y}px) scale({camera.k});"
	>
		<svg
			class="pointer-events-none absolute top-0 left-0 z-0 h-[5000px] w-[5000px] overflow-visible"
		>
			{#each PromediosPageState.graph!.connections as conn}
				{@const fromNode = PromediosPageState.graph!.nodes.find((n) => n.id === conn.fromNode)}
				{@const toNode = PromediosPageState.graph!.nodes.find((n) => n.id === conn.toNode)}
				{#if fromNode && toNode}
					{@const fromPos = positions[conn.fromNode] || { x: 0, y: 0 }}
					{@const toPos = positions[conn.toNode] || { x: 0, y: 0 }}
					{@const fromDef = NODE_REGISTRY[fromNode.type]}
					{@const toDef = NODE_REGISTRY[toNode.type]}

					{@const isFromCompact = isCompact(fromNode.type)}
					{@const isToCompact = isCompact(toNode.type)}

					{@const fromInputCount = Object.keys(fromDef?.inputs || {}).length}
					{@const fromOutIndex = Object.keys(fromDef?.outputs || {}).indexOf(conn.fromPort)}
					{@const toInputCount = Object.keys(toDef?.inputs || {}).length}
					{@const toInIndex = Object.keys(toDef?.inputs || {}).indexOf(conn.toPort)}

					{@const start = getNodePortPosition(
						fromPos.x,
						fromPos.y,
						false,
						fromOutIndex === -1 ? 0 : fromOutIndex,
						fromInputCount,
						viewMode,
						isFromCompact
					)}
					{@const end = getNodePortPosition(
						toPos.x,
						toPos.y,
						true,
						toInIndex === -1 ? 0 : toInIndex,
						toInputCount,
						viewMode,
						isToCompact
					)}

					{@const sourceOutputs = nodeValues[conn.fromNode]}
					{@const sourceVal = sourceOutputs?.[conn.fromPort]}
					{@const isActiveWire = hasValidContent(sourceVal)}

					<path
						d={generateWirePath(start.x, start.y, end.x, end.y, 0.5)}
						class={connectionStyles({ state: isActiveWire ? 'active' : 'idle' })}
						style="vector-effect: non-scaling-stroke;"
					/>
				{/if}
			{/each}
		</svg>

		<div class="pointer-events-none absolute inset-0 z-10">
			{#each PromediosPageState.graph!.nodes as node (node.id)}
				{@const pos = positions[node.id] || { x: 0, y: 0 }}
				{@const def = NODE_REGISTRY[node.type]}
				{@const outputs = nodeValues[node.id]}
				{@const isActiveNode = isNodeActive(outputs)}
				{@const status = isActiveNode ? 'active' : 'idle'}

				{#if viewMode === 'simple'}
					{@const isComp = isCompact(node.type)}
					{@const sStyles = simpleNodeStyles({
						category: def?.category as any,
						status
					})}

					{#if isComp}
						<div
							class={sStyles.circle()}
							style="transform: translate({pos.x}px, {pos.y}px); width: {SIMPLE_CIRCLE_SIZE}px; height: {SIMPLE_CIRCLE_SIZE}px; top: 0; left: 0;"
						>
							{#if node.type === 'notifier'}
								<MaterialSymbolsCircleNotifications class="size-5" />
							{:else}
								<MaterialSymbolsFunction class="size-5" />
							{/if}
						</div>
					{:else}
						{@const mainVal =
							extractDisplayValue(outputs, 'value') ??
							extractDisplayValue(outputs, 'result') ??
							extractDisplayValue(outputs, 'final_grade') ??
							'--'}

						<div
							class={sStyles.base()}
							style="transform: translate({pos.x}px, {pos.y}px); width: {SIMPLE_NODE_WIDTH}px; height: {SIMPLE_NODE_HEIGHT}px; top: 0; left: 0;"
						>
							<span class={sStyles.label()}>{node.label}</span>
							<span class={sStyles.value()}
								>{typeof mainVal === 'string' ? mainVal : mainVal.toFixed(1)}</span
							>
						</div>
					{/if}
				{:else}
					{@const debugBadge = getDebugBadge(node.type, outputs)}
					{@const styles = nodeStyles({
						category: def?.category as any,
						status,
						badgeState: debugBadge?.state ?? 'neutral'
					})}

					<div
						class={styles.base()}
						style="transform: translate({pos.x}px, {pos.y}px); width: 260px; top: 0; left: 0;"
						role="group"
					>
						<div class={styles.header()}>
							<span class="truncate pr-2">{node.label}</span>
							<span class="font-mono text-[9px] opacity-60">{node.id}</span>
						</div>
						<div class={styles.body()}>
							{#if debugBadge}
								<div class="absolute top-2 right-2 z-20">
									<span class={styles.badge()}>{debugBadge.label}</span>
								</div>
							{/if}

							{#each Object.entries(def.inputs) as [key, input]}
								<div class={styles.row()}>
									<div class={styles.handleInput()}></div>
									<span class={styles.label()}>{input.label}</span>
									{#if node.type === 'input_grade' && node.data.value !== null}
										<span class={styles.value()}>{node.data.value}</span>
									{/if}
								</div>
							{/each}

							{#if Object.keys(def.inputs).length > 0 && Object.keys(def.outputs).length > 0}
								<div class="mx-2 my-1 h-px bg-white/10"></div>
							{/if}

							{#each Object.entries(def.outputs) as [key, output]}
								{@const displayVal = extractDisplayValue(outputs, key)}
								<div class={styles.row({ class: 'justify-end' })}>
									{#if displayVal !== null}
										<span
											class="{styles.value()} mr-3 origin-right scale-100 transition-all duration-300"
										>
											{displayVal}
										</span>
									{/if}
									<span class={styles.label({ class: 'text-right' })}>{output.label}</span>
									<div class={styles.handleOutput()}></div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<div class="pointer-events-none absolute inset-0 z-0">
			{#each PromediosPageState.graph!.groups as group (group.label)}
				{@const isGroupActive = group.nodes.some((id) => isNodeActive(nodeValues[id]))}
				{@const styles = nodeStyles({
					category: group?.category as any,
					status: isGroupActive ? 'active' : undefined
				})}

				{@const bounds = group.nodes.reduce(
					(acc, id) => {
						const pos = positions[id];
						if (!pos) return acc;

						const node = PromediosPageState.graph!.nodes.find((n) => n.id === id);
						if (!node) return acc;

						// Calcular tamaño del nodo según el modo de vista actual
						let w = 0,
							h = 0;
						if (viewMode === 'simple') {
							const isComp = isCompact(node.type);
							w = isComp ? SIMPLE_CIRCLE_SIZE : SIMPLE_NODE_WIDTH;
							h = isComp ? SIMPLE_CIRCLE_SIZE : SIMPLE_NODE_HEIGHT;
						} else {
							// Modo avanzado: recalcular altura basada en inputs/outputs
							w = 260; // Ancho fijo
							const def = NODE_REGISTRY[node.type];
							const iCount = Object.keys(def?.inputs || {}).length;
							const oCount = Object.keys(def?.outputs || {}).length;
							h = 40 + iCount * 36 + oCount * 36 + 20;
						}

						return {
							minX: Math.min(acc.minX, pos.x),
							minY: Math.min(acc.minY, pos.y),
							maxX: Math.max(acc.maxX, pos.x + w),
							maxY: Math.max(acc.maxY, pos.y + h)
						};
					},
					{ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
				)}

				{#if bounds.minX !== Infinity}
					{@const PADDING = 10}
					<div
						class="{styles.base()} absolute! overflow-visible! rounded-lg! border! bg-transparent! transition-all! duration-500 ease-out"
						style="
                            left: {bounds.minX - PADDING}px !important;
                            top: {bounds.minY - PADDING}px !important;
                            width: {bounds.maxX - bounds.minX + PADDING * 2}px !important;
                            height: {bounds.maxY - bounds.minY + PADDING * 2}px !important;
                            border-style: {isGroupActive ? 'solid' : 'dashed'} !important;
                        "
					>
						<div
							class="{styles.label()} absolute! -top-2 left-2 w-full max-w-full bg-none! text-left text-[10px] leading-none font-bold tracking-wider uppercase {isGroupActive
								? 'saturate-200!'
								: ''} transition-colors duration-300 text-shadow-sm/50!"
							class:grayscale-50={!isGroupActive}
						>
							{group.label}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
