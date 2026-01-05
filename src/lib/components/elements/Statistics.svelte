<script module>
	// 1. Definimos las constantes de etiquetas disponibles.
	// 'as const' congela el objeto y convierte los valores en tipos literales (no string genérico).
	export const STAT_LABELS = {
		ZEN_DAY: 'Día Zen',
		HARDCORE: 'Hardcore',
		EN_AULA: 'En Aula',
		HORARIO: 'Horario',
		VENTANAS: 'Ventanas',
		EFICIENCIA: 'Eficiencia',
		ESTUDIO_AUTONOMO: 'Estudio Autónomo',
		MARATON: 'Maratón',
		HIGIENE_SUEÑO: 'Recuperación',
		DISTRIBUCION: 'Distribución',
		RITMO: 'Ritmo',
		ENFOQUE: 'Enfoque',
		CONFLICTOS: 'Conflictos'
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

	type typeStatistics = StatItem[];
	let statistics: typeStatistics = $state([]);

	export const StatisticsManager = {
		get source(): typeStatistics {
			return statistics;
		},

		async getAll(): Promise<StatItem[]> {
			return statistics;
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
	import { blur, fade, fly, scale } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { Data } from '$lib/data/data.svelte';
	import Card from '../ui/Card.svelte';
	import Tooltip from '../ui/Tooltip.svelte';
	import { BLOQUE_DURATION_MINUTES, BLOQUE_COMIDA } from '$lib/constants/usm';
	import Time from '$lib/helpers/time';
	import { Días } from '$lib/types/horario';
	import { SideBar } from '../sidebar/SideBar.svelte';

	// Iconos
	import Asterisk from '$lib/icons/asterisk.svelte';
	import Moon from '$lib/icons/moon.svelte';
	import MaterialSymbolsNestEcoLeaf from '$lib/icons/MaterialSymbolsNestEcoLeaf.svelte';
	import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
	import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';
	import MaterialSymbolsTimeline from '$lib/icons/MaterialSymbolsTimeline.svelte';
	import MaterialSymbolsBookRibbon from '$lib/icons/MaterialSymbolsBookRibbon.svelte';
	import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
	import { classifySchedule } from '$lib/ai/classifier';
	import MaterialSymbolsBalance from '$lib/icons/MaterialSymbolsBalance.svelte';
	import MaterialSymbolsWarningRounded from '$lib/icons/MaterialSymbolsWarningRounded.svelte';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';

	let updated = $state(false);

	$effect(() => {
		// 1. Rastreamos cambios en los Ramos Y en la Ventana Activa.
		// Al acceder a 'SideBar.activeWindow', Svelte 5 lo añade automáticamente a las dependencias.
		const _ = [Calendario.ramos, SideBar.activeWindow];

		// 2. Cláusula de Guardia (UX):
		// Si hay una ventana abierta (ej. RamoWindow), NO recalculamos ni notificamos nada aún.
		// Esperamos a que el usuario cierre la ventana (activeWindow sea undefined) para ejecutar esto.
		if (SideBar.activeWindow) return;

		untrack(() => {
			async function update() {
				const ramos = Calendario.ramos;
				if (!ramos.length) return [];

				let out: StatItem[] = [];
				const creditosMap: Record<string, number> = {};

				const metrics: Record<number, { carga: number; bloques: number }> = {
					0: { carga: 0, bloques: 0 },
					1: { carga: 0, bloques: 0 },
					2: { carga: 0, bloques: 0 },
					3: { carga: 0, bloques: 0 },
					4: { carga: 0, bloques: 0 },
					5: { carga: 0, bloques: 0 }
				};

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
						if (metrics[d]) metrics[d].carga += creditos;
					});

					ramo.horario.forEach((b) => {
						if (metrics[b.dia]) metrics[b.dia].bloques++;
					});
				}

				// --- 1. Cálculo de Días Extremos (Zen vs Hardcore) con Score de Intensidad ---
				const diasCalculados = Object.entries(metrics)
					.map(([d, m]) => {
						if (m.bloques === 0) return null;

						const densidad = m.carga / m.bloques;
						const score = m.carga + densidad;

						return {
							dia: Number(d),
							carga: m.carga,
							bloques: m.bloques,
							score
						};
					})
					.filter((d) => d !== null)
					.sort((a, b) => a.score - b.score);

				if (diasCalculados.length > 0) {
					const ligero = diasCalculados[0];
					const pesado = diasCalculados[diasCalculados.length - 1];
					const diff = pesado.score - ligero.score;

					const UMBRAL_RELEVANCIA = 1.5;
					const UMBRAL_HARDCORE = 3.0;

					if (diasCalculados.length > 1 && diff >= UMBRAL_RELEVANCIA) {
						out.push({
							icon: MaterialSymbolsNestEcoLeaf,
							label: STAT_LABELS.ZEN_DAY,
							value: `${Días[ligero.dia]}`,
							tooltip: `Día de menor intensidad relativa .`
						});

						if (diff >= UMBRAL_HARDCORE) {
							out.push({
								icon: MaterialSymbolsLocalFireDepartmentRounded,
								label: STAT_LABELS.HARDCORE,
								value: `${Días[pesado.dia]}`,
								tooltip: `Día de intensidad crítica.`
							});
						}
					}
				}

				// A. Cálculo real de tiempo en aula (Manejando topes de horario)
				const bloquesUnicos = new Set<string>();
				ramos.forEach((r) => {
					r.horario.forEach((b) => bloquesUnicos.add(`${b.dia}-${b.bloque}`));
				});

				const totalBloquesReales = bloquesUnicos.size;
				const minutosAula = totalBloquesReales * BLOQUE_DURATION_MINUTES;

				out.push({
					icon: MaterialSymbolsNestClockFarsightAnalogOutline,
					label: STAT_LABELS.EN_AULA,
					value: `${(minutosAula / 60).toFixed(1)} horas`,
					tooltip: 'Tiempo real sentado en la sala de clases.'
				});

				// NUEVO: Enfoque de Gestión (Densidad Cognitiva)
				const totalSCT = Object.values(creditosMap).reduce((sum, c) => sum + c, 0);
				const cantidadRamos = ramos.length;

				if (cantidadRamos > 0 && totalSCT > 0) {
					const pesoPromedio = totalSCT / cantidadRamos;
					let perfil = 'Estándar';
					let desc =
						'Tu carga combina asignaturas de distinto peso, requiriendo un balance normal entre gestión y estudio.';
					let status: StatStatus = 'success';

					if (pesoPromedio < 4.0) {
						perfil = 'Fragmentado';
						desc =
							'Cursas muchas asignaturas de bajo creditaje. Tu principal enemigo será el caos administrativo (múltiples fechas y entregas simultáneas). Prioriza el orden.';
						status = 'warning';
					} else if (pesoPromedio > 5.2) {
						perfil = 'Denso';
						desc =
							'Tu semestre depende de pocas asignaturas pero de alto "tonelaje" académico. El riesgo es la complejidad conceptual; un fallo en una evaluación pesa mucho.';
						status = 'warning';
					}

					out.push({
						icon: MaterialSymbolsBalance,
						label: STAT_LABELS.ENFOQUE,
						value: perfil,
						tooltip: `Promedio: ${pesoPromedio.toFixed(1)} SCT por ramo. ${desc}`,
						status
					});
				}

				// --- 3. Calidad de Vida (Ventanas con Análisis de Fragmentación) ---
				const ventanas = Calendario.ventanas;
				let minutosVentanaTotal = 0;
				let maxVentanaIndividual = 0;

				for (const v of ventanas) {
					const duracion = v.duraciónBloques * BLOQUE_DURATION_MINUTES;
					minutosVentanaTotal += duracion;
					if (duracion > maxVentanaIndividual) {
						maxVentanaIndividual = duracion;
					}
				}

				if (minutosVentanaTotal === 0) {
					out.push({
						icon: Asterisk,
						label: STAT_LABELS.HORARIO,
						value: 'Compacto',
						tooltip:
							'La ausencia total de tiempos muertos entre bloques maximiza la eficiencia de la permanencia en el campus.',
						status: 'success'
					});
				} else {
					const horasTotales = minutosVentanaTotal / 60;
					const horasMaxIndividual = maxVentanaIndividual / 60;

					let status: StatStatus = 'success';
					let analisis =
						'Los tiempos de espera se mantienen dentro de márgenes que permiten pausas breves de descanso o alimentación.';

					if (horasMaxIndividual > 3.5) {
						status = 'danger';
						analisis =
							'La existencia de un periodo inactivo continuo superior a tres horas y media genera una desconexión prolongada que puede afectar el ritmo de estudio diario.';
					} else if (horasTotales > 5.0) {
						status = 'warning';
						analisis =
							'La suma acumulada de tiempos muertos supera las cinco horas semanales, sugiriendo una dispersión horaria considerable que podría reducir la productividad.';
					} else if (horasTotales > 2.5) {
						status = 'warning';
						analisis =
							'El volumen de tiempo libre entre clases es considerable y requerirá planificación para ser aprovechado efectivamente en actividades académicas.';
					}

					out.push({
						icon: Moon,
						label: STAT_LABELS.VENTANAS,
						value: `${horasTotales.toFixed(1)} hrs`,
						tooltip: analisis,
						status
					});
				}

				{
					// --- 4. Eficiencia de Campus (Ajustada y Humanizada) ---
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

						// ANÁLISIS RAZONABLE:
						// - Menos del 50%: Pasas más tiempo esperando que en clases. (Danger)
						// - Entre 50% y 75%: Tienes ventanas significativas, pero es manejable. (Warning)
						// - Más del 75%: Horario compacto. Considera el almuerzo como parte de la vida. (Success)

						let mensaje = '';
						if (eficiencia < 50) {
							status = 'danger';
							mensaje =
								'Tu tiempo de espera supera a tu tiempo de clases. Considera reagrupar bloques.';
						} else if (eficiencia < 75) {
							status = 'warning';
							mensaje = 'Tienes una densidad media. Aprovecha las ventanas para estudio o deporte.';
						} else {
							status = 'success';
							mensaje =
								'Aprovechamiento máximo del tiempo en campus (incluyendo tiempos de traslado/comida).';
						}

						// Cálculo extra para el tooltip: Minutos libres por hora de clase
						// (Permanencia - Aula) / (Aula / 60)
						const minutosLibresPorHora = Math.round(
							(minutosPermanencia - minutosAula) / (minutosAula / 60)
						);

						out.push({
							icon: MaterialSymbolsTimeline,
							label: STAT_LABELS.EFICIENCIA,
							value: `${eficiencia}%`,
							tooltip: `Por cada hora de clases, tienes aprox. <b>${minutosLibresPorHora} minutos</b> de tiempo libre/espera.<br/>${mensaje}`,
							status
						});
					}
				}

				// --- 5. Estudio Autónomo ---
				{
					const ramosSinSCT = Object.values(creditosMap).filter((c) => c === 0).length;
					const totalSCT = Object.values(creditosMap).reduce((sum, c) => sum + c, 0);
					const semanasSemestre = 17;
					const horasTotalesSugeridasSemanal = (totalSCT * 27) / semanasSemestre;
					const horasAutonomasDiarias =
						Math.max(0, horasTotalesSugeridasSemanal - minutosAula / 60) / 6;

					if (totalSCT > 0 || ramosSinSCT > 0) {
						let status: StatStatus = 'success';
						let recomendacion =
							'La carga estimada permite mantener un equilibrio adecuado entre el estudio personal y el descanso.';
						let advertenciaDatos = '';

						if (ramosSinSCT > 0) {
							status = 'warning';
							advertenciaDatos = `<br/>Nota: Se han detectado ${ramosSinSCT} asignatura(s) sin créditos registrados, por lo que la carga real será superior a la estimada.`;
						}

						if (horasAutonomasDiarias > 5.5) {
							status = 'danger';
							recomendacion =
								'La carga teórica estimada supera las 5.5 horas diarias de dedicación adicional, lo cual representa un riesgo elevado de agotamiento académico sin una gestión del tiempo excepcional.';
						} else if (horasAutonomasDiarias > 4.0) {
							status = 'warning';
							recomendacion =
								'El volumen de estudio personal se encuentra en un rango exigente que requiere una disciplina de estudio rigurosa de lunes a sábado para mantenerse al día.';
						}

						out.push({
							icon: MaterialSymbolsBookRibbon,
							label: STAT_LABELS.ESTUDIO_AUTONOMO,
							value: `${horasAutonomasDiarias.toFixed(1)} hrs/día`,
							tooltip: `Estimación basada en la normativa USM (1 SCT = 27 hrs totales). ${recomendacion}${advertenciaDatos}<br/>El cálculo considera las horas teóricas de estudio personal distribuidas en una semana de seis días.`,
							status
						});
					}
				}

				// --- 6. Análisis con IA ---
				{
					const dailyLoads = [0, 1, 2, 3, 4].map((d) => metrics[d].carga);
					const startTimes = [0, 1, 2, 3, 4].map((d) => {
						const bloques = ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
						if (bloques.length === 0) return 0.5;
						const minB = Math.min(...bloques.map((b) => b.bloque));
						return (minB - 1) / 13;
					});
					const aiResult = classifySchedule(dailyLoads, startTimes);
					if (aiResult.distConfidence >= 0.4) {
						const warnings = ['Montaña Rusa', 'Cuesta Arriba', 'Pirámide'];
						const successes = ['Viernes Libre', 'Lunes Relax', 'Equilibrada'];
						let st: StatStatus = null;
						if (warnings.some((w) => aiResult.distribution.includes(w))) st = 'warning';
						if (successes.some((s) => aiResult.distribution.includes(s))) st = 'success';

						out.push({
							icon: aiResult.distributionIcon,
							label: STAT_LABELS.DISTRIBUCION,
							value: aiResult.distribution,
							tooltip: aiResult.distributionDescription,
							status: st
						});
					}

					if (aiResult.rhythmConfidence >= 0.4) {
						const dangers = ['Caótico', 'Bifásico'];
						const successes = ['Reloj Suizo'];
						let st: StatStatus = null;
						if (dangers.some((d) => aiResult.rhythm.includes(d))) st = 'danger';
						if (successes.some((s) => aiResult.rhythm.includes(s))) st = 'success';

						out.push({
							icon: aiResult.rhythmIcon,
							label: STAT_LABELS.RITMO,
							value: aiResult.rhythm,
							tooltip: aiResult.rhythmDescription,
							status: st
						});
					}
				}

				// --- 7. Alerta de Maratón ---
				{
					let maxBloquesSeguidos = 0;
					for (let d = 0; d <= 5; d++) {
						const bloquesDia = [
							...new Set(
								ramos
									.flatMap((r) => r.horario)
									.filter((b) => b.dia === d)
									.map((b) => b.bloque)
							)
						].sort((a, b) => a - b);

						let actuales = 1;
						for (let i = 0; i < bloquesDia.length - 1; i++) {
							const bloqueActual = bloquesDia[i];
							const bloqueSiguiente = bloquesDia[i + 1];

							if (bloqueSiguiente === bloqueActual + 1 && bloqueActual !== 8) {
								actuales++;
							} else {
								maxBloquesSeguidos = Math.max(maxBloquesSeguidos, actuales);
								actuales = 1;
							}
						}
						if (bloquesDia.length > 0) {
							maxBloquesSeguidos = Math.max(maxBloquesSeguidos, actuales);
						}
					}

					// UMBRAL SUAVIZADO:
					// Se ignora hasta 4 bloques (2 ramos seguidos), ya que es carga estándar.
					// La alerta comienza en 5 bloques.
					if (maxBloquesSeguidos >= 5) {
						const horasContinuas = (maxBloquesSeguidos * BLOQUE_DURATION_MINUTES) / 60;
						let status: StatStatus = 'warning';
						let recomendacion =
							'La jornada presenta una carga continua considerable que supera los dos módulos lectivos estándar.';

						if (maxBloquesSeguidos >= 6) {
							status = 'danger';
							recomendacion =
								'La secuencia continua equivale a tres asignaturas seguidas o más, excediendo los límites recomendados para la atención sostenida.';
						}

						out.push({
							icon: MaterialSymbolsDirectionsRun,
							label: STAT_LABELS.MARATON,
							value: `${horasContinuas.toFixed(1)} hrs seguidas`,
							tooltip: `Se han detectado ${maxBloquesSeguidos} bloques consecutivos sin ventana intermedia (se ignora el bloque protegido). ${recomendacion}`,
							status
						});
					}
				}

				// --- 8. Higiene de Sueño ---
				{
					let minDescansoNocturno = 24 * 60;

					for (let d = 0; d < 5; d++) {
						const bloquesHoy = ramos
							.flatMap((r) => r.horario)
							.filter((b) => b.dia === d)
							.map((b) => b.bloque);
						const bloquesManana = ramos
							.flatMap((r) => r.horario)
							.filter((b) => b.dia === d + 1)
							.map((b) => b.bloque);

						if (bloquesHoy.length > 0 && bloquesManana.length > 0) {
							const ultimoBloqueHoy = Math.max(...bloquesHoy);
							const primerBloqueManana = Math.min(...bloquesManana);
							const horaFinHoy = Time.bloqueToMinutes(ultimoBloqueHoy) + BLOQUE_DURATION_MINUTES;
							const horaInicioManana = Time.bloqueToMinutes(primerBloqueManana);
							const descanso = 1440 - horaFinHoy + horaInicioManana;

							if (descanso < minDescansoNocturno) {
								minDescansoNocturno = descanso;
							}
						}
					}

					if (minDescansoNocturno < 720) {
						const horasDescanso = (minDescansoNocturno / 60).toFixed(1);
						out.push({
							icon: Moon,
							label: STAT_LABELS.HIGIENE_SUEÑO,
							value: `${horasDescanso} hrs`,
							tooltip: `Tiempo mínimo detectado entre el término de una jornada y el inicio de la siguiente. Considera tiempos de traslado y sueño.`,
							status: minDescansoNocturno < 660 ? 'danger' : 'warning'
						});
					}
				}

				// --- 9. Alerta de Topes ---
				const totalInscripciones = ramos.reduce((sum, r) => sum + r.horario.length, 0);
				const bloquesReales = bloquesUnicos.size;
				const topes = (totalInscripciones - bloquesReales) / 2;
				if (topes > 0) {
					out.push({
						icon: MaterialSymbolsWarningRounded,
						label: STAT_LABELS.CONFLICTOS,
						value: `${topes} topes`,
						tooltip:
							'Existen bloques horarios donde se superponen dos o más asignaturas. Revisa la viabilidad administrativa.',
						status: 'danger'
					});
				}

				// --- 11. Ordenamiento UX ---
				const priorityMap: Record<string, number> = {
					danger: 0,
					warning: 1,
					null: 2,
					success: 3
				};

				return out.sort((a, b) => {
					const pA = priorityMap[a.status || 'null'] ?? 2;
					const pB = priorityMap[b.status || 'null'] ?? 2;
					return pA - pB;
				});
			}

			// CAMBIO: Gestión manual de la promesa para evitar recarga completa del bloque HTML
			// (Reemplaza a: const promise = update(); statistics = promise; promise.then...)
			update().then((res) => {
				statistics = res;

				// Delay visual para el efecto de "ping" en el título (opcional, mantenido)
				setTimeout(() => {
					updated = true;
					setTimeout(() => (updated = false), 2500);
				}, 100);
			});
		});
	});

	function levitate(node: Element, { duration = 400, y = -20, delay = 0 }) {
		return {
			delay,
			duration,
			css: (t: number, u: number) => {
				const eased = cubicOut(u);
				return `
				z-index: 100;
                transform: translateY(${eased * y}px);
                opacity: ${t};
            `;
			}
		};
	}
