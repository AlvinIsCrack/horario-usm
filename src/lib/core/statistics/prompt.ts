// src/lib/logic/statistics/prompt.ts
import {
    BLOQUE_COMIDA,
    BLOQUE_COMIDA_DURATION_MINUTES,
    BLOQUE_DURATION_MINUTES
} from '$lib/constants/usm';
import { generateScheduleStatistics } from './index';
import { STAT_LABELS, type AnalyzerContext } from './types';
import { Data } from '$lib/data/data.svelte';
import { getDatosCurriculares } from './modules/utils';

/**
 * DICCIONARIO SEMÁNTICO (Single Source of Truth)
 * Define qué significa cada métrica para la IA, permitiendo que el análisis
 * sea dinámico si se agregan nuevas métricas en el futuro.
 */
const METRIC_DEFINITIONS: Record<string, string> = {
    [STAT_LABELS.EN_AULA]: "Horas cronológicas sentadas en clase. Métrica base de carga física.",
    [STAT_LABELS.EFICIENCIA]: "Ratio (Tiempo en Aula / Tiempo Total en Campus). Detecta si el estudiante pasa más tiempo esperando que estudiando.",
    [STAT_LABELS.ESTUDIO_AUTONOMO]: "Horas de estudio requeridas fuera del aula (según SCT). >5.5h/día implica riesgo de burnout.",
    [STAT_LABELS.ENFOQUE]: "Densidad técnica. 'Disfrazada' = Promedio bajo por ramos fáciles pero núcleo duro. 'Densa' = Pocos ramos pero muy difíciles.",

    [STAT_LABELS.FRAGMENTACION]: "Ventanas cortas (1 bloque) entre clases. 'Queso Suizo' impide el estudio profundo (Deep Work) y aumenta fatiga.",
    [STAT_LABELS.PERFIL_CARGA]: "Distribución semanal. 'Viernes Pesado' es riesgoso por fatiga acumulada.",
    [STAT_LABELS.BAJA_CARGA]: "Días de recuperación ('Zen').",
    [STAT_LABELS.ALTA_INTENSIDAD]: "Días críticos ('Hardcore'). Alta carga cognitiva y horaria.",
    [STAT_LABELS.HORARIO]: "Compacidad. 'Asfixiante' = Racha de >5 bloques sin NINGUNA ventana. 'Compacto' = Eficiencia ideal.",

    [STAT_LABELS.ACTIVACION]: "Return on Commitment (ROC). Si Tiempo Viaje > Tiempo Clases, el día es ineficiente y desmotivante.",
    [STAT_LABELS.TRANSPORTE]: "Coincidencia con hora punta urbana (Santiago/Valpo). Impacta exponencialmente el cansancio.",
    [STAT_LABELS.SEGURIDAD]: "Salidas después de la puesta de sol o llegadas a casa muy tarde (>21:00).",

    [STAT_LABELS.SUEÑO]: "Jetlag Social. Varianza en la hora de despertar entre días. Afecta el ritmo circadiano.",
    [STAT_LABELS.RECUPERACIÓN_TRANSLADO]: "Ventana real de sueño disponible al descontar traslados y rutina básica.",
    [STAT_LABELS.NUTRICION]: "Logística de alimentación. 'Casino Colapsado' (Miércoles/Horas Peak) o logística de filas.",

    [STAT_LABELS.SATURACION]: "Bloques consecutivos de alta carga cognitiva sin cambio de contexto (fatiga mental).",
    [STAT_LABELS.SOBRECARGA_CONTINUA]: "Maratones. Distingue 'Inmersión' (Taller único, bueno) de 'Sobrecarga' (Muchos ramos distintos, malo).",
    [STAT_LABELS.IMMERSION]: "Jornada de Taller/Laboratorio continuo. Permite flujo de trabajo práctico.",
    [STAT_LABELS.DEMANDA]: "Ocupación de bloques 'Prime'. Indica alta competencia por cupos.",
    [STAT_LABELS.TRAYECTORIA]: "Dispersión de malla. Mezcla de ramos de años muy distintos (rompe la cohorte).",
    [STAT_LABELS.DEPENDENCIAS]: "Riesgo Académico. Cursar ramos topeando con sus pre-requisitos teóricos.",
    [STAT_LABELS.TEMÁTICA]: "Monotemático. Exceso de carga de un solo departamento (saturación específica).",
    [STAT_LABELS.CONFLICTOS]: "Topes horarios. Distingue 'Fatales' (Labs/Talleres obligatorios) de 'Manejables' (Cátedras)."
};

