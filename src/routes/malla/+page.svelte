<script module>
	class MallaStateManager {
		malla?: MallaState;
	}

	export const MallaPageState = new MallaStateManager();
</script>

<script lang="ts">
	// Importaciones de lógica modularizada
	import { MallaState } from '$lib/core/malla/malla.svelte';
	import { getCenter, generatePath, romanize } from '$lib/core/malla/visuals';
	import { cardStyles } from '$lib/core/malla/styles';
	import type { Connection, RamoMalla } from '$lib/core/malla/types';

	// UI Components
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { draw } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onDestroy, onMount } from 'svelte';
	import MallaWindow from '$lib/components/sidebar/windows/MallaWindow.svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';

	// Instanciar Estado (Se carga automáticamente del localStorage en el constructor)
	const mallaState = new MallaState();
	onMount(() => {
		SidebarState.open(
			MallaWindow,
			{},
			{
				title: 'Malla Interactiva',
				description: 'Planifica tu trayectoria académica de forma visual e interactiva'
			}
		);
		MallaPageState.malla = mallaState;
	});

	onDestroy(() => {
		SidebarState.reset();
		MallaPageState.malla = undefined;
	});

	// --- Lógica de Interacción (Visual + Eventos) ---
	function handleRamoClick(ramo: RamoMalla) {
		mallaState.hoverSig = ramo.sigla;
		if ((ramo.esElectivo || ramo.esHumanista) && !mallaState.approvedSigs.has(ramo.sigla)) {
			setTimeout(() => {
				const name = prompt(`Nombre para el electivo ${ramo.sigla}:`, ramo.nombre);
				if (name) mallaState.setCustomName(ramo.sigla, name);
			}, 10);
		}
		mallaState.toggleRamo(ramo.sigla);
	}

	// 2. Cálculo de Líneas ($effect se queda aquí porque necesita el DOM)
	let connections = $state<Connection[]>([]);
	let containerRef = $state<HTMLDivElement>();

	$effect(() => {
		if (!mallaState.hoverSig || !containerRef) {
			connections = [];
			return;
		}

		const sourceEl = document.getElementById(`ramo-${mallaState.hoverSig}`);
		if (!sourceEl) {
			connections = [];
			return;
		}

		const sourceSemester = mallaState.currentMalla.findIndex((s) =>
			s.some((r) => r.sigla === mallaState.hoverSig)
		);

		const { x: x1, y: y1 } = getCenter(sourceEl, containerRef);
		const newConnections: Connection[] = [];
		const seen = new Set<string>();

		// Helpers para buscar elementos y conectar
		const addConn = (sigla: string, type: 'pre' | 'dep' | 'co') => {
			const targetEl = document.getElementById(`ramo-${sigla}`);
			if (targetEl) {
				const { x: tx, y: ty } = getCenter(targetEl, containerRef!);

				const path = generatePath(x1, y1, tx, ty);

				// CAMBIO: Si esta combinación de camino y tipo ya existe, no la agregamos
				const key = path + type;
				if (seen.has(key)) return;
				seen.add(key);

				const targetSemester = mallaState.currentMalla.findIndex((s) =>
					s.some((r) => r.sigla === sigla)
				);
				const semesterDiff = Math.abs(sourceSemester - targetSemester);

				newConnections.push({ path, type, semesterDiff } as any);
			}
		};

		const hoverRamoData = mallaState.findRamo(mallaState.hoverSig);

		// Prerrequisitos y Co-requisitos (Target -> Hover)
		if (hoverRamoData) {
			hoverRamoData.requisitos.flat().forEach((req) => {
				if (req.sigla) addConn(req.sigla, req.tipo === 'CO' ? 'co' : 'pre');
			});
		}

		// Dependencias (Hover -> Target)
		mallaState.currentMalla.flat().forEach((ramo) => {
			// Buscamos si el hover es requisito de este ramo
			const req = ramo.requisitos.flat().find((r) => r.sigla === mallaState.hoverSig);

			if (req) {
				// Si es CO, usamos tipo 'co' (Cyan), si no 'dep' (Verde)
				addConn(ramo.sigla, req.tipo === 'CO' ? 'co' : 'dep');
			}
		});

		connections = newConnections;
	});

	// Desestructurar estilos para el template
	const { base: card, credits: cardCredits, title: cardTitle, sigla: cardSigla } = cardStyles();
</script>

