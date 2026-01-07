<script lang="ts">
	import { base } from '$app/paths';
	import { Data } from '$lib/data/data.svelte';

	// Importaciones de lógica modularizada
	import { MallaState } from '$lib/logic/malla/malla.svelte';
	import { getCareerOptions } from '$lib/logic/malla/data';
	import { getCenter, generatePath, romanize } from '$lib/logic/malla/visuals';
	import { cardStyles } from '$lib/logic/malla/styles';
	import type { Connection, RamoMalla } from '$lib/logic/malla/types';

	// UI Components
	import PlanSearch from '$lib/components/elements/PlanSearch.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { draw, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Lock from '$lib/icons/lock.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	// Instanciar Estado (Se carga automáticamente del localStorage en el constructor)
	const mallaState = new MallaState();
	// Usamos el estado derivado de mallaState directamente
	let careerOptions = $derived(
		getCareerOptions(mallaState.selectedSede, mallaState.selectedJornada)
	);

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
	<header class="bg-card z-20 border-b p-5 px-8 shadow-sm">
		<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<a
						href="{base}/"
						class="text-muted-foreground hover:text-primary hover:bg-primary/10 -ml-2 flex items-center justify-center rounded-full p-1.5 transition-colors"
						aria-label="Volver al inicio"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-6"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</a>
					<h1 class="text-primary text-3xl font-black tracking-tight uppercase">
						Malla Interactiva
					</h1>
				</div>

				<div class="flex items-center gap-2">
					{#if mallaState.selectedPlanId}
						<span class="text-muted-foreground text-sm">
							{mallaState.stats.percent}% completado • {mallaState.stats.creditos} SCT
						</span>
					{/if}
				</div>

				<div
					class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] font-bold md:text-xs"
				>
					<div class="flex items-center gap-1.5">
						<span class="size-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
						></span>
						<span>Pre-requisito</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]"
						></span>
						<span>Co-requisito</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-2 rounded-full bg-lime-500 shadow-[0_0_6px_rgba(132,204,22,0.6)]"
						></span>
						<span>Desbloqueo Parcial</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
						></span>
						<span>Desbloqueo Directo</span>
					</div>
				</div>
			</div>

			<div class="flex w-full flex-row items-end gap-4">
				<div class="flex min-w-[120px] flex-1 flex-col gap-1">
					<p class="text-muted-foreground text-xs font-bold uppercase">Sede</p>
					<Select
						placeholder="Selecciona una sede..."
						class="w-full"
						items={Data.sedes.map((s) => ({ value: s }))}
						bind:value={mallaState.selectedSede}
					/>
				</div>

				<div class="flex min-w-[120px] flex-1 flex-col gap-1">
					<p class="text-muted-foreground text-xs font-bold uppercase">Jornada</p>
					<Select
						class="w-full"
						items={Data.jornadasCarreras[mallaState.selectedSede]?.map((j) => ({ value: j })) || []}
						bind:value={mallaState.selectedJornada}
					/>
				</div>

				<div class="flex flex-[3] flex-col gap-1">
					<p class="text-muted-foreground text-xs font-bold uppercase">Carrera</p>
					<PlanSearch items={careerOptions} bind:value={mallaState.selectedPlanId} />
				</div>
			</div>
		</div>
	</header>
	<div class="ring-b-4 ring-card relative z-10 mt-auto h-2 w-full overflow-hidden bg-black">
		<div
			class="h-full bg-amber-500 transition-all ease-out"
			style:width="{mallaState.stats.percent}%"
		></div>
	</div>

	<main
		onmouseleave={() => (mallaState.hoverSig = null)}
		class="relative flex-1 overflow-auto p-3.5"
	>
		<div
			class="pointer-events-none fixed inset-0 top-0 left-0 z-[5] bg-black/30 transition-opacity duration-300"
			class:opacity-0={!mallaState.hoverSig}
			class:opacity-100={!!mallaState.hoverSig}
		></div>

		{#if mallaState.currentMalla.length > 0}
			<div class="relative flex flex-row justify-center gap-2 pb-2" bind:this={containerRef}>
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
					<div class="flex flex-col gap-2">
						<div
							class="relative z-10 flex items-center justify-between border-b border-white/50 px-1"
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
									{...!['self', 'none'].includes(relation)
										? { style: `transition-delay: ${delay}ms;` }
										: {}}
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