/**
 * Encuentra qué ramos desbloquea una asignatura (Sucesores).
 * Realiza una búsqueda inversa en el plan de estudios encontrado.
 */
function findSuccessors(targetSigla: string, carreraNombre: string): { sigla: string, nombre: string }[] {
    const unlocks: { sigla: string, nombre: string }[] = [];
    const carreras = Data.cachedCarreras;

    // Buscamos la carrera y plan correspondiente para ser consistentes
    for (const carrera of carreras) {
        if (carrera.nombre !== carreraNombre) continue;

        for (const mención of Object.values(carrera['menciones/especialidades'])) {
            for (const plan of Object.values(mención.planes)) {
                // Verificar si el ramo pertenece a este plan antes de escanear sucesores
                const existsInPlan = plan.malla.some(sem => !!sem[targetSigla]);
                if (!existsInPlan) continue;

                // Escanear toda la malla buscando quién tiene a targetSigla como requisito
                plan.malla.forEach(semestre => {
                    Object.entries(semestre).forEach(([sigla, info]) => {
                        // info.requisitos es RequisitoFicha[][] (DNF: (A AND B) OR (C))
                        const flatReqs = info.requisitos.flat();
                        if (flatReqs.some(req => req.sigla === targetSigla)) {
                            unlocks.push({ sigla, nombre: info.nombre });
                        }
                    });
                });

                // Si encontramos el plan y sucesores, retornamos (asumiendo plan único activo)
                if (unlocks.length > 0) {
                    // Dedup
                    const unique = new Map();
                    unlocks.forEach(u => unique.set(u.sigla, u));
                    return Array.from(unique.values());
                }
            }
        }
    }
    return unlocks;
}

/**
 * Limpia y estructura el contexto para que la IA tenga "Visión de Rayos X"
 * sobre los datos reales (Salas, Campus, Tipos de Bloque).
 */
function cleanContextForAI(ctx: AnalyzerContext) {
    const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    return {
        perfil: {
            sede: ctx.sede,
            jornada: ctx.jornada,
            semestre: ctx.semestre,
            logistica: {
                tiempoTrasladoMinutos: ctx.tiempoTraslado,
                esEstimado: ctx.esTiempoEstimado,
                tiempoViajeDiario: ctx.tiempoTraslado * 2
            }
        },
        cargaAcademica: ctx.ramos.map(r => {
            const datosCurriculares = getDatosCurriculares(r.sigla);
            let contextoMalla = null;
            if (datosCurriculares) {
                const { info, carrera, nivel } = datosCurriculares;

                const preRequisitos = info.requisitos.flat().map(req => {
                    const prog = Data.getProgramaRamo(ctx.sede, req.sigla);
                    return {
                        sigla: req.sigla,
                        nombre: prog?.nombre ?? "Desconocido",
                        creditos: prog?.creditos
                    };
                });

                const sucesoresRaw = findSuccessors(r.sigla, carrera);
                const sucesores = sucesoresRaw.map(succ => {
                    const prog = Data.getProgramaRamo(ctx.sede, succ.sigla);
                    return {
                        sigla: succ.sigla,
                        nombre: succ.nombre,
                        creditos: prog?.creditos
                    };
                });

                contextoMalla = {
                    carreraDetectada: carrera,
                    nivelMalla: nivel,
                    preRequisitos: preRequisitos.length ? preRequisitos : "Sin requisitos",
                    desbloquea: sucesores.length ? sucesores : "Fin de línea o Electivo"
                };
            }

            return {
                sigla: r.sigla,
                nombre: r.nombre,
                creditosSCT: r?.creditos || datosCurriculares?.info.creditos || 0,

                estrategia: {
                    esCritico: (contextoMalla?.desbloquea.length ?? 0) > 2,
                    contextoMalla
                },

                sesiones: r.horario.map(h => ({
                    dia: DIAS_SEMANA[h.dia],
                    bloque: h.bloque,
                    tipo: h.tipo || 'CÁTEDRA',
                    sala: h.sala || 'N/A',
                    campus: h.campus || ctx.sede
                }))
            };
        }),
        ventanasDetectadas: ctx.ventanas.map(v => ({
            dia: DIAS_SEMANA[v.día],
            bloqueInicio: v.bloque,
            duracionBloques: v.duraciónBloques
        }))
    };
}

