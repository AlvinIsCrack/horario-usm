<script module>
	// 1. Definimos las constantes de etiquetas disponibles.
	// 'as const' congela el objeto y convierte los valores en tipos literales (no string genérico).
	export const STAT_LABELS = {
		ZEN_DAY: 'Día Zen',
		HARDCORE: 'Hardcore',
		EN_AULA: 'En Aula',
		PROMEDIO: 'Promedio',
		HORARIO: 'Horario',
		VENTANAS: 'Ventanas',
		MADRUGADAS: 'Madrugadas',
		ALMUERZO_FLASH: 'Almuerzo Flash',
		ALMUERZO: 'Almuerzo',
		EFICIENCIA: 'Eficiencia',
		MARATON: 'Maratón',
		ESTUDIO_AUTONOMO: 'Estudio Autónomo',
		SALIDA_TARDIA: 'Salida Tardía',
		DISTRIBUCION: 'Distribución',
		RITMO: 'Ritmo'
	} as const;

	// 2. Creamos el tipo derivado automáticamente.
	// StatLabel será: "Día Zen" | "Hardcore" | "En Aula" | ...
	export type StatLabel = (typeof STAT_LABELS)[keyof typeof STAT_LABELS];
	export type StatStatus = 'success' | 'warning' | 'danger' | null;

	type StatItem = {
		icon: any;
		label: StatLabel;
		value: string;
		tooltip: string;
		status?: StatStatus;
	};

	type typeStatistics = Promise<StatItem[]>;
	let statistics: typeStatistics = $state(Promise.resolve([]));

	export const StatisticsManager = {
		get source(): typeStatistics {
			return statistics;
		},

		async getAll(): Promise<StatItem[]> {
			return await statistics;
		},

		async getKeys(): Promise<StatLabel[]> {
			const items = await this.getAll();
			return items.map((s) => s.label);
		},

		async getItem(key: StatLabel): Promise<StatItem | undefined> {
			const items = await this.getAll();
			return items.find((s) => s.label === key);
		},

		async getValue(key: StatLabel): Promise<string | undefined> {
			const item = await this.getItem(key);
			return item?.value;
		}
	};
