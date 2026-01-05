<script module>
	// 1. Definimos las constantes de etiquetas disponibles.
	// 'as const' congela el objeto y convierte los valores en tipos literales (no string genérico).
	export const STAT_LABELS = {
		BAJA_CARGA: 'Día de Baja Carga',
		ALTA_INTENSIDAD: 'Día de Alta Intensidad',
		EN_AULA: 'En Aula',
		HORARIO: 'Horario',
		VENTANAS: 'Ventanas',
		EFICIENCIA: 'Eficiencia',
		ESTUDIO_AUTONOMO: 'Estudio Autónomo',
		SOBRECARGA_CONTINUA: 'Sobrecarga Continua',
		RECUPERACIÓN_TRANSLADO: 'Recuperación y Traslado',
		DISTRIBUCION: 'Distribución',
		RITMO: 'Ritmo',
		ENFOQUE: 'Enfoque',
		CONFLICTOS: 'Conflictos',
		ESTRUCTURA: 'Estructura',
		TRAYECTORIA: 'Trayectoria',
		DEPENDENCIAS: 'Dependencias',
		TEMÁTICA: 'Temática',
		SALUD: 'Salud',
		NUTRICION: 'Nutrición',
		REGULARIDAD: 'Regularidad', // Nueva métrica
		SEGURIDAD: 'Seguridad' // Nueva métrica
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
	import { cubicOut } from 'svelte/easing';
	import MaterialSymbolsHrRestingOutlineSharp from '$lib/icons/MaterialSymbolsHrRestingOutlineSharp.svelte';
	import MaterialSymbolsCirclesOutline from '$lib/icons/MaterialSymbolsCirclesOutline.svelte';
	import MaterialSymbolsGraph1 from '$lib/icons/MaterialSymbolsGraph1.svelte';
	import MingcuteBrainLine from '$lib/icons/MingcuteBrainLine.svelte';

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
			const tiempoNoInformado = Calendario.tiempoTraslado === -1;
			const TIEMPO_TRASLADO_MINS = tiempoNoInformado ? 60 : Calendario.tiempoTraslado;

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
							label: STAT_LABELS.BAJA_CARGA,
							value: `${Días[ligero.dia]}`,
							// CAMBIO: Explicación amigable sin "scores" matemáticos
							tooltip: `Tu día más liviano.<br/><span class="opacity-70 text-xs">Calculado por tener menos créditos (${ligero.carga}) distribuidos con mayor holgura.</span>`
						});

						if (diff >= UMBRAL_HARDCORE) {
							out.push({
								icon: MaterialSymbolsLocalFireDepartmentRounded,
								label: STAT_LABELS.ALTA_INTENSIDAD,
								value: `${Días[pesado.dia]}`,
								// CAMBIO: Enfoque en la carga real
								tooltip: `Tu día de mayor exigencia.<br/><span class="opacity-70 text-xs">Concentra una alta carga académica (${pesado.carga} créditos) en alta densidad horaria.</span>`
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
					tooltip: `Carga presencial obligatoria.<br/><span class="opacity-70 text-xs">Total de horas cronológicas "de silla". No incluye estudio, transporte ni ventanas.</span>`
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
							'Mucha "challa". Tu enemigo no será la dificultad, sino el desorden administrativo (múltiples certámenes y tareas la misma semana). Usa agenda.';
						status = 'warning';
					} else if (pesoPromedio > 5.2) {
						perfil = 'Denso';
						desc =
							'Pocos ramos, pero "ladrillos". Un error te costará caro; requiere profundidad de estudio, no memorización rápida.';
						status = 'warning';
					}

					out.push({
						icon: MaterialSymbolsBalance,
						label: STAT_LABELS.ENFOQUE,
						value: perfil,
						tooltip: `Promedio: ${pesoPromedio.toFixed(1)} créditos por ramo.<br/><span class="opacity-70 text-xs">${desc}</span>`,
						status
					});
				}

				{
					// --- 3. Calidad de Vida (Análisis de Ventanas Tácticas vs Muertas) ---
					const ventanas = Calendario.ventanas;
					let ventanasMuertas = 0;
					let ventanasTacticas = 0;
					let tiempoMuertoTotal = 0;

					for (const v of ventanas) {
						const duracionMinutos = v.duraciónBloques * BLOQUE_DURATION_MINUTES;

						// Umbral: Menos de 160 min (aprox 2 bloques + intermedios) se considera "Tiempo Basura"
						if (duracionMinutos < 160) {
							ventanasMuertas++;
							tiempoMuertoTotal += duracionMinutos;
						} else {
							ventanasTacticas++;
						}
					}

					// CAMBIO: Solo mostramos la tarjeta si existen ventanas.
					// Si no hay ventanas (horario compacto), la métrica de "Eficiencia" (más abajo) mostrará 100%,
					// cubriendo este caso sin redundancia visual.
					if (ventanas.length > 0) {
						let status: StatStatus = 'success';
						let labelValor = 'Eficiente';
						let analisis = 'Tus tiempos libres son lo suficientemente largos para ser productivos.';

						if (ventanasMuertas >= 3) {
							status = 'danger';
							labelValor = 'Fragmentado'; // Queso Suizo
							analisis = `Tienes <b>${ventanasMuertas} ventanas "muertas"</b> (cortas). Esto genera fatiga cognitiva: el cerebro gasta energía cambiando de contexto (Clase → Espera → Clase) sin descansar realmente.`;
						} else if (ventanasMuertas > 0 && ventanasTacticas === 0) {
							status = 'warning';
							labelValor = 'Disperso';
							analisis =
								'Tienes ventanas cortas que no permiten estudio profundo ni vuelta a casa. Intenta agrupar bloques.';
						} else if (ventanasTacticas > 0) {
							status = 'success';
							labelValor = 'Estratégico';
							analisis = `Tienes ventanas "tácticas" (largas) que te permiten ir al gimnasio, estudiar en biblioteca o volver a casa.`;
						}

						out.push({
							icon: Moon,
							label: STAT_LABELS.VENTANAS,
							value: labelValor,
							tooltip: `${analisis}<br/><span class="opacity-70 text-xs">Tiempo muerto acumulado: ${(tiempoMuertoTotal / 60).toFixed(1)} hrs.</span>`,
							status
						});
					}
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
								'Pasas más tiempo "haciendo hora" que en clases. Si vives lejos, estás perdiendo vida.';
						} else if (eficiencia < 75) {
							status = 'warning';
							mensaje =
								'Densidad media. Si no usas las ventanas para avanzar materia, tu jornada se sentirá eterna innecesariamente.';
						} else {
							status = 'success';
							mensaje =
								'Jornada compacta. Entras, estudias y te vas. Ideal para tener vida fuera de la U.';
						}

						// Cálculo extra para el tooltip: Minutos libres por hora de clase
						const minutosLibresPorHora = Math.round(
							(minutosPermanencia - minutosAula) / (minutosAula / 60)
						);

						out.push({
							icon: MingcuteBrainLine,
							label: STAT_LABELS.EFICIENCIA,
							value: `${eficiencia}%`,
							tooltip: `Por cada 1 hora de clase, tienes <b>${minutosLibresPorHora} min</b> de "espera".<br/><span class="opacity-70 text-xs">${mensaje}</span>`,
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
							'<br/>La distribución actual sugiere una carga académica equilibrada que permite compatibilizar el estudio personal con periodos de descanso.';
						let advertenciaDatos = '';

						if (ramosSinSCT > 0) {
							status = 'warning';
							advertenciaDatos = `<br/><span class="opacity-100">Nota: Se detectaron ${ramosSinSCT} asignatura(s) sin información de créditos; la carga real será superior a la proyectada.</span>`;
						}

						if (horasAutonomasDiarias > 5.5) {
							status = 'danger';
							recomendacion =
								'<br/>Carga académica extrema. La dedicación diaria estimada deja un margen mínimo para actividades extracurriculares, representando un riesgo alto de agotamiento.';
						} else if (horasAutonomasDiarias > 4.0) {
							status = 'warning';
							recomendacion =
								'<br/>Carga académica elevada. El volumen de estudio autónomo requiere una planificación rigurosa de lunes a sábado para evitar el rezago en los contenidos.';
						}

						out.push({
							icon: MaterialSymbolsBookRibbon,
							label: STAT_LABELS.ESTUDIO_AUTONOMO,
							value: `${horasAutonomasDiarias.toFixed(1)} hrs/día`,
							tooltip: `Estimación de dedicación fuera del aula requerida para cumplir con los objetivos de aprendizaje.<br/><span class="opacity-70 text-xs">Cálculo basado en el Sistema de Créditos Transferibles (1 SCT = 27 horas de trabajo total). Representa el tiempo necesario para procesamiento de contenidos, trabajos y preparación de evaluaciones según la normativa académica.${recomendacion}${advertenciaDatos}</span>`,
							status
						});
					}
				}

				// --- 6. Análisis con IA ---
				{
					const aiResult = classifySchedule(ramos, creditosMap);

					// 1. Distribución
					if (!aiResult.distribution.isLowConfidence)
						out.push({
							icon: aiResult.distribution.icon,
							label: STAT_LABELS.DISTRIBUCION,
							value: aiResult.distribution.label,
							tooltip: aiResult.distribution.description,
							status: aiResult.distribution.status // ¡Directo!
						});

					// 2. Ritmo
					if (!aiResult.rhythm.isLowConfidence)
						out.push({
							icon: aiResult.rhythm.icon,
							label: STAT_LABELS.RITMO,
							value: aiResult.rhythm.label,
							tooltip: aiResult.rhythm.description,
							status: aiResult.rhythm.status // ¡Directo!
						});

					// 3. Estructura
					if (!aiResult.structure.isLowConfidence)
						out.push({
							icon: aiResult.structure.icon,
							label: STAT_LABELS.ESTRUCTURA,
							value: aiResult.structure.label,
							tooltip: aiResult.structure.description,
							status: aiResult.structure.status // ¡Directo!
						});
				}

				// --- 7. Alerta de Maratón (Sobrecarga Continua) ---
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

							// Lógica de Continuidad:
							// Se considera seguido si es n+1 Y NO es el corte del almuerzo (Bloque 8 -> 9)
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

					if (maxBloquesSeguidos >= 5) {
						const horasContinuas = (maxBloquesSeguidos * BLOQUE_DURATION_MINUTES) / 60;
						let status: StatStatus = 'warning';
						let recomendacion =
							'Estás superando los dos módulos lectivos estándar. El bloque de almuerzo (8-9) no es suficiente para "resetear" tu atención.';

						if (maxBloquesSeguidos >= 6) {
							status = 'danger';
							recomendacion =
								'Carga cognitiva crítica. Mantener la concentración por más de 4 horas continuas es fisiológicamente insostenible.';
						}

						out.push({
							icon: MaterialSymbolsDirectionsRun,
							label: STAT_LABELS.SOBRECARGA_CONTINUA,
							value: `${horasContinuas.toFixed(1)} hrs seguidas`,
							tooltip: `Maratón de <b>${maxBloquesSeguidos} bloques consecutivos</b> sin ventana.<br/><span class="opacity-70 text-xs">${recomendacion}</span>`,
							status
						});
					}
				}

				// --- 8. Higiene de Sueño & Factor Transporte (Jetlag Social) ---
				{
					let minTiempoLibreNocturno = 24 * 60;
					// Tiempo "muerto" obligado: Viaje vuelta + Viaje ida mañana + Rutina (Cena/Ducha ~60m)
					const TIEMPO_LOGISTICA = TIEMPO_TRASLADO_MINS * 2 + 60;

					for (let d = 0; d < 4; d++) {
						// Lunes a Jueves (para despertar Mar-Vie)
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

							// Espacio bruto entre salir de la U y volver a entrar
							const brecha = 1440 - horaFinHoy + horaInicioManana;
							if (brecha < minTiempoLibreNocturno) {
								minTiempoLibreNocturno = brecha;
							}
						}
					}

					// Calculamos el sueño REAL disponible (descontando traslados)
					const sueñoDisponible = minTiempoLibreNocturno - TIEMPO_LOGISTICA;

					// Umbral: Menos de 7 horas (420 min) de sueño disponible es Warning
					if (sueñoDisponible < 450) {
						// < 7.5 horas disponibles (para dormir aprox 6-7)
						const horasSueñoEst = (sueñoDisponible / 60).toFixed(1);
						let status: StatStatus = 'warning';
						let msg = `Considerando ${TIEMPO_TRASLADO_MINS} min de traslado, tu ventana real de sueño sería de aprox. <b>${horasSueñoEst} hrs</b>.`;

						if (tiempoNoInformado) {
							msg += `<br/><br/>⚠️ <b>Nota:</b> Al no haber informado tu tiempo de traslado, se asume un promedio de 1hr por seguridad. La precisión de esta métrica es baja.`;
						}
						if (sueñoDisponible < 360) {
							// < 6 horas disponibles (Danger)
							status = 'danger';
							msg = `<b>Alerta Crítica:</b> Tu horario más los tiempos de traslado (${TIEMPO_TRASLADO_MINS} min) te dejan menos de 6 horas para dormir. Riesgo alto de déficit cognitivo.`;
						}

						out.push({
							icon: Moon,
							label: STAT_LABELS.RECUPERACIÓN_TRANSLADO,
							value: `${horasSueñoEst} hrs netas`, // Valor más realista
							tooltip: msg,
							status
						});
					}
				}

				// --- 9. Riesgo Nutricional (Bloque Protegido) ---
				{
					// Usamos BLOQUE_COMIDA importado (usualmente 9 o similar en USM, o franja 12:50-14:00)
					// Si no está definido, asumimos bloques 9 y 10 como franja crítica de almuerzo.
					const bloquesAlmuerzo = [BLOQUE_COMIDA, BLOQUE_COMIDA + 1].filter((b) => b !== undefined);
					// Fallback si la constante es un solo bloque, buscamos la ventana 12:15 - 14:30 aprox
					const diasSinAlmuerzo: number[] = [];

					for (let d = 0; d <= 5; d++) {
						const bloquesDia = ramos
							.flatMap((r) => r.horario)
							.filter((b) => b.dia === d)
							.map((b) => b.bloque);
						if (bloquesDia.length === 0) continue;

						// Verificamos si tiene ocupada TODA la franja de almuerzo (ej: 9 Y 10 ocupados)
						// Ajustar según la grilla horaria específica de la institución
						const tieneTopeAlmuerzo = bloquesAlmuerzo.every((b) => bloquesDia.includes(b));

						if (tieneTopeAlmuerzo) {
							diasSinAlmuerzo.push(d);
						}
					}

					if (diasSinAlmuerzo.length > 0) {
						out.push({
							icon: MaterialSymbolsLocalFireDepartmentRounded, // Icono de alerta/calorías
							label: STAT_LABELS.NUTRICION, // Asegurar que exista en STAT_LABELS
							value: 'Sin Almuerzo',
							tooltip: `Días críticos: <b>${diasSinAlmuerzo.map((d) => Días[d]).join(', ')}</b> sin ventana para comer. Riesgo de hipoglucemia funcional (baja concentración en bloques de la tarde).`,
							status: 'danger'
						});
					}
				}

				// --- 10. Regularidad Circadiana (Anclaje Matutino) ---
				{
					// Extraer hora de inicio (en minutos) de cada día con clases
					const inicios = [];
					for (let d = 0; d <= 5; d++) {
						const bloquesDia = ramos
							.flatMap((r) => r.horario)
							.filter((b) => b.dia === d)
							.map((b) => b.bloque);
						if (bloquesDia.length > 0) {
							inicios.push(Time.bloqueToMinutes(Math.min(...bloquesDia)));
						}
					}

					if (inicios.length > 2) {
						const n = inicios.length;
						const media = inicios.reduce((a, b) => a + b) / n;
						const varianza = inicios.reduce((a, b) => a + Math.pow(b - media, 2), 0) / n;
						const desviacionEstandar = Math.sqrt(varianza);

						// Si la desviación es mayor a 90 minutos (1.5 horas), hay desajuste
						if (desviacionEstandar > 90) {
							out.push({
								icon: MaterialSymbolsHrRestingOutlineSharp,
								label: STAT_LABELS.REGULARIDAD,
								value: 'Irregular',
								tooltip: `Tus horarios de entrada varían drásticamente (Desviación > 1.5h).<br/><span class="opacity-70 text-xs">El cerebro optimiza recursos cuando tienes una rutina de mañana fija ("Anclaje Circadiano"). Intenta estandarizar tu hora de levantada aunque entres tarde.</span>`,
								status: 'warning'
							});
						}
					}
				}

				// --- 11. Seguridad Logística (Llegada a Casa) ---
				{
					const diasSalidaTardia: { dia: string; horaLlegada: string }[] = [];
					// Umbral: Llegar a casa después de las 21:00 se considera riesgo/molestia
					const MINUTOS_CORTE_LLEGADA = 21 * 60;

					for (let d = 0; d <= 5; d++) {
						const bloquesDia = ramos
							.flatMap((r) => r.horario)
							.filter((b) => b.dia === d)
							.map((b) => b.bloque);
						if (bloquesDia.length > 0) {
							const ultimoBloque = Math.max(...bloquesDia);
							const horaSalidaMins = Time.bloqueToMinutes(ultimoBloque) + BLOQUE_DURATION_MINUTES;
							const horaLlegadaMins = horaSalidaMins + TIEMPO_TRASLADO_MINS;

							if (horaLlegadaMins > MINUTOS_CORTE_LLEGADA) {
								const horaHH = Math.floor(horaLlegadaMins / 60);
								const horaMM = horaLlegadaMins % 60;
								diasSalidaTardia.push({
									dia: Días[d],
									horaLlegada: `${horaHH}:${horaMM.toString().padStart(2, '0')}`
								});
							}
						}
					}

					if (diasSalidaTardia.length > 0) {
						const detalle = diasSalidaTardia.map((d) => `${d.dia} (~${d.horaLlegada})`).join(', ');

						let tooltipSeguridad = `Considerando tu traslado (${TIEMPO_TRASLADO_MINS} min), llegarías a casa después de las 21:00 hrs: <br/><b>${detalle}</b>.`;

						if (tiempoNoInformado) {
							tooltipSeguridad += `<br/><br/>⚠️ <b>Certeza limitada:</b> Cálculo basado en una estimación genérica (1hr). Revisa según tu realidad local.`;
						}

						out.push({
							icon: MaterialSymbolsWarningRounded,
							label: STAT_LABELS.SEGURIDAD,
							value: 'Llegada Tarde',
							tooltip: tooltipSeguridad,
							status: 'warning'
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
						tooltip: `Conflicto de horario crítico.<br/><span class="opacity-70 text-xs">Tienes ramos chocando en el mismo bloque.</span>`,
						status: 'danger'
					});
				}

				// --- 12. Análisis Curricular (Inteligencia de Malla) ---
				{
					// Helper: Busca nivel, requisitos Y nombre de la carrera
					const getDatosCurriculares = (sigla: string) => {
						const carreras = Data.cachedCarreras;

						for (const carrera of carreras) {
							for (const mencion of Object.values(carrera['menciones/especialidades'])) {
								for (const plan of Object.values(mencion.planes)) {
									const nivel = plan.malla.findIndex((semestre) => semestre[sigla]);
									if (nivel !== -1) {
										return {
											nivel: nivel + 1,
											info: plan.malla[nivel][sigla],
											carrera: carrera.nombre // <--- Capturamos el nombre
										};
									}
								}
							}
						}
						return null;
					};

					// Enriquecemos los ramos con su data curricular
					const datosRamos = ramos
						.map((r) => ({ sigla: r.sigla, ...getDatosCurriculares(r.sigla) }))
						.filter((d) => d.nivel);

					// Detectamos la carrera "Principal" (la que más se repite entre los ramos inscritos)
					// Esto evita que un ramo de plan común te diga "Estás estudiando Arquitectura" si eres Ingeniero.
					const conteoCarreras: Record<string, number> = {};
					datosRamos.forEach((d) => {
						if (d.carrera) conteoCarreras[d.carrera] = (conteoCarreras[d.carrera] || 0) + 1;
					});
					const carreraDetectada = Object.keys(conteoCarreras).reduce(
						(a, b) => (conteoCarreras[a] > conteoCarreras[b] ? a : b),
						'Tu Carrera'
					);

					// A. TRAYECTORIA (Dispersión Curricular)
					if (datosRamos.length > 1) {
						const niveles = datosRamos.map((d) => d.nivel ?? 0);
						const minNivel = Math.min(...niveles);
						const maxNivel = Math.max(...niveles);
						const dispersion = maxNivel - minNivel;

						if (dispersion >= 4) {
							out.push({
								icon: MaterialSymbolsTimeline,
								label: STAT_LABELS.TRAYECTORIA,
								value: 'Dispersa',
								tooltip: `Estás cursando simultáneamente asignaturas de niveles distantes (Semestre ${minNivel} y ${maxNivel}).<br/><span class="opacity-70 text-xs">Análisis realizado contrastando tu carga con el plan de estudios de <b>${carreraDetectada}</b>. Esta dispersión suele fragmentar la experiencia universitaria y dificulta el estudio grupal.</span>`,
								status: 'warning'
							});
						}
					}

					// B. Cadena de Riesgo (Prerrequisitos Simultáneos)
					// Detecta si tomaste "Física 1" y "Física 2" al mismo tiempo.
					const siglasTomadas = new Set(ramos.map((r) => r.sigla));
					const cadenasPeligrosas: string[] = [];

					datosRamos.forEach((d) => {
						if (d.info && d.info.requisitos) {
							// d.info.requisitos es Array de Arrays (OR logic). Aplanamos para buscar coincidencias.
							const reqsPlanos = d.info.requisitos.flat();
							// Si alguno de los requisitos de este ramo TAMBIÉN está en los ramos tomados
							const conflicto = reqsPlanos.find((req) => siglasTomadas.has(req));

							if (conflicto) {
								cadenasPeligrosas.push(`${conflicto} ➔ ${d.sigla}`);
							}
						}
					});

					if (cadenasPeligrosas.length > 0) {
						out.push({
							icon: MaterialSymbolsGraph1,
							label: STAT_LABELS.DEPENDENCIAS,
							value: 'Tope Académico',
							tooltip: `Estás tomando asignaturas junto a sus prerrequisitos: <b>${cadenasPeligrosas.join(', ')}</b>.<br/><span class="opacity-70 text-xs">Pedagógicamente riesgoso: si fallas en la base, es muy probable que falles en la avanzada.</span>`,
							status: 'danger'
						});
					}

					// C. Saturación Departamental (Monotemática)
					// Cuenta créditos por departamento
					const deptos: Record<string, number> = {};
					let totalCreditosConDepto = 0;

					datosRamos.forEach((d) => {
						if (d.info && d.info.departamento) {
							const depto = d.info.departamento;
							const cred = d.info.creditos || 3; // Fallback 3 créditos
							deptos[depto] = (deptos[depto] || 0) + cred;
							totalCreditosConDepto += cred;
						}
					});

					// Buscar si algún depto tiene > 65% de la carga
					for (const [depto, cred] of Object.entries(deptos)) {
						if (
							totalCreditosConDepto > 0 &&
							cred / totalCreditosConDepto > 0.65 &&
							ramos.length >= 3
						) {
							// Simplificar nombres largos de departamentos si es necesario
							const nombreDepto = depto.replace('Departamento de ', '');

							out.push({
								icon: MaterialSymbolsCirclesOutline,
								label: STAT_LABELS.TEMÁTICA,
								value: 'Monotemático',
								tooltip: `El ${((cred / totalCreditosConDepto) * 100).toFixed(0)}% de tu carga es de <b>${nombreDepto}</b>.<br/><span class="opacity-70 text-xs">Saturación cognitiva: Estás ejercitando el mismo "músculo mental" todo el semestre. Intenta variar para evitar burnout.</span>`,
								status: 'warning'
							});
						}
					}
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
	<Tooltip
		wrapperClass="group"
		content="Estas métricas son una guía orientativa, diseñadas a partir de patrones comunes en la vida universitaria chilena, tiempos de traslado y heurísticas de gestión del tiempo. No constituyen un diagnóstico profesional; úsalas como una herramienta de apoyo para visualizar mejor tu carga académica."
	>
		<h1 class="flex items-center gap-2 text-sm font-normal">
			<span
				class="decoration-foreground/50 underline decoration-dotted underline-offset-2 group-hover:decoration-solid"
				>Estadísticas</span
			>
			<span class="opacity-50">(Referencial)</span>
		</h1>
	</Tooltip>
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
							wrapperClass="w-full cursor-help"
							position="right"
						>
							<Card
								class="group isolate flex w-full flex-row items-center gap-1.5 px-2.5! py-1! 2xl:gap-2 2xl:px-3! 2xl:py-1.5! {stat.status
									? statusColors[stat.status]
									: ''} shadow-sm/50!"
							>
								<div class="size-4 shrink-0 opacity-70">
									<stat.icon class="h-full w-full scale-125" />
								</div>

								<Tooltip wrapperClass="truncate select-none mix-blend-lighten" content={stat.label}>
									<span
										class="decoration-foreground/50 truncate underline decoration-dotted underline-offset-2 opacity-90 group-hover:decoration-solid"
										>{stat.label}</span
									>
								</Tooltip>
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