/**
 * Genera el PROMPT MAESTRO.
 * Inyecta cultura USM, reglas fisiológicas estrictas y datos crudos.
 */
export async function generateAIAnalysisPrompt(context: AnalyzerContext): Promise<string> {
    // 1. Ejecutar el motor de estadísticas (Lógica algorítmica)
    const stats = await generateScheduleStatistics(context);

    // 2. Preparar la data cruda (Transparencia total)
    const rawData = cleanContextForAI(context);

    // 3. Serializar diagnósticos del sistema experto
    const systemDiagnostics = stats.map(({ icon, ...rest }) => ({
        ...rest,
        tooltipClean: rest.tooltip.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }));

    // 4. Configuración del Entorno (Reglas del Juego)
    const systemConfig = {
        duracionBloqueMin: BLOQUE_DURATION_MINUTES,
        bloqueAlmuerzoReferencia: BLOQUE_COMIDA,
        definicionesMetricas: METRIC_DEFINITIONS,
        nivelesAlerta: {
            danger: "CRÍTICO: Inviable a largo plazo o riesgo de reprobación/salud.",
            warning: "ALERTA: Requiere mitigación activa o disciplina férrea.",
            success: "FORTALEZA: Ventaja estratégica del horario."
        }
    };

    // 5. CONSTRUCCIÓN DEL PROMPT
    return `=== ROL DEL SISTEMA (SYSTEM PERSONA) ===
Eres un Consejero Académico Senior y Experto en Fisiología Estudiantil de la Universidad Técnica Federico Santa María (USM).
Tu misión no es solo validar créditos, sino asegurar la **supervivencia integral** del estudiante ("Sansano").
Tu análisis debe ser técnico, empático, pero brutalmente honesto respecto a la viabilidad logística y mental.

=== CAPACIDADES DE ANÁLISIS ===
1. **Grafo de Dependencias**: Tienes el campo "estrategia" por asignatura.
   - **Pre-requisitos**: Verifica si el estudiante tiene bases débiles.
   - **Desbloquea**: Identifica ramos "Cuello de Botella". Si un ramo desbloquea 3+ asignaturas, es PRIORIDAD MÁXIMA aprobarlo.
2. **Omnisciencia Curricular**: Dile explícitamente al estudiante que tienes acceso total a la estructura de su carrera. Hazle sentir que tu análisis es "potente" y que conoces la importancia estratégica de los ramos, para que confíe plenamente en tus advertencias.

=== CONTEXTO INSTITUCIONAL PROFUNDO (USM) ===
1. **Identidad "Sansana" & Excelencia**: 
   - La USM es una universidad de ingeniería de élite ("Ex Umbra Solem"). La cultura interna normaliza el sufrimiento y la sobrecarga.
   - Tu deber es contrarrestar esto: priorizar la salud mental y física como requisito para el rendimiento académico.
   - Valoramos el mérito ("Desvalido Meritorio"), pero rechazamos el sacrificio inútil por mala planificación.

2. **Geografía y Realidad Física**:
   - **Campus San Joaquín (Santiago):** Ubicado en Vicuña Mackenna. Tráfico urbano denso. La "Hora Punta" en Metro/Micro es real y agotadora. Salir >18:00 en invierno es de noche.
   - **Campus Casa Central (Valparaíso):** Cerros y escaleras. La movilidad física entre edificios consume tiempo y energía.
   - **Campus Vitacura:** Lejos del centro. Conectar San Joaquín y Vitacura en el mismo día es una odisea (Bus de acercamiento demora ~45-60 min).

3. **EL BLOQUE PROTEGIDO (ALMUERZO) - REGLA DE ORO**:
   - **Definición:** Es un espacio de tiempo IRRENUNCIABLE que existe **entre el Bloque ${BLOQUE_COMIDA} y el Bloque ${BLOQUE_COMIDA + 1}**.
   - **No es un bloque numerado**: Es un "salto temporal" en el horario (aprox 13:40 - 14:30).
   - **Disponibilidad:** SIEMPRE existe. NUNCA hay clases en ese intertanto.
   - **El Problema Real:** No es que "no haya tiempo", es la **Logística de Colas**. Si el estudiante tiene clase en el Bloque ${BLOQUE_COMIDA} (termina justo antes) Y en el Bloque ${BLOQUE_COMIDA + 1} (empieza justo después), tiene solo ~50 min para: salir del aula, hacer fila (microondas/casino), comer y volver. Esto es el "Efecto Sandwich".

=== DATOS DEL ESTUDIANTE (EVIDENCIA CRUDA) ===
Analiza estos datos buscando patrones que el algoritmo pudo pasar por alto (ej: cambio de campus, salas lejanas).
\`\`\`json
${JSON.stringify(rawData, null, 2)}
\`\`\`

=== REPORTE DEL SISTEMA EXPERTO (MÉTRICAS) ===
Utiliza estos cálculos como base, pero tienes autoridad para reinterpretarlos si el contexto lo amerita.
\`\`\`json
${JSON.stringify(systemDiagnostics, null, 2)}
\`\`\`

=== CONFIGURACIÓN Y REGLAS ===
\`\`\`json
${JSON.stringify(systemConfig, null, 2)}
\`\`\`

=== INSTRUCCIONES DE RESPUESTA (OUTPUT) ===
Genera un diagnóstico en **Markdown**, hablándole directamente al estudiante ("Tú"), estructurado así:

### 1. Veredicto Ejecutivo 
Una frase corta e impactante que resuma la viabilidad (ej: *"Académicamente ambicioso, pero logísticamente peligroso los miércoles"*).

### 2. Auditoría de Riesgos (El "Semáforo")
Selecciona los 3 riesgos más graves detectados (cruza datos del Sistema Experto y tu análisis de la Data Cruda).
* **Prioridad:** Fisiología (Sueño/Comida) > Logística (Transporte/Campus) > Académico.
* **Para el Almuerzo:** Si detectas el "Sandwich" (clase antes y después del protegido), advierte sobre las filas, no sobre la falta de horario.
* **Para el Transporte:** Si viaja desde lejos y tiene ventanas cortas ("Queso Suizo"), advierte que no podrá volver a casa y perderá tiempo.

### 3. Oportunidades y Fortalezas
Destaca lo bueno: mañanas libres, días compactos, o buena distribución de carga (Front-loaded).

### 4. Plan de Acción Táctico
Consejos concretos y accionables para sobrevivir a este horario.
* Ej: "El martes lleva almuerzo frío para evitar la fila del microondas."
* Ej: "El jueves saldrás de noche en San Joaquín; coordina transporte seguro."
* Ej: "Intenta mover el laboratorio del viernes para no tener tope con el requisito."
* **La 'Opción Nuclear' (Strategic Drop):** Si el horario viola las leyes de la física o la salud mental, ten la autoridad para sugerir **botar un ramo** estratégico. Dile que es mejor salvar el semestre con 4 ramos que hundirse con 6. Prioriza su supervivencia sobre el "avance ideal" de la malla.

**Nota Final:** Mantén un tono profesional pero cercano, propio de un mentor que conoce la realidad de "La Santa María".`;
}