</script>

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
	import Asterisk from '$lib/icons/asterisk.svelte';
	import Moon from '$lib/icons/moon.svelte';
	import ForkSpoon from '$lib/icons/fork-spoon.svelte';
	import MaterialSymbolsNestEcoLeaf from '$lib/icons/MaterialSymbolsNestEcoLeaf.svelte';
	import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
	import TrendingUp from '$lib/icons/trending-up.svelte';
	import TrendingDown from '$lib/icons/trending-down.svelte';
	import Activity from '$lib/icons/activity.svelte';
	import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';
	import MaterialSymbolsTimeline from '$lib/icons/MaterialSymbolsTimeline.svelte';
	import MaterialSymbolsBookRibbon from '$lib/icons/MaterialSymbolsBookRibbon.svelte';
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
	import ArithmeticMean from '$lib/icons/arithmetic-mean.svelte';
	import Paralelos from '$lib/icons/paralelos.svelte';
	import { classifySchedule } from '$lib/ai/classifier';

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
						label: STAT_LABELS.ZEN_DAY,
						value: Días[ligero.dia],
						tooltip: `Día con la menor sumatoria de créditos SCT (Min de {Σ Créditos/Día}). En tu caso es ${ligero.carga} SCT.`,
						status: 'success' // Zen = Bueno
					});

					if (diasActivos.length > 1 && pesado.dia !== ligero.dia) {
						out.push({
							icon: MaterialSymbolsLocalFireDepartmentRounded,
							label: STAT_LABELS.HARDCORE,
							value: Días[pesado.dia],
							tooltip: `Día con la mayor sumatoria de créditos SCT (Max de {Σ Créditos/Día}). En tu caso es ${pesado.carga} SCT.`,
							status: 'danger' // Hardcore = Intenso
						});
					}
				}

				// --- 2. Tiempos y Bloques ---
				const totalBloques = ramos.reduce((sum, r) => sum + r.horario.length, 0);
				const minutosAula = totalBloques * BLOQUE_DURATION_MINUTES;

				out.push({
					icon: MaterialSymbolsNestClockFarsightAnalogOutline,
					label: STAT_LABELS.EN_AULA,
					value: `${(minutosAula / 60).toFixed(1)} horas`,
					tooltip: 'Sumatoria de minutos de todos los bloques inscritos (Σ Duración Bloques).'
				});

				const diasConClases = diasActivos.length || 1;
				const prom = (totalBloques / diasConClases).toFixed(1);
				out.push({
					icon: ArithmeticMean,
					label: STAT_LABELS.PROMEDIO,
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
						label: STAT_LABELS.HORARIO,
						value: 'Compacto',
						tooltip: '0 minutos de tiempo muerto entre el primer y último bloque.'
					});
				} else {
					const horasVentana = minutosVentana / 60;
					out.push({
						icon: Moon,
						label: STAT_LABELS.VENTANAS,
						value: `${horasVentana.toFixed(1)} hrs`,
						tooltip: 'Sumatoria de minutos libres entre bloques de clase.'
					});
				}

				// Madrugadas
				// {
				// 	let madrugadas = 0;
				// for (let d = 0; d <= 5; d++) {
				// 	const bloques = ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
				// 	if (bloques.length > 0) {
				// 		const minB = Math.min(...bloques.map((b) => b.bloque));
				// 		if (minB <= 2) madrugadas++;
				// 	}
				// }
				// if (madrugadas > 0) {
				// 	out.push({
				// 		icon: Sun,
				// 		label: STAT_LABELS.MADRUGADAS,
				// 		value: `${madrugadas} días`,
				// 		tooltip: 'Cantidad de días donde el primer bloque inicia antes de las 09:35 AM.'
				// 	});
				// }
				// }

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
						label: STAT_LABELS.ALMUERZO_FLASH,
						value: `${almuerzosFlash} días`,
						tooltip: `Días donde tienes clases pegadas justo antes y después del almuerzo (Bloques ${BLOQUE_COMIDA - 1} y ${BLOQUE_COMIDA + 1}).`,
						status: 'danger'
					});
				} else {
					out.push({
						icon: ForkSpoon,
						label: STAT_LABELS.ALMUERZO,
						value: 'Relax',
						tooltip: 'Todos los días tienes al menos un bloque libre adicional pegado al almuerzo.',
						status: 'success'
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

					let status: StatStatus = null;
					if (eficiencia <= 55) status = 'danger';
					else if (eficiencia < 70) status = 'warning';
					else if (eficiencia >= 90) status = 'success';

					out.push({
						icon: MaterialSymbolsTimeline,
						label: STAT_LABELS.EFICIENCIA,
						value: `${eficiencia}%`,
						tooltip: 'Ratio porcentual: (Tiempo Aula / Tiempo Permanencia Total).',
						status
					});
				}

				// --- 5. Maratón ---
				// let maxMaraton = 0;
				// for (let d = 0; d <= 5; d++) {
				// 	const bloquesDia = ramos
				// 		.flatMap((r) => r.horario)
				// 		.filter((b) => b.dia === d)
				// 		.map((b) => b.bloque)
				// 		.sort((a, b) => a - b);

				// 	let actual = 0;
				// 	let last = -99;
				// 	for (const b of bloquesDia) {
				// 		if (b === last + 1) actual++;
				// 		else actual = 1;
				// 		last = b;
				// 		maxMaraton = Math.max(maxMaraton, actual);
				// 	}
				// }
				// if (maxMaraton >= 4) {
				// 	out.push({
				// 		icon: MaterialSymbolsDirectionsRun,
				// 		label: STAT_LABELS.MARATON,
				// 		value: `${maxMaraton} bloq. seguidos`,
				// 		tooltip: 'Mayor cantidad de bloques consecutivos sin interrupción (>3).'
				// 	});
				// }

				{
					const totalSCT = Object.values(creditosMap).reduce((sum, c) => sum + c, 0);
					// 1 SCT equivale a 27 horas semestrales. En 18 semanas, son 1.5 horas totales por crédito.
					const horasTotalesSugeridas = totalSCT * 1.5;
					const horasAutónomas = Math.max(0, horasTotalesSugeridas - minutosAula / 60) / 7;

					if (totalSCT > 0) {
						out.push({
							icon: MaterialSymbolsBookRibbon, // O un icono de libro/estudio
							label: STAT_LABELS.ESTUDIO_AUTONOMO,
							value: `${horasAutónomas.toFixed(1)} hrs/día`,
							tooltip: `Basado en tus ${totalSCT} créditos totales. Un crédito equivale a 27 horas de trabajo semestral; restando tus horas de clase y dividiendo por los 7 días de la semana, este es el tiempo que debieras dedicarle por tu cuenta al día para que te vaya bien.`
						});
					}
				}

				// {
				// 	let salidasTardias = 0;
				// 	for (let d = 0; d <= 5; d++) {
				// 		const bloques = ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
				// 		if (bloques.length > 0) {
				// 			const maxB = Math.max(...bloques.map((b) => b.bloque));
				// 			// Consideramos salida tardía si termina en el bloque 11 o superior
				// 			if (maxB >= 11) salidasTardias++;
				// 		}
				// 	}

				// 	if (salidasTardias > 0) {
				// 		out.push({
				// 			icon: Moon, // Reutilizando el icono Moon o uno de reloj nocturno
				// 			label: STAT_LABELS.SALIDA_TARDIA,
				// 			value: `${salidasTardias} días`,
				// 			tooltip: 'Cantidad de días donde el último bloque termina después de las 18:30 PM.'
				// 		});
				// 	}
				// }

				// --- 6. Análisis con IA (Ritmo y Distribución) ---
				{
					// Preparar datos para la IA
					// 1. Carga por día (L-V)
					const dailyLoads = [0, 1, 2, 3, 4].map((d) => cargaPorDia[d] || 0);

					// 2. Inicios normalizados (L-V)
					// Bloque 1 = 0.0, Bloque 12 = 1.0 (aprox)
					const startTimes = [0, 1, 2, 3, 4].map((d) => {
						const bloques = ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
						if (bloques.length === 0) return 0.5; // Día libre = neutro para ritmo
						const minB = Math.min(...bloques.map((b) => b.bloque));
						// Normalizar bloque 1-14 a 0-1
						return (minB - 1) / 13;
					});

					// Invocar al oráculo
					const aiResult = classifySchedule(dailyLoads, startTimes);

					// --- Resultado Distribución ---
					let iconDist: any = Paralelos; // Default Equilibrada
					switch (aiResult.distribution) {
						case 'Cuesta Abajo':
							iconDist = TrendingDown;
							break;
						case 'Cuesta Arriba':
							iconDist = TrendingUp;
							break;
						case 'Pirámide':
							iconDist = MaterialSymbolsLocalFireDepartmentRounded;
							break;
						case 'Valle':
							iconDist = MaterialSymbolsNestEcoLeaf;
							break;
						case 'Montaña Rusa':
							iconDist = Activity;
							break;
					}

					if (aiResult.distConfidence > 0.4) {
						const warnings = ['Montaña Rusa', 'Cuesta Arriba', 'Pirámide'];
						const successes = ['Viernes Libre', 'Lunes Relax', 'Equilibrada'];

						let st: StatStatus = null;
						if (warnings.some((w) => aiResult.distribution.includes(w))) st = 'warning';
						if (successes.some((s) => aiResult.distribution.includes(s))) st = 'success';

						out.push({
							icon: iconDist,
							label: STAT_LABELS.DISTRIBUCION,
							value: aiResult.distribution,
							tooltip: `Análisis con IA (${Math.round(aiResult.distConfidence * 100)}%): ${aiResult.distributionDescription}`,
							status: st
						});
					}

					if (aiResult.rhythmConfidence > 0.4) {
						const dangers = ['Caótico', 'Bifásico'];
						const successes = ['Reloj Suizo'];
						let st: StatStatus = null;

						if (dangers.some((d) => aiResult.rhythm.includes(d))) st = 'danger';
						if (successes.some((s) => aiResult.rhythm.includes(s))) st = 'success';

						out.push({
							icon: MaterialSymbolsNestClockFarsightAnalogOutline, // O Activity
							label: STAT_LABELS.RITMO,
							value: aiResult.rhythm,
							tooltip: `Análisis IA (${Math.round(aiResult.rhythmConfidence * 100)}%): ${aiResult.rhythmDescription}`,
							status: st
						});
					}
				}

				return out;
			}

			statistics = update();
		});
	});
