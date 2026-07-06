// Dynamic extractors for Dimensions and Subdimensions keys
export type EvaluationDimensionKey = keyof typeof EVALUATION_DIMENSIONS;

export type EvaluationSubDimensionKey<D extends EvaluationDimensionKey> =
    keyof typeof EVALUATION_DIMENSIONS[D]['sub_dimensions'];

// Universal safe interface for dynamically computed metrics
export interface ProcessedSubDimension {
    val: number;
    stats: MetricStats;
    label: string;
    def: {
        id: string;
        label: string;
        description: string;
        type: string;
        levels: Record<number, { label: string; description: string }>;
    };
}

export interface ProcessedDimensionStructure {
    label: string;
    id: string;
    subs: Record<string, ProcessedSubDimension>;
}

export type ConfidenceStatus = 'ARCHIVED' | 'UNRATED' | 'PRELIMINARY' | 'SOLID' | 'HIGHLIGHTED';

export const CONFIDENCE_THRESHOLDS = {
    PRELIMINARY_MAX: 2, // Up to 2 votes
    SOLID_MAX: 5,       // From 3 up to 5 votes
    HIGHLIGHTED_MIN: 6  // 6 or more votes
} as const;

/**
 * Domain function determining statistical confidence level based on business rules.
 */
export function calculateConfidenceStatus(reviewCount: number, isArchived?: boolean): ConfidenceStatus {
    if (isArchived) return 'ARCHIVED';
    if (reviewCount === 0) return 'UNRATED';
    if (reviewCount <= CONFIDENCE_THRESHOLDS.PRELIMINARY_MAX) return 'PRELIMINARY';
    if (reviewCount <= CONFIDENCE_THRESHOLDS.SOLID_MAX) return 'SOLID';
    return 'HIGHLIGHTED';
}

// ==========================================
// 1. DIMENSIONES (Métricas)
// ==========================================
export const EVALUATION_DIMENSIONS = {
    didactica: {
        id: 'didactica',
        label: 'Metodología',
        sub_dimensions: {
            claridad: {
                id: 'claridad_expositiva',
                label: 'Didáctica',
                description: 'Evalúa la capacidad de síntesis y oratoria del profesor. Mide su talento para aterrizar conceptos abstractos y si su relato permite tomar apuntes coherentes sin dejar lagunas de información.',
                type: 'BARS',
                levels: {
                    1: {
                        label: 'Confuso',
                        description: 'Divaga o se desordena al explicar; carece de hilo conductor, haciendo casi imposible entender.'
                    },
                    2: {
                        label: 'Denso',
                        description: 'Complica lo simple; da vueltas innecesarias o utiliza un lenguaje poco accesible que dificulta la comprensión.'
                    },
                    3: {
                        label: 'Correcto',
                        description: 'Transmite la materia de forma ordenada y lineal; cumple con exponer los contenidos de manera entendible.'
                    },
                    4: {
                        label: 'Pedagógico',
                        description: 'Facilita activamente el aprendizaje; estructura muy bien sus ideas y utiliza analogías o ejemplos que ayudan a "aterrizar" la teoría.'
                    },
                    5: {
                        label: 'Magistral',
                        description: 'Hay don para la enseñanza; su oratoria y claridad mental logran que incluso los conceptos más difíciles parezcan simples de entender.'
                    }
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
                label: 'Severidad',
                description: 'Se refiere exclusivamente a la vara de medición en las evaluaciones. No mide lo difícil del examen, sino qué tan estricta es la corrección (ej: si descuenta mucho por errores de forma, redacción o unidades en un resultado correcto).',
                type: 'BARS',
                levels: {
                    1: {
                        label: 'Benevolente',
                        description: 'Corrección de tipo "mano blanda"; suele pasar por alto errores evidentes y otorga puntaje generoso por procedimientos parciales o la mera intención.'
                    },
                    2: {
                        label: 'Comprensivo',
                        description: 'Prioriza el fondo sobre la forma; valora que el alumno haya entendido el concepto central y no descuenta por errores menores de detalle.'
                    },
                    3: {
                        label: 'Objetivo',
                        description: 'Evalúa objetivamente acorde a la pauta; corrige de manera neutral, validando lo correcto y descontando lo incorrecto sin buscar la quinta pata al gato.'
                    },
                    4: {
                        label: 'Exigente',
                        description: 'Se exige precisión técnica total; descuenta puntaje por errores de notación, unidades, ortografía o redacción, aunque el resultado numérico sea correcto.'
                    },
                    5: {
                        label: 'Estricto',
                        description: 'Busca la perfección absoluta en las evaluaciones; su corrección no admite matices y penaliza severamente cualquier desviación mínima de la respuesta esperada, anulando el puntaje.'
                    }
                }
            },
            coherencia: {
                id: 'coherencia_evaluativa',
                label: 'Coherencia',
                description: 'Mide la "honestidad" académica entre lo enseñado y lo evaluado. Analiza si la materia y los ejemplos vistos en cátedra son representativos de lo que finalmente se pregunta en las evaluaciones.',
                type: 'BARS',
                levels: {
                    1: {
                        label: 'Incoherente',
                        description: 'Lo visto en clases es irrelevante o insuficiente para resolver las evaluaciones.'
                    },
                    2: {
                        label: 'Desfasado',
                        description: 'Los ejercicios o temas abordados son mucho más simples que la realidad que se enfrenta en la prueba.'
                    },
                    3: {
                        label: 'Equilibrado',
                        description: 'Lo enseñado en pizarra cubre adecuadamente la complejidad requerida en las evaluaciones.'
                    },
                    4: {
                        label: 'Alineado',
                        description: 'Sintonía total: la cátedra entrega rigurosamente todas las herramientas y la complejidad necesaria para resolver el examen sin problemas.'
                    },
                    5: {
                        label: 'Predecible',
                        description: 'El docente "pautea" la prueba en clases: repite ejercicios textuales o anticipa los temas, haciendo que la evaluación resulte más fácil de abordar.'
                    }
                }
            },
            dificultad: {
                id: 'dificultad_percibida',
                label: 'Dificultad',
                description: 'Mide la carga total que impone el profesor. Incluye la complejidad de las tareas, la profundidad de los temas abordados y cuántas horas semanales extra demanda el curso para no quedar "atrás" respecto a su ritmo.',
                type: 'BARS',
                levels: {
                    1: { label: 'Simplificador', description: 'Se reduce la exigencia al mínimo; con su gestión, aprobar requiere muy poco esfuerzo académico.' },
                    2: { label: 'Facilitador', description: 'El profesor hace el ramo muy llevadero; flexibiliza plazos o contenidos para que la carga se sienta ligera.' },
                    3: { label: 'Estándar', description: 'Se pide lo justo y necesario; mantiene un ritmo de trabajo acorde al programa sin regalar ni sobrecargar.' },
                    4: { label: 'Intenso', description: 'Se eleva la vara; el estilo del profesor demanda del alumno una dedicación extra y un estudio disciplinado para cumplir sus estándares.' },
                    5: { label: 'Extremo', description: 'El profesor impone una carga de trabajo desproporcionada; sus requerimientos son tan altos que suelen comprometer el rendimiento en otros ramos.' }
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
    tags: [TagId, number][];
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