<script lang="ts">
	import Loader from '$lib/icons/loader.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { fade } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { Data } from '$lib/data/data.svelte';
	import Card from '../ui/Card.svelte';
	import Tooltip from '../ui/Tooltip.svelte';
	import { BLOQUE_DURATION_MINUTES, BLOQUE_COMIDA } from '$lib/constants/usm';
	import Time from '$lib/helpers/time';
	import { Días } from '$lib/types/horario';

	// Iconos
	import Sun from '$lib/icons/sun.svelte';
	import Warning from '$lib/icons/warning.svelte';
	import HorarioIcon from '$lib/icons/horario.svelte';
	import Paralelos from '$lib/icons/paralelos.svelte';
	import Asterisk from '$lib/icons/asterisk.svelte';
	import Moon from '$lib/icons/moon.svelte';
	import ForkSpoon from '$lib/icons/fork-spoon.svelte';
	import Location from '$lib/icons/location.svelte';
	import Circles from '$lib/icons/circles.svelte';
	import LoaderIcon from '$lib/icons/loader.svelte'; // Icono para Maratón (reutilizamos Loader visualmente)
	import MaterialSymbolsNestEcoLeaf from '$lib/icons/MaterialSymbolsNestEcoLeaf.svelte';
	import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
	import MaterialSymbolsClockLoader10 from '$lib/icons/MaterialSymbolsClockLoader10.svelte';
	import MaterialSymbolsAlarmPause from '$lib/icons/MaterialSymbolsAlarmPause.svelte';
	import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';
	import MaterialSymbolsTimeline from '$lib/icons/MaterialSymbolsTimeline.svelte';

	// Definimos la estructura limpia, pasando el componente como propiedad
	type StatItem = {
		icon: any;
		label: string;
		value: string;
		tooltip: string;
	};

	type typeStatistics = Promise<StatItem[]>;
	let statistics: typeStatistics = $state(Promise.resolve([]));

	$effect(() => {
		const _ = [Calendario.ramos];

		untrack(() => {
			async function update(): typeStatistics {
				const ramos = Calendario.ramos;
				if (!ramos.length) return [];

				let out: StatItem[] = [];
				const creditosMap: Record<string, number> = {};

				// --- 1. Cálculo de Días Extremos (Zen vs Hardcore) ---
				const cargaPorDia: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

				for (const ramo of ramos) {
					if (creditosMap[ramo.sigla] === undefined) {
						const info =
							Data.getInfoRamoCarrera(ramo.sigla, Calendario.sede, Calendario.jornada) ||
							Data.getProgramaRamo(Calendario.sede, ramo.sigla);
						creditosMap[ramo.sigla] = info?.creditos || 0;
					}
					const creditos = creditosMap[ramo.sigla];

					const diasRamo = new Set(ramo.horario.map((b) => b.dia));
					diasRamo.forEach((d) => {
						if (cargaPorDia[d] !== undefined) cargaPorDia[d] += creditos;
					});
				}

				const diasActivos = Object.entries(cargaPorDia)
					.map(([d, c]) => ({ dia: Number(d), carga: c }))
					.filter((d) => d.carga > 0)
					.sort((a, b) => a.carga - b.carga);

				if (diasActivos.length > 0) {
					const ligero = diasActivos[0];
					const pesado = diasActivos[diasActivos.length - 1];

					out.push({
						icon: MaterialSymbolsNestEcoLeaf,
						label: 'Día Zen',
						value: `${Días[ligero.dia]} (${ligero.carga})`,
						tooltip: 'Día con la menor sumatoria de créditos SCT (Min de {Σ Créditos/Día}).'
					});

					if (diasActivos.length > 1 && pesado.dia !== ligero.dia) {
						out.push({
							icon: MaterialSymbolsLocalFireDepartmentRounded,
							label: 'Hardcore',
							value: `${Días[pesado.dia]} (${pesado.carga})`,
							tooltip: 'Día con la mayor sumatoria de créditos SCT (Max de {Σ Créditos/Día}).'
						});
					}
				}

				// --- 2. Tiempos y Bloques ---
				const totalBloques = ramos.reduce((sum, r) => sum + r.horario.length, 0);
				const minutosAula = totalBloques * BLOQUE_DURATION_MINUTES;

				out.push({
					icon: MaterialSymbolsAlarmPause,
					label: 'En Aula',
					value: `${(minutosAula / 60).toFixed(1)} horas`,
					tooltip: 'Sumatoria de minutos de todos los bloques inscritos (Σ Duración Bloques).'
				});

				const diasConClases = diasActivos.length || 1;
				const prom = (totalBloques / diasConClases).toFixed(1);
				out.push({
					icon: MaterialSymbolsClockLoader10,
					label: 'Promedio',
					value: `${prom} bloq/día`,
					tooltip: 'Promedio aritmético: Total Bloques / Cantidad de días asistidos.'
				});

				// --- 3. Calidad de Vida (Ventanas y Madrugadas) ---
				const ventanas = Calendario.ventanas;
				const minutosVentana = ventanas.reduce(
					(sum, v) => sum + v.duraciónBloques * BLOQUE_DURATION_MINUTES,
					0
				);

				if (minutosVentana === 0) {
					out.push({
						icon: Asterisk,
						label: 'Horario',
						value: 'Compacto',
						tooltip: '0 minutos de tiempo muerto entre el primer y último bloque.'
					});
				} else {
					const horasVentana = Time.MinutesToHHMM(minutosVentana);
					out.push({
						icon: Moon,
						label: 'Ventanas',
						value: `${horasVentana} hrs`,
						tooltip: 'Sumatoria de minutos libres entre bloques de clase.'
					});
				}

				// Madrugadas
				let madrugadas = 0;
				for (let d = 0; d <= 5; d++) {
					const bloques = ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
					if (bloques.length > 0) {
						const minB = Math.min(...bloques.map((b) => b.bloque));
						if (minB <= 2) madrugadas++;
					}
				}
				if (madrugadas > 0) {
					out.push({
						icon: Sun,
						label: 'Madrugadas',
						value: `${madrugadas} días`,
						tooltip: 'Cantidad de días donde el primer bloque inicia antes de las 09:35 AM.'
					});
				}

				// --- Almuerzos (QoL: Detectar días con tiempo justo) ---
				let almuerzosFlash = 0;
				for (let d = 0; d <= 5; d++) {
					const bloquesDia = ramos
						.flatMap((r) => r.horario)
						.filter((b) => b.dia === d)
						.map((b) => b.bloque);

					// Si tienes clase en el bloque anterior (7) Y en el posterior (9) al bloque de comida (8)
					const claseAntes = bloquesDia.includes(BLOQUE_COMIDA - 1);
					const claseDespues = bloquesDia.includes(BLOQUE_COMIDA + 1);

					if (claseAntes && claseDespues) {
						almuerzosFlash++;
					}
				}

				if (almuerzosFlash > 0) {
					out.push({
						icon: ForkSpoon,
						label: 'Almuerzo Flash',
						value: `${almuerzosFlash} días`,
						tooltip: `Días donde tienes clases pegadas justo antes y después del almuerzo (Bloques ${BLOQUE_COMIDA - 1} y ${BLOQUE_COMIDA + 1}).`
					});
				} else {
					out.push({
						icon: ForkSpoon,
						label: 'Almuerzo',
						value: 'Relax',
						tooltip: 'Todos los días tienes al menos un bloque libre adicional pegado al almuerzo.'
					});
				}

				// --- 4. Eficiencia de Campus ---
				let minutosPermanencia = 0;
				for (let d = 0; d <= 5; d++) {
					const bloques = ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
					if (bloques.length > 0) {
						const minB = Math.min(...bloques.map((b) => b.bloque));
						const maxB = Math.max(...bloques.map((b) => b.bloque));
						const start = Time.bloqueToMinutes(minB);
						const end = Time.bloqueToMinutes(maxB) + BLOQUE_DURATION_MINUTES;
						minutosPermanencia += end - start;
					}
				}

				if (minutosPermanencia > 0) {
					const eficiencia = Math.round((minutosAula / minutosPermanencia) * 100);
					out.push({
						icon: MaterialSymbolsTimeline,
						label: 'Eficiencia',
						value: `${eficiencia}%`,
						tooltip: 'Ratio porcentual: (Tiempo Aula / Tiempo Permanencia Total).'
					});
				}

				// --- 5. Maratón ---
				let maxMaraton = 0;
				for (let d = 0; d <= 5; d++) {
					const bloquesDia = ramos
						.flatMap((r) => r.horario)
						.filter((b) => b.dia === d)
						.map((b) => b.bloque)
						.sort((a, b) => a - b);

					let actual = 0;
					let last = -99;
					for (const b of bloquesDia) {
						if (b === last + 1) actual++;
						else actual = 1;
						last = b;
						maxMaraton = Math.max(maxMaraton, actual);
					}
				}
				if (maxMaraton >= 4) {
					out.push({
						icon: MaterialSymbolsDirectionsRun,
						label: 'Maratón',
						value: `${maxMaraton} seguidos`,
						tooltip: 'Mayor cantidad de bloques consecutivos sin interrupción (>3).'
					});
				}

				return out;
			}

			statistics = update();
		});
	});