</script>

<div class="flex min-h-1/2 w-full flex-col gap-1.5 2xl:gap-2">
	<h1 class="text-sm font-normal">Estadísticas</h1>
	<div class="flex h-full min-h-0 w-full flex-col gap-1">
		{#await statistics}
			<div class="flex h-full w-full items-center justify-center">
				<div in:fade class="absolute">
					<Loader class="loader-usm scale-200" />
				</div>
			</div>
		{:then statistics}
			<div
				class="flex w-full flex-1 flex-col gap-1 overflow-y-auto pr-1 text-justify text-sm 2xl:gap-1.5"
			>
				{#each statistics as stat}
					{@const statusColors = {
						success: 'bg-green-500/25 border-green-500/50',
						warning: 'bg-amber-500/25 border-amber-500/50',
						danger: 'bg-red-500/25 border-red-500/50'
					}}

					<Tooltip content={stat.tooltip} class="text-left" wrapperClass="w-full" position="right">
						<Card
							class="isolate flex w-full flex-row items-center gap-1.5 px-2.5! py-1! 2xl:gap-2 2xl:px-3! 2xl:py-1.5! {stat.status
								? statusColors[stat.status]
								: ''} shadow-sm/50!"
						>
							<div class="size-4 shrink-0 opacity-70">
								<stat.icon class="h-full w-full scale-125" />
							</div>

							<span class="truncate opacity-90 mix-blend-plus-lighter">{stat.label}</span>
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
