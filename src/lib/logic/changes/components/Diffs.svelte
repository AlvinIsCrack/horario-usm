<script lang="ts">
	import jsonlContent from '$lib/data/historial_cambios.jsonl?raw';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import 'dayjs/locale/es';
	import { tv } from 'tailwind-variants';
	import Tooltip from '../../../components/ui/Tooltip.svelte';
	import Badge from '../../../components/ui/Badge.svelte';
	import { onMount } from 'svelte';
	import { SmartReadTracker } from '$lib/logic/changes/readStatus';
	import { Config } from '$lib/logic/config/store.svelte';

	dayjs.extend(relativeTime);
	dayjs.locale('es');

	// --- Definición de Tipos del Reporte ---

	interface ReporteCambios {
		metadata: {
			timestamp: number;
			fecha: string;
			hora: string;
			total_eventos: number;
		};
		eventos: EventoDiff[];
	}

	type EventoDiff =
		| EventoEstructural
		| EventoAsignatura
		| EventoParaleloEstado
		| EventoCambioCupo
		| EventoCambioProfesor
		| EventoCambioHorario
		| EventoCambioMetadata; // [NUEVO] Para Nombre y Departamento

	// 1. Estructurales
	type EventoEstructural = EventoSede | EventoJornada | EventoPeriodo;

	interface EventoSede {
		tipo: 'NUEVA_SEDE' | 'ELIMINACION_MASIVA';
		nivel: 'SEDE';
		nombre: string;
		timestamp: number;
	}
	interface EventoJornada {
		tipo: 'NUEVA_JORNADA' | 'ELIMINACION_MASIVA';
		nivel: 'JORNADA';
		ruta: { sede: string };
		nombre: string;
		timestamp: number;
	}
	interface EventoPeriodo {
		tipo: 'NUEVO_PERIODO' | 'ELIMINACION_PERIODO';
		ruta: { sede: string; jornada: string; periodo: string };
		timestamp: number;
	}

	// 2. Asignatura
	interface EventoAsignatura {
		tipo: 'NUEVA_ASIGNATURA' | 'RETIRO_ASIGNATURA';
		entidad: 'ASIGNATURA';
		ruta: { sede: string; jornada: string; periodo: string; sigla: string };
		nombre: string;
		timestamp: number;
	}

	// 3. Paralelos
	interface ContextoParalelo {
		sede: string;
		jornada: string;
		periodo: string;
		sigla: string;
		paralelo: string;
	}

	interface EventoParaleloEstado {
		tipo: 'NUEVO_PARALELO' | 'ELIMINADO_PARALELO';
		entidad: 'PARALELO';
		ruta: ContextoParalelo;
		asignatura: string;
		timestamp: number;
	}
	interface EventoCambioCupo {
		tipo: 'CAMBIO_CUPO';
		entidad: 'PARALELO';
		ruta: ContextoParalelo;
		asignatura: string;
		timestamp: number;
		detalle: {
			anterior: number;
			nuevo: number;
			delta: number;
			es_apertura: boolean;
			es_cierre: boolean;
		};
	}
	interface EventoCambioProfesor {
		tipo: 'CAMBIO_PROFESOR';
		entidad: 'PARALELO';
		ruta: ContextoParalelo;
		asignatura: string;
		timestamp: number;
		detalle: {
			entrantes: string[];
			salientes: string[];
		};
	}
	interface EventoCambioHorario {
		tipo: 'CAMBIO_HORARIO';
		entidad: 'PARALELO';
		ruta: ContextoParalelo;
		asignatura: string;
		timestamp: number;
		detalle: {
			logistica: string[]; // Ahora incluye cambios de Campus, Sala, Tipo, Profe
			bloques_nuevos: number;
			bloques_eliminados: number;
		};
	}
	// [NUEVO] Interfaz para cambios de metadatos (Nombre, Depto)
	interface EventoCambioMetadata {
		tipo: 'CAMBIO_NOMBRE' | 'CAMBIO_DEPARTAMENTO';
		entidad: 'PARALELO';
		ruta: ContextoParalelo;
		asignatura: string;
		timestamp: number;
		detalle: {
			anterior: string;
			nuevo: string;
		};
	}

	// --- Tipos para la UI ---

	interface ResumenAsignatura {
		sigla: string;
		nombre: string;
		tipos: Set<string>; // 'CUPO', 'HORARIO', 'PROFESOR', 'ESTADO', 'METADATA'
		cupoDelta: number;
		cupoAperturas: number;
		alertas: string[];
		esCritico: boolean;
		conteoEventos: number;
	}

	interface ItemEstructural {
		esEstructural: true;
		mensaje: string;
		tipo: 'ALERTA' | 'INFO';
	}

	type ItemUI = ResumenAsignatura | ItemEstructural;

	interface GrupoHistorial {
		timestamp: number;
		fecha: string;
		hora: string;
		relativo: string;
		items: ItemUI[];
	}

	// --- Lógica de Procesamiento ---

	const rawData: ReporteCambios[] = (() => {
		try {
			return jsonlContent
				.trim()
				.split('\n')
				.filter((line) => line.trim() !== '')
				.map((line) => JSON.parse(line) as ReporteCambios);
		} catch (error) {
			console.error('Error parseando JSONL:', error);
			return [];
		}
	})();

	function esEventoRelevante(ev: EventoDiff, sedeActual: string, jornadaActual: string): boolean {
		if (ev.tipo === 'NUEVA_SEDE' || (ev.tipo === 'ELIMINACION_MASIVA' && ev.nivel === 'SEDE')) {
			return ev.nombre === sedeActual;
		}
		if (
			ev.tipo === 'NUEVA_JORNADA' ||
			(ev.tipo === 'ELIMINACION_MASIVA' && ev.nivel === 'JORNADA')
		) {
			return ev.ruta.sede === sedeActual && ev.nombre === jornadaActual;
		}
		if ('ruta' in ev && 'sede' in ev.ruta && 'jornada' in ev.ruta) {
			return ev.ruta.sede === sedeActual && ev.ruta.jornada === jornadaActual;
		}
		return false;
	}

	let historial = $derived.by(() => {
		const sede = Config.sede;
		const jornada = Config.jornada;

		if (!sede || !jornada) return [];

		return rawData
			.map((data) => {
				const eventosFiltrados = data.eventos.filter((ev) => esEventoRelevante(ev, sede, jornada));

				if (eventosFiltrados.length === 0) return null;

				const mapAsignaturas = new Map<string, ResumenAsignatura>();
				const itemsEstructurales: ItemEstructural[] = [];

				for (const ev of eventosFiltrados) {
					// 1. Manejo Estructural
					if (
						ev.tipo === 'ELIMINACION_MASIVA' ||
						ev.tipo === 'NUEVA_SEDE' ||
						ev.tipo === 'NUEVA_JORNADA' ||
						ev.tipo === 'ELIMINACION_PERIODO'
					) {
						let msg = '';
						if ('nombre' in ev) msg = `${ev.tipo} ${ev.nombre}`;
						else if (ev.tipo === 'ELIMINACION_PERIODO')
							msg = `Periodo eliminado ${ev.ruta.periodo}`;

						itemsEstructurales.push({
							esEstructural: true,
							mensaje: msg,
							tipo: ev.tipo.includes('ELIMINACION') ? 'ALERTA' : 'INFO'
						});
						continue;
					}

					// 2. Obtener Sigla y Nombre
					let sigla = '';
					let nombreAsig = '';

					//@ts-ignore
					if (ev.entidad === 'ASIGNATURA') {
						//@ts-ignore
						sigla = ev.ruta.sigla;
						//@ts-ignore
						nombreAsig = ev.nombre;
						//@ts-ignore
					} else if (ev.entidad === 'PARALELO') {
						//@ts-ignore
						sigla = ev.ruta.sigla;
						//@ts-ignore
						nombreAsig = ev.asignatura;
					}

					if (!sigla) continue;

					// 3. Inicializar Resumen
					if (!mapAsignaturas.has(sigla)) {
						mapAsignaturas.set(sigla, {
							sigla,
							nombre: nombreAsig,
							tipos: new Set(),
							cupoDelta: 0,
							cupoAperturas: 0,
							alertas: [],
							esCritico: false,
							conteoEventos: 0
						});
					}
					const r = mapAsignaturas.get(sigla)!;
					r.conteoEventos++;

					// 4. Procesar Detalle por Tipo
					switch (ev.tipo) {
						case 'RETIRO_ASIGNATURA':
							r.tipos.add('RETIRO');
							r.esCritico = true;
							r.alertas.push('Asignatura retirada de la oferta');
							break;
						case 'NUEVA_ASIGNATURA':
							r.tipos.add('NUEVA');
							r.alertas.push('Nueva asignatura disponible');
							break;
						case 'NUEVO_PARALELO':
							r.tipos.add('PARALELO');
							r.alertas.push(`Nuevo paralelo ${ev.ruta.paralelo}`);
							break;
						case 'ELIMINADO_PARALELO':
							r.tipos.add('PARALELO');
							r.esCritico = true;
							r.alertas.push(`Paralelo ${ev.ruta.paralelo} eliminado`);
							break;
						case 'CAMBIO_CUPO':
							r.tipos.add('CUPO');
							r.cupoDelta += ev.detalle.delta;
							if (ev.detalle.es_apertura) r.cupoAperturas++;
							if (ev.detalle.es_cierre) r.esCritico = true;
							break;
						case 'CAMBIO_HORARIO':
							r.tipos.add('HORARIO');
							r.esCritico = true;
							// La logística ahora puede incluir cambios de Campus
							if (ev.detalle.logistica.length > 0) {
								r.alertas.push(
									`P${ev.ruta.paralelo}: ${ev.detalle.logistica[0]}` +
										(ev.detalle.logistica.length > 1 ? '...' : '')
								);
							} else {
								r.alertas.push(`Cambio bloques P${ev.ruta.paralelo}`);
							}
							break;
						case 'CAMBIO_PROFESOR':
							r.tipos.add('PROFESOR');
							const entra = ev.detalle.entrantes.join(', ');
							const sale = ev.detalle.salientes.join(', ');
							r.alertas.push(`P${ev.ruta.paralelo}: ${sale || '?'} -> ${entra || '?'}`);
							break;
						// [NUEVO] Casos para Metadatos
						case 'CAMBIO_NOMBRE':
							r.tipos.add('METADATA');
							r.alertas.push(`Nombre actualizado: ${ev.detalle.anterior} -> ${ev.detalle.nuevo}`);
							break;
						case 'CAMBIO_DEPARTAMENTO':
							r.tipos.add('METADATA');
							r.alertas.push(`Depto. actualizado: ${ev.detalle.anterior} -> ${ev.detalle.nuevo}`);
							break;
					}
				}

				const items: ItemUI[] = [...itemsEstructurales, ...Array.from(mapAsignaturas.values())];

				return {
					timestamp: data.metadata.timestamp,
					fecha: data.metadata.fecha,
					hora: data.metadata.hora,
					relativo: dayjs.unix(data.metadata.timestamp).fromNow(),
					items
				} as GrupoHistorial;
			})
			.filter((grupo): grupo is GrupoHistorial => grupo !== null)
			.reverse();
	});

	// --- Estilos ---
	const diffs = tv({
		slots: {
			container: 'mx-auto flex h-full w-full max-w-2xl flex-col gap-4',
			grupoWrapper: 'flex flex-col gap-1',
			header:
				'flex items-baseline gap-2 px-1 text-sm mb-0.5 font-bold uppercase tracking-wide text-muted-foreground',
			card: 'group flex w-full items-center gap-3 mr-1 rounded-md px-4 py-0.5',
			cardStructural: 'rounded-md gap-3 border border-dashed px-3 py-0.5 text-xs font-medium',
			indicador: 'h-2 w-2 rounded-full shrink-0 hover:scale-105 hover:ring-2',
			content: 'flex min-w-0 flex-1 flex-col',
			filaPrincipal: 'flex items-baseline gap-2.5 overflow-hidden whitespace-nowrap',
			sigla: 'font-mono text-base font-black tracking-wide text-foreground',
			nombre: 'truncate text-xs font-medium text-foreground/70',
			badgesRow: 'flex flex-wrap gap-1',
			alertaTexto: 'truncate text-xs font-normal text-muted-foreground/80',
			stats: 'ml-auto flex shrink-0 items-center gap-2 text-xs'
		},
		variants: {
			status: {
				pos: { indicador: 'bg-green-500', card: 'bg-green-800/50', alertaTexto: 'text-green-500' },
				neg: { indicador: 'bg-rose-500', card: 'bg-rose-800/50', alertaTexto: 'text-rose-500' },
				warn: { indicador: 'bg-amber-500', card: 'bg-amber-700/50', alertaTexto: 'text-amber-500' },
				neu: { indicador: 'bg-cyan-500', card: 'bg-cyan-800/50', alertaTexto: 'text-cyan-500' }
			},
			structType: {
				ALERTA: { cardStructural: 'border-rose-500/50 bg-rose-500/10 text-rose-600' },
				INFO: { cardStructural: 'border-blue-500/50 bg-blue-500/10 text-blue-600' }
			},
			new: {
				false: {},
				true: {
					card: 'bg-gradient-to-r from-amber-500/50 to-50% to-transparent',
					cardStructural: ''
				}
			}
		}
	});

	const s = diffs();

	function getStatus(r: ResumenAsignatura) {
		if (r.tipos.has('RETIRO') || r.tipos.has('ELIMINADO_PARALELO')) return 'neg';
		if (r.cupoAperturas > 0 || r.tipos.has('NUEVA') || r.cupoDelta > 0) return 'pos';
		if (r.esCritico || r.tipos.has('HORARIO')) return 'warn';
		// Los cambios de Metadata los tratamos como neutrales/info
		if (r.tipos.has('METADATA')) return 'neu';
		return 'neu';
	}

	function getStatusTooltip(r: ResumenAsignatura): string {
		if (r.tipos.has('RETIRO')) return 'Asignatura Retirada';
		if (r.tipos.has('ELIMINADO_PARALELO')) return 'Paralelo Eliminado';
		if (r.tipos.has('NUEVA')) return 'Nueva Asignatura';
		if (r.cupoAperturas > 0) return 'Apertura de Cupos (Nuevo)';
		if (r.cupoDelta > 0) return 'Aumento de Cupos';
		if (r.cupoDelta < 0) return 'Disminución de Cupos';
		if (r.tipos.has('HORARIO')) return 'Cambio de Horario/Campus';
		if (r.tipos.has('PROFESOR')) return 'Cambio de Profesor';
		if (r.tipos.has('METADATA')) return 'Actualización de Datos (Nombre/Depto)';
		return 'Evento registrado';
	}

	let { hasNewEvents = $bindable(false) } = $props();

	let newItems = $state(new Set<number>());
	onMount(() => {
		const tracker = new SmartReadTracker({
			storageKey: 'app_diffs_seen',
			thresholdHours: 2,
			nightStartHour: 0,
			nightEndHour: 7
		});

		// Extraemos todos los timestamps de todos los grupos del historial
		const allTimestamps: number[] = [];
		for (const grupo of historial) allTimestamps.push(grupo.timestamp);

		newItems = tracker.process(allTimestamps) as Set<number>;
		if (newItems.size > 0) hasNewEvents = true;
	});
