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

	// --- Estilos ---
	const diffs = tv({
		slots: {
			container: 'mx-auto flex w-full max-w-[800px] flex-col gap-4 font-sans pb-10',
			grupoWrapper: 'flex flex-col gap-1',
			header:
				'flex items-baseline gap-2 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground',
			// Cards
			card: 'group flex items-center gap-3 border-b border-border/40 bg-background px-3 py-1.5 transition-colors hover:bg-accent/30',
			cardStructural: 'mx-1 rounded-md border border-dashed px-2 py-1 text-xs font-medium',

			// Elementos internos
			indicador: 'h-2 w-2 rounded-full shrink-0',
			content: 'flex min-w-0 flex-1 flex-col gap-0.5', // Stack vertical para nombre y alertas
			filaPrincipal: 'flex items-baseline gap-2 overflow-hidden whitespace-nowrap',

			sigla: 'font-mono text-xs font-black tracking-tight text-foreground/80',
			nombre: 'truncate text-xs text-foreground/70',

			badgesRow: 'flex flex-wrap gap-1',
			alertaTexto: 'truncate text-[10px] text-muted-foreground/80 font-mono',

			stats: 'ml-auto flex shrink-0 items-center gap-2 text-xs'
		},
		variants: {
			status: {
				pos: { indicador: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' },
				neg: { indicador: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]' },
				warn: { indicador: 'bg-amber-500' },
				neu: { indicador: 'bg-blue-500' }
			},
			structType: {
				ALERTA: { cardStructural: 'border-rose-500/50 bg-rose-500/10 text-rose-600' },
				INFO: { cardStructural: 'border-blue-500/50 bg-blue-500/10 text-blue-600' }
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
</script>

<section class={s.container()}>
	<div class="-mb-2 px-1">
		<h1 class="text-foreground/80 text-sm font-semibold">Historial de Cambios</h1>
	</div>

	{#each historial as grupo (grupo.timestamp)}
		<div class={s.grupoWrapper()}>
			<header class={s.header()}>
				<Tooltip content="{grupo.fecha} a las {grupo.hora}">
					<span class="cursor-help decoration-dotted hover:underline">{grupo.relativo}</span>
				</Tooltip>
				<div class="bg-border/40 ml-2 h-px flex-1"></div>
				<span class="ml-2 opacity-60">{grupo.items.length} eventos</span>
			</header>

			<div class="border-border/30 ml-2 flex flex-col border-l-2 pl-0">
				{#each grupo.items as item}
					{#if 'esEstructural' in item}
						<div class={s.cardStructural({ structType: item.tipo })}>
							{item.mensaje}
						</div>
					{:else}
						{@const status = getStatus(item)}
						<div class={s.card()}>
							<div class={s.indicador({ status })}></div>

							<div class={s.content()}>
								<div class={s.filaPrincipal()}>
									<span class={s.sigla()}>{item.sigla}</span>
									<span class={s.nombre()}>{item.nombre}</span>
								</div>

								<div class={s.badgesRow()}>
									{#each Array.from(item.tipos) as t}
										<Badge variant="outline" class="h-3.5 px-1 text-[9px] font-bold">
											{t}
										</Badge>
									{/each}

									{#if item.alertas.length > 0}
										<span class={s.alertaTexto()}>
											{item.alertas[0]}
											{#if item.alertas.length > 1}
												<span class="opacity-50">+{item.alertas.length - 1}</span>
											{/if}
										</span>
									{/if}
								</div>
							</div>

							<div class={s.stats()}>
								{#if item.cupoDelta !== 0}
									<div class="flex flex-col items-end leading-none">
										<span
											class="font-bold {item.cupoDelta > 0 ? 'text-emerald-500' : 'text-rose-500'}"
										>
											{item.cupoDelta > 0 ? '+' : ''}{item.cupoDelta}
										</span>
										<span class="text-muted-foreground text-[9px] uppercase">Cupos</span>
									</div>
								{/if}
								{#if item.cupoAperturas > 0}
									<Badge
										class="border-emerald-500/20 bg-emerald-500/15 text-[9px] text-emerald-600 hover:bg-emerald-500/25"
									>
										OPEN
									</Badge>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</section>
