// ==========================================
// 1. DIMENSIONES (Métricas) - Se mantiene igual
// ==========================================
export const EVALUATION_DIMENSIONS = {
    didactica: {
        id: 'didactica',
        label: 'Metodología',
        sub_dimensions: {
            claridad: {
                id: 'claridad_expositiva',
                label: 'Claridad',
                description: 'Eficacia en la transmisión y simplificación de conceptos.',
                type: 'BARS',
                levels: {
                    1: { label: 'Confuso', description: 'Explicaciones desordenadas o ininteligibles.' },
                    2: { label: 'Denso', description: 'Dificultad para simplificar contenidos complejos.' },
                    3: { label: 'Adecuado', description: 'Transmisión clara de la materia estándar.' },
                    4: { label: 'Eficaz', description: 'Facilita el aprendizaje con recursos y orden.' },
                    5: { label: 'Magistral', description: 'Claridad absoluta y dominio del ritmo didáctico.' }
                }
            },
            puntualidad: {
                id: 'gestion_tiempo',
                label: 'Puntualidad',
                description: 'Cumplimiento de los horarios de inicio y término.',
                type: 'BARS',
                levels: {
                    1: { label: 'Impuntual', description: 'Retrasos recurrentes o inasistencias sin aviso.' },
                    2: { label: 'Inconsistente', description: 'Puntualidad variable.' },
                    3: { label: 'Correcto', description: 'Suele iniciar y terminar en la hora establecida.' },
                    4: { label: 'Riguroso', description: 'Respeto estricto por el cronograma de cátedra.' },
                    5: { label: 'Exacto', description: 'Puntualidad milimétrica en cada sesión.' }
                }
            }
        }
    },
    exigencia: {
        id: 'exigencia',
        label: 'Exigencia',
        sub_dimensions: {
            rigor: {
                id: 'rigor_calificatorio',
                label: 'Rigor',
                description: 'Severidad en la evaluación y rigor en la corrección.',
                type: 'BARS',
                levels: {
                    1: { label: 'Benevolente', description: 'Criterios de corrección extremadamente flexibles.' },
                    2: { label: 'Laxo', description: 'Tiende a favorecer al estudiante en la revisión.' },
                    3: { label: 'Objetivo', description: 'Se ciñe estrictamente a la pauta de corrección.' },
                    4: { label: 'Severo', description: 'Nivel de detalle y exigencia elevado.' },
                    5: { label: 'Punitivo', description: 'Exigencia extrema, margen nulo de error.' }
                }
            },
            coherencia: {
                id: 'coherencia_evaluativa',
                label: 'Coherencia',
                description: 'Relación entre los contenidos dictados y las evaluaciones.',
                type: 'BARS',
                levels: {
                    1: { label: 'Desconectado', description: 'Evalúa temas no tratados en las sesiones.' },
                    2: { label: 'Olimpiada', description: 'Dificultad muy superior a lo ejercitado en clase.' },
                    3: { label: 'Equilibrado', description: 'Evaluación coherente con la instrucción entregada.' },
                    4: { label: 'Alineado', description: 'Evaluaciones predecibles según lo visto en cátedra.' },
                    5: { label: 'Trivial', description: 'Nivel de evaluación inferior al estándar académico.' }
                }
            },
            dificultad: {
                id: 'dificultad_percibida',
                label: 'Dificultad',
                description: 'Complejidad intrínseca de la asignatura bajo su tutela.',
                type: 'BARS',
                levels: {
                    1: { label: 'Trivial', description: 'Contenidos de fácil asimilación.' },
                    2: { label: 'Accesible', description: 'Carga académica ligera.' },
                    3: { label: 'Moderada', description: 'Requiere estudio constante y dedicación.' },
                    4: { label: 'Desafiante', description: 'Complejidad elevada, alta carga de trabajo.' },
                    5: { label: 'Extrema', description: 'Asignatura con alta tasa de reprobación histórica.' }
                }
            }
        }
    },
    temperamento: {
        id: 'temperamento',
        label: 'Temperamento',
        sub_dimensions: {
            estabilidad: {
                id: 'estabilidad_emocional',
                label: 'Estabilidad',
                description: 'Manejo de la dinámica y ambiente de aula.',
                type: 'BARS',
                levels: {
                    1: { label: 'Volátil', description: 'Reacciones hostiles o erráticas ante el curso.' },
                    2: { label: 'Irritable', description: 'Baja tolerancia a dudas o interrupciones.' },
                    3: { label: 'Profesional', description: 'Trato correcto, neutro y formal.' },
                    4: { label: 'Afable', description: 'Mantiene un clima ameno y de respeto mutuo.' },
                    5: { label: 'Estoico', description: 'Dominio total del ambiente y seguridad absoluta.' }
                }
            },
            accesibilidad: {
                id: 'accesibilidad',
                label: 'Disposición',
                description: 'Calidad del apoyo y contacto fuera del horario de clases.',
                type: 'BARS',
                levels: {
                    1: { label: 'Inubicable', description: 'No responde correos ni consultas digitales.' },
                    2: { label: 'Burocrático', description: 'Respuesta lenta, deriva a ayudantes o syllabus.' },
                    3: { label: 'Disponible', description: 'Responde dudas con tiempos razonables.' },
                    4: { label: 'Accesible', description: 'Responde dudas con prontitud y buena disposición.' },
                    5: { label: 'Mentor', description: 'Preocupación activa por el progreso del alumno.' }
                }
            }
        }
    }
} as const;