</script>

{#if Config.sede && Config.jornada}
	<section role="log" class={s.container({})}>
		<div class="-mb-4 w-full px-1">
			<h1 class="text-foreground text-xl font-bold uppercase">
				Cambios de siga para {Config.sede}
			</h1>
		</div>

		<div class="scroller h-full overflow-y-auto mask-b-from-95% mask-b-to-100%">
			{#each historial as grupo (grupo.timestamp)}
				<div class={s.grupoWrapper()}>
					<header class={s.header()}>
						<Tooltip content="{grupo.fecha} a las {grupo.hora}">
							<span class="decoration-foreground/50 cursor-help underline decoration-dotted"
								>{grupo.relativo}</span
							>
						</Tooltip>
						<div class="bg-border/40 ml-2 h-px flex-1"></div>
						<span class="ml-2 opacity-60">{grupo.items.length} eventos</span>
					</header>

					<div class="ml-2 flex flex-col gap-1 pl-0">
						{#each grupo.items as item}
							{@const status = getStatus(item)}

							{#if 'esEstructural' in item}
								<div
									class={s.cardStructural({
										structType: item.tipo,
										new: newItems.has(grupo.timestamp),
										status
									})}
								>
									{item.mensaje}
								</div>
							{:else}
								<Tooltip content={getStatusTooltip(item)}>
									<div class={s.card({ new: newItems.has(grupo.timestamp), status })}>
										<div class={s.indicador({ status })}></div>

										<div class={s.content()}>
											<div class={s.filaPrincipal()}>
												<span class={s.sigla()}>{item.sigla}</span>
												<span class={s.nombre()}>{item.nombre}</span>
											</div>

											<div class={s.badgesRow()}>
												{#if item.alertas.length > 0}
													<span class={s.alertaTexto({ status })}>{item.alertas[0]}</span>
													{#if item.alertas.length > 1}
														<Tooltip content={item.alertas.slice(1).join('\n')}>
															<Badge
																class="bg-muted/50 text-muted-foreground hover:bg-muted h-4 cursor-help px-1 py-0 text-[9px]"
															>
																+{item.alertas.length - 1}
															</Badge>
														</Tooltip>
													{/if}
												{/if}
											</div>
										</div>

										<div class={s.stats()}>
											{#if item.cupoDelta !== 0}
												<Tooltip content="Variación de Cupos">
													<div class="flex flex-col items-end leading-none">
														<span
															class="font-bold {item.cupoDelta > 0
																? 'text-emerald-500'
																: 'text-rose-500'}"
														>
															{item.cupoDelta > 0 ? '+' : ''}{item.cupoDelta}
														</span>
														<span class="text-muted-foreground text-[9px] uppercase">Cupos</span>
													</div>
												</Tooltip>
											{/if}
											{#if item.cupoAperturas > 0}
												<Tooltip content="Se han abierto nuevos cupos en paralelos cerrados">
													<Badge
														class="border-emerald-500/20 bg-emerald-500/15 text-[9px] text-emerald-600 hover:bg-emerald-500/25"
													>
														OPEN
													</Badge>
												</Tooltip>
											{/if}
										</div>
									</div>
								</Tooltip>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	/* Estilo para Chrome, Edge, Safari */
	.scroller::-webkit-scrollbar {
		width: 6px;
	}

	.scroller::-webkit-scrollbar-track {
		background: transparent;
	}

	.scroller::-webkit-scrollbar-thumb {
		background-color: rgba(156, 163, 175, 0.3);
		border-radius: 20px;
		border: 2px solid transparent;
		background-clip: content-box;
	}

	.scroller::-webkit-scrollbar-thumb:hover {
		background-color: rgba(156, 163, 175, 0.6);
	}

	/* Estilo para Firefox */
	.scroller {
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
	}
</style>
