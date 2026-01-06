<script lang="ts">
	import jsonlContent from '$lib/data/historial_cambios.jsonl?raw';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import 'dayjs/locale/es'; // Asegúrate de tener esto o configura tu locale
	import { tv } from 'tailwind-variants';
	import Tooltip from '../ui/Tooltip.svelte';
	import Badge from '../ui/Badge.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';

	dayjs.extend(relativeTime);
	dayjs.locale('es');

	// --- Definición de Tipos del Reporte (Mismos que definimos) ---

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
		| EventoCambioHorario;

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
			logistica: string[];
			bloques_nuevos: number;
			bloques_eliminados: number;
		};
	}

	// --- Tipos para la UI ---

	interface ResumenAsignatura {
		sigla: string;
		nombre: string;
		tipos: Set<string>; // 'CUPO', 'HORARIO', 'PROFESOR', 'ESTADO'
		cupoDelta: number;
		cupoAperturas: number;
		alertas: string[]; // Mensajes legibles (ej: "Profesor cambiado en P-1")
		esCritico: boolean; // Si hubo cierre, eliminación o cambio horario
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

	// 2. Parseo inicial único (Estático, no depende de la Sede/Jornada)
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

	// 3. Helper para filtrar eventos según el contexto actual
	function esEventoRelevante(ev: EventoDiff, sedeActual: string, jornadaActual: string): boolean {
		// A. Eventos de Sede (Nivel Alto)
		if (ev.tipo === 'NUEVA_SEDE' || (ev.tipo === 'ELIMINACION_MASIVA' && ev.nivel === 'SEDE')) {
			return ev.nombre === sedeActual;
		}

		// B. Eventos de Jornada (Nivel Medio)
		if (
			ev.tipo === 'NUEVA_JORNADA' ||
			(ev.tipo === 'ELIMINACION_MASIVA' && ev.nivel === 'JORNADA')
		) {
			return ev.ruta.sede === sedeActual && ev.nombre === jornadaActual;
		}

		// C. Eventos Específicos (Periodo, Asignatura, Paralelo)
		// Todos estos tienen `ruta` con `sede` y `jornada`
		if ('ruta' in ev && 'sede' in ev.ruta && 'jornada' in ev.ruta) {
			return ev.ruta.sede === sedeActual && ev.ruta.jornada === jornadaActual;
		}

		return false;
	}

	// 4. Estado Derivado Reactivo: Recalcula cuando cambia Calendario.sede o Calendario.jornada
	let historial = $derived.by(() => {
		const sede = Calendario.sede;
		const jornada = Calendario.jornada;

		// Si no hay contexto seleccionado, ¿mostramos todo o nada?
		// Asumiremos que si no hay selección, no hay historial relevante para "tu" horario.
		if (!sede || !jornada) return [];

		return rawData
			.map((data) => {
				// Filtramos los eventos crudos antes de procesarlos
				const eventosFiltrados = data.eventos.filter((ev) => esEventoRelevante(ev, sede, jornada));

				// Si no queda ningún evento tras filtrar, descartamos este grupo temporal
				if (eventosFiltrados.length === 0) return null;

				const mapAsignaturas = new Map<string, ResumenAsignatura>();
				const itemsEstructurales: ItemEstructural[] = [];

				for (const ev of eventosFiltrados) {
					// --- Lógica de Agrupación (Idéntica a la anterior, pero sobre filtrados) ---

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

					// TypeScript guard para acceder a propiedades específicas
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

	// --- Lógica de Estado de Expansión Mejorada ---
	let isExpanded = $state(true);
	let leaveTimer: ReturnType<typeof setTimeout>;

	// Auto-colapso inicial
	$effect(() => {
		const timer = setTimeout(() => {
			isExpanded = false;
		}, 2000);
		return () => clearTimeout(timer);
	});

	function handleMouseEnter() {
		clearTimeout(leaveTimer);
		isExpanded = true;
	}

	function handleMouseLeave() {
		// Delay para evitar cierres accidentales (flicker)
		leaveTimer = setTimeout(() => {
			isExpanded = false;
		}, 450);
	}

	// --- Estilos ---
	const diffs = tv({
		slots: {
			container:
				'mx-auto will-change-contents flex w-full max-w-fit flex-col gap-4 pb-10 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]',
			grupoWrapper: 'flex flex-col gap-1',
			header:
				'flex items-baseline gap-2 px-1 text-[10px] -mb-1 font-bold uppercase tracking-wide text-muted-foreground',
			// Cards
			card: 'group flex items-center gap-3 mr-1 rounded-md px-3 py-1',
			cardStructural: 'mx-1 rounded-md border border-dashed px-2 py-1 text-xs font-medium',

			// Elementos internos
			indicador: 'h-2 w-2 rounded-full shrink-0',
			content: 'flex min-w-0 flex-1 flex-col', // Stack vertical para nombre y alertas
			filaPrincipal: 'flex items-baseline gap-2.5 overflow-hidden whitespace-nowrap',

			sigla: 'font-mono text-sm font-black tracking-wide text-foreground',
			nombre: 'truncate text-xs font-medium text-foreground/70',

			badgesRow: 'flex flex-wrap gap-1',
			alertaTexto: 'truncate text-xs font-normal text-muted-foreground/80',

			stats: 'ml-auto flex shrink-0 items-center gap-2 text-xs'
		},
		variants: {
			status: {
				pos: { indicador: 'bg-green-500', alertaTexto: 'text-green-500' },
				neg: { indicador: 'bg-rose-500', alertaTexto: 'text-rose-500' },
				warn: { indicador: 'bg-amber-500', alertaTexto: 'text-amber-500' },
				neu: { indicador: 'bg-cyan-500', alertaTexto: 'text-cyan-500' }
			},
			structType: {
				ALERTA: { cardStructural: 'border-rose-500/50 bg-rose-500/10 text-rose-600' },
				INFO: { cardStructural: 'border-blue-500/50 bg-blue-500/10 text-blue-600' }
			},
			expanded: {
				true: {
					container: 'max-h-100 opacity-100'
				},
				false: {
					container: 'max-h-30 opacity-60! scale-90'
				}
			}
		}
	});

	const s = diffs();

	// Helper para determinar color del indicador
	function getStatus(r: ResumenAsignatura) {
		if (r.tipos.has('RETIRO') || r.tipos.has('ELIMINADO_PARALELO')) return 'neg';
		if (r.cupoAperturas > 0 || r.tipos.has('NUEVA') || r.cupoDelta > 0) return 'pos';
		if (r.esCritico || r.tipos.has('HORARIO')) return 'warn';
		return 'neu';
	}

	// Helper para texto del tooltip del estado (el punto de color)
	function getStatusTooltip(r: ResumenAsignatura): string {
		if (r.tipos.has('RETIRO')) return 'Asignatura Retirada';
		if (r.tipos.has('ELIMINADO_PARALELO')) return 'Paralelo Eliminado';
		if (r.tipos.has('NUEVA')) return 'Nueva Asignatura';
		if (r.cupoAperturas > 0) return 'Apertura de Cupos (Nuevo)';
		if (r.cupoDelta > 0) return 'Aumento de Cupos';
		if (r.cupoDelta < 0) return 'Disminución de Cupos';
		if (r.tipos.has('HORARIO')) return 'Cambio de Horario Logístico';
		if (r.tipos.has('PROFESOR')) return 'Cambio de Profesor';
		return 'Evento registrado';
	}
</script>

{#if Calendario.sede && Calendario.jornada}
	<section
		class={s.container({ expanded: isExpanded })}
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<div class="-mb-4 px-1">
			<h1 class="text-foreground text-sm font-bold uppercase">
				Cambios de siga para {Calendario.sede}
			</h1>
		</div>

		<div
			class="scroller h-full overflow-y-auto {isExpanded
				? 'mask-b-from-95% mask-b-to-100%'
				: 'overflow-hidden mask-b-from-60% mask-b-to-100%'}"
		>
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

					<div class="ml-2 flex flex-col pl-0">
						{#each grupo.items as item}
							{#if 'esEstructural' in item}
								<div class={s.cardStructural({ structType: item.tipo })}>
									{item.mensaje}
								</div>
							{:else}
								{@const status = getStatus(item)}

								<div class={s.card()}>
									<Tooltip content={getStatusTooltip(item)}>
										<div class={s.indicador({ status })}></div>
									</Tooltip>

									<div class={s.content()}>
										<div class={s.filaPrincipal()}>
											<span class={s.sigla()}>{item.sigla}</span>
											<span class={s.nombre()}>{item.nombre}</span>
										</div>

										<div class={s.badgesRow()}>
											{#if item.alertas.length > 0}
												<span class={s.alertaTexto({ status })}>{item.alertas[0]}</span>
												{#if item.alertas.length > 1 && isExpanded}
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
		width: 6px; /* Ancho delgado */
	}

	.scroller::-webkit-scrollbar-track {
		background: transparent; /* Fondo invisible */
	}

	.scroller::-webkit-scrollbar-thumb {
		background-color: rgba(156, 163, 175, 0.3); /* Color gris sutil y translúcido */
		border-radius: 20px; /* Bordes totalmente redondeados */
		border: 2px solid transparent; /* Truco para 'encoger' visualmente el thumb si se quiere más fino, o quitar si se quiere sólido */
		background-clip: content-box;
	}

	.scroller::-webkit-scrollbar-thumb:hover {
		background-color: rgba(156, 163, 175, 0.6); /* Un poco más oscuro al pasar el mouse */
	}

	/* Estilo para Firefox */
	.scroller {
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
	}
</style>
