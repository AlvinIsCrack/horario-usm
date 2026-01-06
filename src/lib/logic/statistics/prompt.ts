// src/lib/logic/statistics/prompt.ts
import { BLOQUE_COMIDA, BLOQUE_COMIDA_DURATION_MINUTES, BLOQUE_DURATION_MINUTES } from '$lib/constants/usm';
import { generateScheduleStatistics } from './index';
import type { AnalyzerContext } from './types';

/**
 * Genera un prompt estructurado para ser consumido por una IA (ChatGPT, Claude, etc).
 * Incluye el contexto del estudiante, las métricas calculadas y la data dura del horario.
 */
export async function generateAIAnalysisPrompt(context: AnalyzerContext): Promise<string> {
    // 1. Obtenemos las estadísticas usando la fachada existente
    const stats = await generateScheduleStatistics(context);

    // 2. Formateamos las métricas a texto limpio (Markdown friendly)
    const metricsText = stats
        .map((s) => {
            // Limpieza de HTML para texto plano
            const cleanTooltip = s.tooltip
                .replace(/<br\s*\/?>/gi, ' ') // <br> a espacio
                .replace(/<[^>]*>/g, '') // Eliminar tags HTML
                .replace(/\s+/g, ' ') // Normalizar espacios múltiples
                .trim();

            const statusEmoji =
                {
                    danger: '🔴',
                    warning: '🟡',
                    success: '🟢',
                    null: '⚪'
                }[s.status || 'null'] || '⚪';

            return `* ${statusEmoji} **${s.label}**: ${s.value} -> (${cleanTooltip})`;
        })
        .join('\n');

    // 3. Formateamos la data dura del horario (JSON Simplificado para ahorrar tokens)
    // Mapeamos solo lo esencial: Sigla, Nombre y Bloques
    const scheduleData = context.ramos.map((r) => ({
        sigla: r.sigla,
        nombre: r.nombre,
        horario: r.horario.map((h) => {
            const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            return `${dias[h.dia]} Bloque ${h.bloque}`;
        })
    }));

    // 4. Construcción del Prompt Final
    const { sede, jornada, tiempoTraslado, esTiempoEstimado } = context;

    return `
**Contexto Institucional y Académico: Universidad Técnica Federico Santa María (Chile)**
* Perfil de la Universidad: La USM es una de las instituciones más prestigiosas y exigentes de Chile, especializada en ingeniería, ciencia y arquitectura. Es conocida por su altísimo rigor académico y una cultura de esfuerzo extremo (sus estudiantes se autodenominan "Sansanos").
* Sistema de Créditos (SCT - Sistema de Créditos Transferibles): * Equivalencia: 1 crédito SCT representa exactamente 27 horas de trabajo cronológico de un estudiante promedio por semestre.
* Carga Semanal: Para un semestre estándar de 17 semanas de clases, la dedicación semanal total se calcula como: (SCT Total * 27) / 17.
* Estudio Autónomo: El tiempo de estudio fuera del aula se define restando las horas de clase presenciales del total de dedicación semanal. Una métrica de >5.5 horas de estudio autónomo diario (de lunes a sábado) se considera zona de riesgo de agotamiento (Burnout).

**Estructura Horaria (Bloques):**
* La jornada se divide en bloques de ${BLOQUE_DURATION_MINUTES} minutos de clase activa.
* El primer bloque empieza a las 8:15.
* Bloque Protegido (Almuerzo): Después del bloque ${BLOQUE_COMIDA} (de duración ${BLOQUE_COMIDA_DURATION_MINUTES}, usualmente desde las 13:40). Es un bloque fantasma (en los horarios hay un "salto", que corresponde al bloque protegido), que está designados por reglamento como "bloque protegido". Está destinado al almuerzo principalmente, asambleas estudiantiles o actividades de bienestar.
* El almuerzo -en el casino- suele habilitarse desde las 12:30, hasta las 3:30 PM generalmente en cada sede, aunque claro que los almacenes o kioscos internos de las universidades suelen abrir más temprano, para que sepas como contexto respecto a la posibilidad de alimentación.
* Logística de Almuerzo: Se considera una logística "Ajustada" si el estudiante solo tiene 1 bloque libre (50 min), lo que se traduce en apenas 20 min efectivos para comer tras considerar desplazamientos y filas en el casino.

**Topología y "Forma" del Horario:**
* Costo de Activación (ROC - Return on Commitment): Se mide la eficiencia del traslado. Un "ROC Negativo" ocurre cuando el tiempo de viaje (ida y vuelta) supera el tiempo total de clases presenciales en un día. Es una métrica crítica de deserción o inasistencia.
* Fragmentación (Queso Suizo): Se identifica cuando existen ventanas de un solo bloque entre clases. Estos huecos suelen ser "tiempo muerto" ineficiente para el estudio profundo (Deep Work).
* Jetlag Social (Estabilidad del Sueño): Se analiza la varianza entre la hora de entrada más temprana y la más tardía. Una diferencia de más de 3 horas genera un desajuste en el ritmo circadiano similar a cruzar varios husos horarios cada semana.

**Heurísticas de Carga Cognitiva:**
* Peso de Asignatura: No todos los ramos son iguales. Existen ramos "ladrillo" (alta densidad técnica y baja tasa de aprobación) con multiplicadores de peso >1.4.
* Inmersión vs. Maratón: * Una racha de +5 bloques del mismo ramo se considera "Inmersión" (típico de Talleres de Arquitectura o Laboratorios), donde el ritmo es práctico y permite pausas.
* Una racha de +5 bloques de ramos distintos se considera "Maratón de Sobrecarga", lo cual es fisiológicamente insostenible por el constante cambio de contexto (Context Switching).
* Saturación Temática: Tener 3 o más bloques seguidos de ramos del mismo departamento técnico genera fatiga cognitiva específica en un área del cerebro.

**Geografía y Seguridad:**
* Las sedes (Casa Central Valparaíso, San Joaquín, Vitacura, Concepción) están en zonas donde la Seguridad Invernal es factor: salir de clases después de las 18:40 (oscuridad) o llegar a casa después de las 21:00 supone un riesgo de seguridad y un desgaste físico adicional.
    
**Contexto del Estudiante:**
* Sede: ${sede || 'No especificada'}
* Jornada: ${jornada || 'No especificada'}
* Tiempo Traslado: ${tiempoTraslado} min ${esTiempoEstimado ? '(Estimado)' : ''}

**Diagnóstico del Sistema (Métricas calculadas):**
${metricsText}

**Detalle del Horario (Data):**
\`\`\`json
${JSON.stringify(scheduleData, null, 2)}
\`\`\`

**Instrucción para la IA:**
Actúa como un consejero académico experto de la universidad. Basándote en las métricas calculadas y la distribución del horario adjunto:
* Evalúa la viabilidad de esta carga académica.
* Identifica riesgos ocultos de salud mental o rendimiento (ej. fatiga acumulada, falta de almuerzo).

Utiliza todo el detalle técnico anterior para analizar la data JSON adjunta. No te limites a decir "tienes muchas clases"; analiza si el Costo de Activación del día miércoles justifica el viaje, o si el Jetlag Social del viernes (entrando 4 bloques más tarde que el lunes) destruirá el hábito de sueño del estudiante. Prioriza la salud mental y la viabilidad logística sobre el simple cumplimiento de créditos.`;
}