// ==========================================
// 2. FOLKSONOMÍA (TAGS) - Versión Refinada
// ==========================================

export type TagCategory = 'ESTILO' | 'EVALUACION' | 'PERSONALIDAD' | 'MATERIAL' | 'ADVERTENCIA' | 'TRAYECTORIA' | 'LOGISTICA';
export type TagSentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'ALERT';

export interface TagDefinition {
    id: string;
    label: string;
    description: string;
    category: TagCategory;
    sentiment: TagSentiment;
}

export const USM_TAGS = {
    // --- ESTILO DE ENSEÑANZA (Cualitativo) ---
    PIZARRON_LOVER: { id: 'PIZARRON_LOVER', label: '100% Pizarra', description: 'Desarrolla toda la clase en pizarra. Ideal para tomar apuntes.', category: 'ESTILO', sentiment: 'NEUTRAL' },
    PPT_READER: { id: 'PPT_READER', label: 'Lee Diapos', description: 'Se limita a leer literalmente el material visual.', category: 'ESTILO', sentiment: 'NEGATIVE' },
    DISCUSION_SOCRATICA: { id: 'DISCUSION_SOCRATICA', label: 'Participativo', description: 'Basa la clase en preguntas constantes a los alumnos.', category: 'ESTILO', sentiment: 'NEUTRAL' },
    APRENDIZAJE_ACTIVO: { id: 'APRENDIZAJE_ACTIVO', label: 'Clase Práctica', description: 'Enfoque en resolución de ejercicios durante la cátedra.', category: 'ESTILO', sentiment: 'POSITIVE' },
    TEORICO_PURO: { id: 'TEORICO_PURO', label: 'Teórico', description: 'Enfocado en demostraciones, axiomas y fundamentos abstractos.', category: 'ESTILO', sentiment: 'NEUTRAL' },
    CASOS_REALES: { id: 'CASOS_REALES', label: 'Casos Reales', description: 'Utiliza ejemplos de la industria o actualidad para explicar.', category: 'ESTILO', sentiment: 'POSITIVE' },

    // --- PERSONALIDAD & AMBIENTE ---
    INSPIRADOR: { id: 'INSPIRADOR', label: 'Motivador', description: 'Transmite pasión genuina que motiva a estudiar.', category: 'PERSONALIDAD', sentiment: 'POSITIVE' },
    SARCASTICO: { id: 'SARCASTICO', label: 'Sarcástico', description: 'Uso frecuente de humor ácido o ironía.', category: 'PERSONALIDAD', sentiment: 'NEGATIVE' },
    ANECDOTICO: { id: 'ANECDOTICO', label: 'Anecdótico', description: 'Clases ricas en historias y experiencias personales.', category: 'PERSONALIDAD', sentiment: 'NEUTRAL' },
    CERCANO: { id: 'CERCANO', label: 'Horizontal', description: 'Trato de igual a igual, elimina la barrera jerárquica.', category: 'PERSONALIDAD', sentiment: 'POSITIVE' },
    INTIMIDANTE: { id: 'INTIMIDANTE', label: 'Intimidante', description: 'Genera tensión o miedo a preguntar en clase.', category: 'PERSONALIDAD', sentiment: 'NEGATIVE' },

    // --- EVALUACIÓN & FEEDBACK ---
    // Eliminados: FILTRO (Cubierto por Dificultad:5), BENEVOLENTE (Cubierto por Rigor:1)
    OPORTUNIDADES: { id: 'OPORTUNIDADES', label: 'Recuperativas', description: 'Ofrece instancias extra oficiales para mejorar notas.', category: 'EVALUACION', sentiment: 'POSITIVE' },
    BONUS_DECIMAS: { id: 'BONUS_DECIMAS', label: 'Regala Décimas', description: 'Otorga puntos base por participación o tareas menores.', category: 'EVALUACION', sentiment: 'POSITIVE' },
    AMBIGUO: { id: 'AMBIGUO', label: 'Pauta Confusa', description: 'Criterios de corrección subjetivos o poco claros.', category: 'EVALUACION', sentiment: 'NEGATIVE' },
    CONTROLES_SORPRESA: { id: 'CONTROLES_SORPRESA', label: 'Sorpresas', description: 'Realiza evaluaciones sin aviso previo.', category: 'EVALUACION', sentiment: 'ALERT' },
    FEEDBACK_DETALLADO: { id: 'FEEDBACK_DETALLADO', label: 'Buen Feedback', description: 'Entrega correcciones detalladas y formativas en las pruebas.', category: 'EVALUACION', sentiment: 'POSITIVE' },

    // --- MATERIAL & RECURSOS ---
    APUNTES_PROPIOS: { id: 'APUNTES_PROPIOS', label: 'Material Propio', description: 'Entrega guías o libros de su autoría de alta calidad.', category: 'MATERIAL', sentiment: 'POSITIVE' },
    RECURSOS_INGLES: { id: 'RECURSOS_INGLES', label: 'Material en Inglés', description: 'Bibliografía o diapositivas predominantemente en inglés.', category: 'MATERIAL', sentiment: 'ALERT' },
    CLASES_GRABADAS: { id: 'CLASES_GRABADAS', label: 'Videos', description: 'Disponibiliza grabaciones de las clases.', category: 'MATERIAL', sentiment: 'POSITIVE' },
    SIN_MATERIAL: { id: 'SIN_MATERIAL', label: 'Sin Apuntes', description: 'No sube material de apoyo; depende 100% de lo copiado en clase.', category: 'MATERIAL', sentiment: 'NEGATIVE' },

    // --- TRAYECTORIA ---
    EXPERTO_INDUSTRIA: { id: 'EXPERTO_INDUSTRIA', label: 'Industrial', description: 'Amplia experiencia práctica en el sector privado.', category: 'TRAYECTORIA', sentiment: 'POSITIVE' },
    INVESTIGADOR: { id: 'INVESTIGADOR', label: 'Científico', description: 'Enfoque académico centrado en la investigación y papers.', category: 'TRAYECTORIA', sentiment: 'NEUTRAL' },
    MENTOR: { id: 'MENTOR', label: 'Mentor', description: 'Ofrece orientación valiosa sobre desarrollo de carrera.', category: 'TRAYECTORIA', sentiment: 'POSITIVE' },

    // --- LOGÍSTICA & GESTIÓN ---
    // Eliminado: PUNTUALIDAD_SUIZA (Cubierto por Puntualidad:5)
    ASISTENCIA_LIBRE: { id: 'ASISTENCIA_LIBRE', label: 'Asistencia Libre', description: 'No controla asistencia o no es requisito para aprobar.', category: 'LOGISTICA', sentiment: 'POSITIVE' },
    ASISTENCIA_ESTRICTA: { id: 'ASISTENCIA_ESTRICTA', label: 'Asistencia Forzosa', description: 'Control riguroso y mandatorio de la asistencia.', category: 'LOGISTICA', sentiment: 'ALERT' },
    CORRECCION_RAPIDA: { id: 'CORRECCION_RAPIDA', label: 'Corrección Flash', description: 'Entrega notas en tiempos muy breves.', category: 'LOGISTICA', sentiment: 'POSITIVE' },
    CORRECCION_LENTA: { id: 'CORRECCION_LENTA', label: 'Corrección Lenta', description: 'Demora excesiva (meses) en entregar notas.', category: 'LOGISTICA', sentiment: 'NEGATIVE' },
    CAMBIOS_HORARIO: { id: 'CAMBIOS_HORARIO', label: 'Reprograma', description: 'Frecuente cambio de horarios o suspensiones de clase.', category: 'LOGISTICA', sentiment: 'NEGATIVE' }
} as const;

