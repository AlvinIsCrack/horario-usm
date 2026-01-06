export const WARN_SCT = 35;
export const DAY_FIRST_MINUTES = 495;
export const BLOQUE_COMIDA = 8;
export const BLOQUE_COMIDA_DURATION_MINUTES = 45;
export const BLOQUE_DURATION_MINUTES = 35;
export const BREAK_DURATION_MINUTES = 15;
export const SIGLA_REGEX = /\b[A-Z]+\d+\b(?:-|_)?[A-Z]+/;

export const SUBJECT_WEIGHTS: Record<string, number> = {
    // --- Plan Común (Filtros) ---
    'MAT0*': 1.6, // Matemáticas de primer año (La "Maldad")
    'FIS1*': 1.5, // Físicas introductorias
    'QUI0*': 1.4, // Química general
    'IWI131': 1.5, // Progra (suele consumir mucho tiempo de debug)

    // --- Alivios ---
    'EFI*': 0.6,  // Educación Física (Cansa el cuerpo, libera la mente)
    'HRW*': 0.7,  // Humanísticos (Generalmente menos carga técnica)
    'IWG101': 0.8 // Intro a la Ingeniería
};

// Helper para resolver el peso de una asignatura
export function getSubjectWeight(sigla: string): number {
    // 1. Busqueda Exacta
    if (SUBJECT_WEIGHTS[sigla]) return SUBJECT_WEIGHTS[sigla];

    // 2. Busqueda por Patrón (Wildcard *)
    // Ordenamos por longitud descendente para priorizar reglas más específicas (ej: MAT021 gana a MAT*)
    const patrones = Object.keys(SUBJECT_WEIGHTS).filter(k => k.endsWith('*'));

    for (const patron of patrones) {
        const prefix = patron.slice(0, -1); // Quitar el *
        if (sigla.startsWith(prefix)) {
            return SUBJECT_WEIGHTS[patron];
        }
    }

    // 3. Default (SCT puro)
    return 1.0;
}