<div class="flex h-screen w-full flex-col overflow-hidden">
	<main
		onmouseleave={() => (mallaState.hoverSig = null)}
		class="relative flex-1 overflow-auto p-3.5"
	>
		<div
			class="pointer-events-none fixed inset-0 top-0 left-0 z-[5] bg-black/30 transition-opacity duration-500"
			class:opacity-0={!mallaState.hoverSig}
			class:opacity-100={!!mallaState.hoverSig}
		></div>

		{#if mallaState.currentMalla.length > 0}
			<div class="relative mx-auto flex w-fit flex-row" bind:this={containerRef}>
				<svg class="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
					{#each connections as conn, i (conn.path + conn.type)}
						{@const color =
							conn.type === 'pre'
								? 'var(--color-amber-500)'
								: conn.type === 'co'
									? 'var(--color-cyan-500)'
									: 'var(--color-green-500)'}
						{@const maskId = `mask-${i}-${conn.type}`}

						<mask id={maskId} maskUnits="userSpaceOnUse">
							<path
								in:draw={{
									duration: 400 + (conn.semesterDiff ?? 0) * 100,
									easing: cubicOut
								}}
								d={conn.path}
								stroke="white"
								stroke-width="4"
								fill="none"
							/>
						</mask>

						<path
							d={conn.path}
							stroke={color}
							stroke-width="4"
							fill="none"
							mask="url(#{maskId})"
							stroke-dasharray={conn.type === 'pre' || conn.type === 'co' ? '8,6' : '0'}
							class="drop-shadow-sm/50 {conn.type === 'dep' ? 'anim-dep' : 'anim-pre'}"
						/>
					{/each}
				</svg>

				{#each mallaState.currentMalla as semestre, i (i)}
					<div
						class="-my-3.5 flex flex-col gap-2 px-2 py-4 md:px-3 {i % 2 === 0
							? 'bg-gradient-to-b from-black/30 from-75% to-transparent'
							: 'bg-gradient-to-b from-white/5 from-75% to-transparent'}"
					>
						<div
							class="relative z-10 mb-2 flex items-center justify-between border-b border-white/50 px-1"
						>
							<span class="text-foreground text-lg font-bold">{romanize(i + 1)}</span>
							<span class="text-xs font-medium text-white/40 uppercase">
								{semestre.reduce((acc, r) => acc + r.creditos, 0)} SCT
							</span>
						</div>

						<div
							class="flex max-h-[calc(100vh-14rem)] w-max flex-col flex-wrap content-start gap-2"
						>
							{#each semestre as ramo, j (ramo.sigla)}
								{@const status = ramo.checked
									? 'aprobado'
									: ramo.locked
										? 'bloqueado'
										: 'disponible'}
								{@const relation = ramo.isCoRequisite
									? 'coreq'
									: ramo.isPreRequisite
										? 'parent'
										: ramo.isUnlock // <--- Prioridad Alta
											? 'unlock'
											: ramo.isDependency // <--- Prioridad Baja
												? 'child'
												: mallaState.hoverSig === ramo.sigla
													? 'self'
													: 'none'}
								{@const hoverRamo = mallaState.hoverSig
									? mallaState.findRamo(mallaState.hoverSig)
									: null}
								{@const semesterDiff = hoverRamo
									? Math.abs(
											i -
												mallaState.currentMalla.findIndex((s) =>
													s.some((r) => r.sigla === mallaState.hoverSig)
												)
										)
									: i}
								{@const delay = semesterDiff * 100}

								<button
									id="ramo-{ramo.sigla}"
									onclick={() => handleRamoClick(ramo)}
									onmouseenter={() => (mallaState.hoverSig = ramo.sigla)}
									onmouseleave={() => (mallaState.hoverSig = null)}
									class={card({
										status,
										relation
									})}
									style:transition-delay={!['self', 'none'].includes(relation)
										? `${delay}ms`
										: '0ms'}
								>
									<span class={cardSigla({ status })}>{ramo.sigla}</span>
									<Tooltip content={mallaState.customNames[ramo.sigla] || ramo.nombre}>
										<span class={cardTitle({ status })}>
											{mallaState.customNames[ramo.sigla] || ramo.nombre}
										</span>
									</Tooltip>
									<div class="mt-1 flex items-center justify-between">
										<span class={cardCredits({ status })}>{ramo.creditos} SCT</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}{/if}
	</main>
</div>

<style>
	/* Animación para Prerrequisitos y Co-requisitos */
	@keyframes march {
		from {
			/* CAMBIO: Usamos 56 (LCM de 14 y 8) para que ambos patrones ciclen perfectamente */
			stroke-dashoffset: 56;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.anim-pre {
		/* 'will-change' avisa al navegador que prepare la GPU */
		will-change: stroke-dashoffset;
		/* CAMBIO: Aumentamos a 2s para mantener la velocidad visual original (56px / 2s = 28px/s) */
		animation: march 2s linear infinite;
	}
</style>