</script>

<div class="flex min-h-1/2 w-full flex-col gap-1.5 2xl:gap-2">
	<h1 class="text-sm font-normal 2xl:text-base">Estadísticas</h1>
	<div class="flex h-full min-h-0 w-full flex-col gap-1">
		{#await statistics}
			<div class="flex h-full w-full items-center justify-center">
				<div in:fade class="absolute">
					<Loader class="loader-usm scale-200" />
				</div>
			</div>
		{:then statistics}
			<div
				class="flex w-full flex-1 flex-col gap-1.5 overflow-y-auto pr-1 text-justify text-sm 2xl:gap-2"
			>
				{#each statistics as stat}
					<Tooltip content={stat.tooltip} class="text-left" wrapperClass="w-full" position="right">
						<Card
							class="flex w-full flex-row items-center gap-1.5 px-2.5! py-1! 2xl:gap-2 2xl:px-3! 2xl:py-1.5!"
						>
							<div class="size-4 shrink-0 opacity-70">
								<stat.icon class="h-full w-full scale-125" />
							</div>

							<span class="truncate opacity-80">{stat.label}:</span>

							<span class="ml-auto shrink-0 font-medium whitespace-nowrap opacity-90"
								>{stat.value}</span
							>
						</Card>
					</Tooltip>
				{/each}
			</div>
		{/await}
	</div>
</div>