</script>

<div class="flex min-h-1/2 w-full flex-col gap-1.5 2xl:gap-2">
	<h1 class="flex items-center gap-2 text-sm font-normal">Estadísticas</h1>
	<div class="flex h-full min-h-0 w-full flex-col gap-1">
		{#await statistics}
			<div class="flex h-full w-full items-center justify-center">
				<div in:fade class="absolute">
					<Loader class="loader-usm scale-200" />
				</div>
			</div>
		{:then statistics}
			<div
				class="flex w-full flex-1 flex-col gap-1 overflow-y-auto pr-1 text-justify text-sm transition-colors duration-1000 2xl:gap-1.5"
			>
				{#each statistics as stat (stat.label)}
					{@const statusColors = {
						success:
							'bg-gradient-to-r to-green-500/20 from-green-500/40 text-green-50 border-green-500/80',
						warning:
							'bg-gradient-to-r to-amber-500/20 from-amber-500/40 text-amber-50 border-amber-500/80',
						danger: 'bg-gradient-to-r to-red-500/20 from-red-500/40 text-red-50 border-red-500/80'
					}}

					<!-- <div animate:flip={{ delay: 200, duration: 400 }}> -->
					<div>
						{#snippet tooltipContent()}
							{@html stat.tooltip}
						{/snippet}

						<Tooltip
							content={tooltipContent}
							class="text-left"
							wrapperClass="w-full"
							position="right"
						>
							<Card
								class="isolate flex w-full flex-row items-center gap-1.5 px-2.5! py-1! 2xl:gap-2 2xl:px-3! 2xl:py-1.5! {stat.status
									? statusColors[stat.status]
									: ''} shadow-sm/50!"
							>
								<div class="size-4 shrink-0 opacity-70">
									<stat.icon class="h-full w-full scale-125" />
								</div>

								<span class="truncate opacity-90 mix-blend-lighten">{stat.label}</span>
								<div class="ml-auto grid place-items-end overflow-visible">
									{#key stat.value}
										<span
											out:levitate={{ duration: 3000, y: -30, delay: 50 }}
											class="col-start-1 row-start-1 font-medium whitespace-nowrap opacity-90"
										>
											{stat.value}
										</span>
									{/key}
								</div>
							</Card>
						</Tooltip>
					</div>
				{/each}
			</div>
		{/await}
	</div>
</div>
