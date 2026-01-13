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
                description: 'Mide la capacidad de síntesis y la elocuencia del docente. Se enfoca en qué tan bien logra aterrizar conceptos abstractos y si el flujo de la clase permite tomar apuntes coherentes sin lagunas de información.',
                type: 'BARS',
                levels: {
                    1: { label: 'Confuso', description: 'Explicaciones desordenadas que dificultan el seguimiento de la clase.' },
                    2: { label: 'Denso', description: 'Contenidos explicados de forma compleja o poco cercana.' },
                    3: { label: 'Adecuado', description: 'Transmisión correcta de los contenidos del curso.' },
                    4: { label: 'Eficaz', description: 'Facilita más la comprensión con explicaciones bien estructuradas.' },
                    5: { label: 'Impecable', description: 'Explicaciones excepcionales que hacen simple incluso lo más difícil.' }
                }
            },
            puntualidad: {
                id: 'gestion_tiempo',
                label: 'Puntualidad',
                description: 'Evalúa el respeto por el tiempo del bloque horario. Considera tanto la hora de llegada como la de salida, y si el profesor utiliza el tiempo de clase de manera eficiente o si suele extenderse más allá del timbre.',
                type: 'BARS',
                levels: {
                    1: { label: 'Impuntual', description: 'Retrasos constantes o inasistencias sin previo aviso.' },
                    2: { label: 'Irregular', description: 'La puntualidad es variable y difícil de predecir.' },
                    3: { label: 'Cumplidor', description: 'Suele iniciar y terminar sus clases a la hora acordada.' },
                    4: { label: 'Confiable', description: 'Mantiene un respeto constante por el tiempo de los alumnos.' },
                    5: { label: 'Ejemplar', description: 'Puntualidad perfecta; aprovecha el tiempo de inicio a fin.' }
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
                description: 'Se refiere exclusivamente a la vara de medición en las evaluaciones. No mide lo difícil del examen, sino qué tan estricta es la corrección (ej: si descuenta mucho por errores de forma, redacción o unidades en un resultado correcto).', type: 'BARS',
                levels: {
                    1: { label: 'Barco', description: 'Criterios de evaluación muy flexibles y permisivos.' },
                    2: { label: 'Flexible', description: 'Tiende a priorizar el avance del alumno sobre el detalle.' },
                    3: { label: 'Estándar', description: 'Corrección equilibrada basada estrictamente en la pauta.' },
                    4: { label: 'Exigente', description: 'Nivel de detalle elevado; requiere precisión en las respuestas.' },
                    5: { label: 'Extremo', description: 'Margen de error nulo; evaluación inflexible y meticulosa.' }
                }
            },
            coherencia: {
                id: 'coherencia_evaluativa',
                label: 'Coherencia',
                description: 'Mide la "honestidad" del examen respecto a la cátedra. Evalúa si los problemas de las evaluaciones siguen la línea de los ejemplos vistos en pizarra o si, por el contrario, el profesor sorprende con ejercicios de una naturaleza distinta.',
                type: 'BARS',
                levels: {
                    1: { label: 'Incoherente', description: 'Evalúa temas que no se trataron o que se vieron superficialmente.' },
                    2: { label: 'Desfasado', description: 'La dificultad de las pruebas es muy superior a lo ejercitado en clase.' },
                    3: { label: 'Equilibrado', description: 'Evaluaciones acordes a la materia y ejemplos vistos en cátedra.' },
                    4: { label: 'Alineado', description: 'Existe una conexión clara y directa entre la clase y la evaluación.' },
                    5: { label: 'Predecible', description: 'Las evaluaciones no presentan sorpresas; se ciñen a lo estrictamente visto, y pueden llegar a ser más fáciles gracias al profesor.' }
                }
            },
            dificultad: {
                id: 'dificultad_percibida',
                label: 'Dificultad',
                description: 'Mide la carga total que impone el profesor. Incluye la complejidad de las tareas, la profundidad de los temas abordados y cuántas horas semanales extra demanda el curso para no quedar "atrás" respecto a su ritmo.',
                type: 'BARS',
                levels: {
                    1: { label: 'Simplificador', description: 'Reduce la complejidad del ramo al mínimo esfuerzo necesario.' },
                    2: { label: 'Abordable', description: 'Maneja una carga razonable que permite llevar el ramo al día.' },
                    3: { label: 'Estándar', description: 'Exige la dedicación justa que el programa del ramo requiere.' },
                    4: { label: 'Intenso', description: 'Eleva la carga de trabajo; sus explicaciones o tareas exigen un plus de tiempo.' },
                    5: { label: 'Abrumador', description: 'Su enfoque hace que el ramo sea extremadamente difícil de superar.' }
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
                description: 'Evalúa el "clima" que el docente proyecta en el aula. Mide su manejo de grupo y su temple emocional ante situaciones de estrés, interrupciones, dudas o desacuerdos, impactando directamente en la comodidad del alumno para participar.',
                type: 'BARS',
                levels: {
                    1: { label: 'Hostil', description: 'Reacciones agresivas o erráticas que generan tensión en el curso.' },
                    2: { label: 'Intolerante', description: 'Baja paciencia ante dudas, errores o interrupciones.' },
                    3: { label: 'Neutral', description: 'Mantiene un trato formal, serio y estrictamente profesional.' },
                    4: { label: 'Cercano', description: 'Fomenta un clima ameno, respetuoso y abierto al diálogo.' },
                    5: { label: 'Seguro', description: 'Transmite confianza y dominio absoluto de la dinámica del grupo.' }
                }
            },
            accesibilidad: {
                id: 'accesibilidad',
                label: 'Disposición',
                description: 'Evalúa la facilidad de contacto y la voluntad de ayuda fuera de la cátedra. Considera la rapidez en responder correos, la disponibilidad en horarios de consulta y la apertura para revisar casos particulares o dudas de materia.',
                type: 'BARS',
                levels: {
                    1: { label: 'Inubicable', description: 'No responde correos ni atiende consultas fuera de la clase.' },
                    2: { label: 'Distante', description: 'Respuesta muy lenta; suele derivar a ayudantes o al programa del curso.' },
                    3: { label: 'Disponible', description: 'Responde consultas en tiempos razonables y de forma correcta.' },
                    4: { label: 'Atento', description: 'Responde con prontitud y muestra interés por resolver dudas.' },
                    5: { label: 'Comprometido', description: 'Preocupación constante y activa por el progreso académico del alumno.' }
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
    readonly id: Uppercase<string>;
    readonly label: string;
    readonly description: string;
    readonly category: TagCategory;
    readonly sentiment: TagSentiment;
}

/**
 * Helper Identity Function para inferencia estricta.
 * 1. Captura las keys (K) del objeto que pasamos.
 * 2. Valida que cada propiedad [P in K] tenga un 'id' igual a P (su propia key).
 * 3. Valida que cumpla con TagDefinition (incluyendo Uppercase).
 * 4. Retorna el objeto tal cual, pero fuertemente tipado.
 */
function createStrictTags<K extends string>(
    tags: { [P in K]: TagDefinition & { readonly id: P } }
) {
    return tags;
}

export const USM_TAGS = createStrictTags({
    // --- ESTILO DE ENSEÑANZA ---
    PIZARRON_LOVER: {
        id: 'PIZARRON_LOVER',
        label: 'Pizarra Intensiva',
        description: 'Desarrolla toda la clase escribiendo en pizarra. Requiere toma de apuntes rápida y presencial.',
        category: 'ESTILO',
        sentiment: 'NEUTRAL'
    },
    PPT_READER: {
        id: 'PPT_READER',
        label: 'Lee Diapositivas',
        description: 'La clase consiste mayoritariamente en la lectura literal del material visual proyectado, con bajo valor agregado.',
        category: 'ESTILO',
        sentiment: 'NEGATIVE'
    },
    DISCUSION_SOCRATICA: {
        id: 'DISCUSION_SOCRATICA',
        label: 'Te Interroga',
        description: 'Mantiene la clase activa mediante preguntas directas y constantes a los estudiantes durante la cátedra.',
        category: 'ESTILO',
        sentiment: 'NEUTRAL'
    },
    APRENDIZAJE_ACTIVO: {
        id: 'APRENDIZAJE_ACTIVO',
        label: 'Full Ejercicios',
        description: 'La cátedra funciona como un taller práctico. Se enfoca mayoritariamente en ejercitar y resolver problemas en clase.',
        category: 'ESTILO',
        sentiment: 'POSITIVE'
    },
    TEORICO_PURO: {
        id: 'TEORICO_PURO',
        label: 'Teórico',
        description: 'Enfocado en demostraciones, axiomas y fundamentos abstractos, con menor énfasis en la aplicación práctica.',
        category: 'ESTILO',
        sentiment: 'NEUTRAL'
    },
    CASOS_REALES: {
        id: 'CASOS_REALES',
        label: 'Casos Reales',
        description: 'Utiliza ejemplos de la industria, mercado o noticias de actualidad para explicar la materia.',
        category: 'ESTILO',
        sentiment: 'POSITIVE'
    },
    GAMIFICADO: {
        id: 'GAMIFICADO',
        label: 'Clase lúdica',
        description: 'Usa herramientas como Kahoot, competencias o dinámicas de juego para enseñar y motivar.',
        category: 'ESTILO',
        sentiment: 'POSITIVE'
    },
    AULA_INVERTIDA: {
        id: 'AULA_INVERTIDA',
        label: 'Aula Invertida',
        description: 'Debes estudiar antes de asistir. La clase es exclusiva para dudas y ejercicios, no para explicar materia.',
        category: 'ESTILO',
        sentiment: 'NEUTRAL'
    },

    // --- PERSONALIDAD & AMBIENTE ---
    INSPIRADOR: {
        id: 'INSPIRADOR',
        label: 'Apasionado',
        description: 'Transmite un interés genuino y contagioso por su disciplina que motiva a estudiar.',
        category: 'PERSONALIDAD',
        sentiment: 'POSITIVE'
    },
    SARCASTICO: {
        id: 'SARCASTICO',
        label: 'Sarcástico',
        description: 'Uso frecuente de ironía y sarcasmo. Puede ser divertido o hiriente según la sensibilidad.',
        category: 'PERSONALIDAD',
        sentiment: 'ALERT'
    },
    ANECDOTICO: {
        id: 'ANECDOTICO',
        label: 'Anecdótico',
        description: 'Clases ricas en historias personales. A veces divaga del contenido central de la materia.',
        category: 'PERSONALIDAD',
        sentiment: 'NEUTRAL'
    },
    CERCANO: {
        id: 'CERCANO',
        label: 'Cercano',
        description: 'Elimina la barrera jerárquica. Es accesible, empático y genera confianza para el diálogo.',
        category: 'PERSONALIDAD',
        sentiment: 'POSITIVE'
    },
    INTIMIDANTE: {
        id: 'INTIMIDANTE',
        label: 'Intimidante',
        description: 'Genera un ambiente tenso o miedo a realizar preguntas en clase por posibles reacciones.',
        category: 'PERSONALIDAD',
        sentiment: 'NEGATIVE'
    },

    // --- EVALUACIÓN & FEEDBACK ---
    OPORTUNIDADES: {
        id: 'OPORTUNIDADES',
        label: 'Recuperativas',
        description: 'Suele ofrecer trabajos extra, recuperativas o instancias para mejorar notas críticas.',
        category: 'EVALUACION',
        sentiment: 'POSITIVE'
    },
    BONUS_DECIMAS: {
        id: 'BONUS_DECIMAS',
        label: 'Regala Décimas',
        description: 'Otorga puntos base para pruebas por participación, asistencia o tareas menores.',
        category: 'EVALUACION',
        sentiment: 'POSITIVE'
    },
    AMBIGUO: {
        id: 'AMBIGUO',
        label: 'Pauta Oscura',
        description: 'Criterios de corrección subjetivos o poco claros. Difícil entender errores o apelar nota.',
        category: 'EVALUACION',
        sentiment: 'NEGATIVE'
    },
    CONTROLES_SORPRESA: {
        id: 'CONTROLES_SORPRESA',
        label: 'Factor Sorpresa',
        description: 'Realiza evaluaciones con nota sin aviso previo. Obliga a mantener el estudio continuo.',
        category: 'EVALUACION',
        sentiment: 'ALERT'
    },
    FEEDBACK_DETALLADO: {
        id: 'FEEDBACK_DETALLADO',
        label: 'Buen Feedback',
        description: 'Entrega correcciones detalladas y formativas en las pruebas, explicando los errores.',
        category: 'EVALUACION',
        sentiment: 'POSITIVE'
    },
    CORRECCION_BINARIA: {
        id: 'CORRECCION_BINARIA',
        label: 'Todo o Nada',
        description: 'No asigna puntaje parcial. Si el resultado final es incorrecto, la pregunta tiene 0 puntos.',
        category: 'EVALUACION',
        sentiment: 'NEGATIVE'
    },
    CORRECCION_FORMATIVA: {
        id: 'CORRECCION_FORMATIVA',
        label: 'Valora Desarrollo',
        description: 'En pruebas, busca otorgar puntaje por el planteamiento y lógica, aunque el resultado final no sea exacto.',
        category: 'EVALUACION',
        sentiment: 'POSITIVE'
    },

    // --- MATERIAL & RECURSOS ---
    APUNTES_PROPIOS: {
        id: 'APUNTES_PROPIOS',
        label: 'Material Propio',
        description: 'El curso se basa en un libro o apunte de su autoría de alta calidad. No necesitas más.',
        category: 'MATERIAL',
        sentiment: 'POSITIVE'
    },
    RECURSOS_INGLES: {
        id: 'RECURSOS_INGLES',
        label: 'Material en Inglés',
        description: 'Bibliografía o diapositivas predominantemente en inglés. Requiere lectura fluida.',
        category: 'MATERIAL',
        sentiment: 'ALERT'
    },
    CLASES_GRABADAS: {
        id: 'CLASES_GRABADAS',
        label: 'Graba Clases',
        description: 'Disponibiliza grabaciones de video de las cátedras. Recurso fundamental para repaso y estudio asíncrono.',
        category: 'MATERIAL',
        sentiment: 'POSITIVE'
    },
    SIN_MATERIAL: {
        id: 'SIN_MATERIAL',
        label: 'Sin Apuntes',
        description: 'No sube material al aula virtual. Tu éxito depende 100% de los apuntes tomados en clase.',
        category: 'MATERIAL',
        sentiment: 'NEGATIVE'
    },
    CANAL_DIGITAL: {
        id: 'CANAL_DIGITAL',
        label: 'Usa Discord/Slack',
        description: 'Mantiene canales de comunicación fluidos y modernos. Respuesta rápida a dudas.',
        category: 'MATERIAL',
        sentiment: 'POSITIVE'
    },

    // --- TRAYECTORIA ---
    EXPERTO_INDUSTRIA: {
        id: 'EXPERTO_INDUSTRIA',
        label: 'Enfoque Industrial',
        description: 'Basa su enseñanza en experiencia práctica del sector privado más que en teoría.',
        category: 'TRAYECTORIA',
        sentiment: 'POSITIVE'
    },
    INVESTIGADOR: {
        id: 'INVESTIGADOR',
        label: 'Perfil Científico',
        description: 'Enfoque académico riguroso centrado en investigación y papers. Alto nivel de abstracción.',
        category: 'TRAYECTORIA',
        sentiment: 'NEUTRAL'
    },
    MENTOR: {
        id: 'MENTOR',
        label: 'Mentor',
        description: 'Ofrece orientación valiosa sobre desarrollo de carrera y futuro profesional.',
        category: 'TRAYECTORIA',
        sentiment: 'POSITIVE'
    },

    // --- LOGÍSTICA & GESTIÓN ---
    ASISTENCIA_LIBRE: {
        id: 'ASISTENCIA_LIBRE',
        label: 'Asistencia Libre',
        description: 'No controla asistencia. La responsabilidad de ir o no recae totalmente en el alumno.',
        category: 'LOGISTICA',
        sentiment: 'POSITIVE'
    },
    ASISTENCIA_ESTRICTA: {
        id: 'ASISTENCIA_ESTRICTA',
        label: 'Asistencia Forzosa',
        description: 'Control riguroso. Faltar implica riesgo de reprobación por reglamento.',
        category: 'LOGISTICA',
        sentiment: 'ALERT'
    },
    CORRECCION_RAPIDA: {
        id: 'CORRECCION_RAPIDA',
        label: 'Corrección Flash',
        description: 'Entrega notas en tiempos muy breves, reduciendo la ansiedad.',
        category: 'LOGISTICA',
        sentiment: 'POSITIVE'
    },
    CORRECCION_LENTA: {
        id: 'CORRECCION_LENTA',
        label: 'Corrección Lenta',
        description: 'Demora excesiva en entregar notas. Genera incertidumbre crítica durante el semestre.',
        category: 'LOGISTICA',
        sentiment: 'NEGATIVE'
    },
    CAMBIOS_HORARIO: {
        id: 'CAMBIOS_HORARIO',
        label: 'Reprograma',
        description: 'Frecuente cambio de horarios o suspensiones de clase. Logística impredecible.',
        category: 'LOGISTICA',
        sentiment: 'NEGATIVE'
    },
    FORMULARIO_PERMITIDO: {
        id: 'FORMULARIO_PERMITIDO',
        label: 'Usa Torpedo',
        description: 'Permite uso de formulario o resumen en las pruebas. Evalúa comprensión, no memoria.',
        category: 'LOGISTICA',
        sentiment: 'POSITIVE'
    },
});

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

export interface ProfessorComment {
    text: string;
    date: string;
    tags: string[];
}

export interface ProfessorView {
    id: string;
    name: string;
    email: string;
    stats: Record<string, MetricStats | null>;
    tags: TagId[];
    comments?: ProfessorComment[];
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