export type TagId = keyof typeof USM_TAGS;

// ==========================================
// 3. ESTRUCTURA DE DATOS 
// ==========================================

export interface Distribution {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
}

export interface MetricStats {
    avg: number;       // Promedio ponderado
    stdev: number;     // Desviación estándar
    safe_score: number; // Límite inferior Wilson (para ranking)
    distribution: Distribution; // Histograma crudo
}

export interface ProfessorMeta {
    reviewCount: number;
    effectiveCount: number; // N ponderado por tiempo
    lastUpdated: string;
    isArchived?: boolean;
}

export interface ProfessorView {
    id: string;
    name: string;
    email: string;
    // Ahora las stats son objetos complejos, no solo números
    stats: Record<string, MetricStats | null>;
    tags: TagId[]; // Tags ordenados por relevancia
    meta: ProfessorMeta;
}

export interface ProfessorRegistry {
    [id: string]: ProfessorView;
}

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

export function getBarsDescription(
    dimension: keyof typeof EVALUATION_DIMENSIONS,
    subDim: string,
    level: number
): string {
    // @ts-ignore
    const target = EVALUATION_DIMENSIONS[dimension]?.sub_dimensions[subDim];
    if (target && target.type === 'BARS' && target.levels[level]) {
        return target.levels[level].description;
    }
    return '';
}

export const TAG_CATEGORY_DESCRIPTIONS: Record<TagCategory, string> = {
    ESTILO: 'Metodología de enseñanza y didáctica empleada durante las sesiones de cátedra.',
    EVALUACION: 'Criterios de calificación, niveles de exigencia y características de los instrumentos de evaluación.',
    PERSONALIDAD: 'Rasgos de comportamiento, actitud y clima generado por el docente en el entorno de aprendizaje.',
    MATERIAL: 'Calidad, soporte y disponibilidad de los recursos pedagógicos entregados.',
    ADVERTENCIA: 'Factores críticos o consideraciones especiales que requieren atención por parte del estudiante.',
    TRAYECTORIA: 'Antecedentes profesionales, experiencia en la industria y perfil académico del docente.',
    LOGISTICA: 'Gestión administrativa del curso, cumplimiento de horarios y eficacia en la comunicación institucional.'
} as const;

export const TAGS_ORDER_SENTIMENT: Record<TagSentiment, number> = {
    POSITIVE: 0,
    ALERT: 1,
    NEGATIVE: 2,
    NEUTRAL: 3
} as const;