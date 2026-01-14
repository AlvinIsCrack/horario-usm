/**
 * SISTEMA AVANZADO DE ABREVIACIÓN DE ASIGNATURAS
 * -----------------------------------------------
 * Estrategia: Pipeline de Normalización -> Tokenización -> Filtrado -> Transformación -> Reconstrucción.
 */

// 1. STOPWORDS: Palabras que no aportan valor semántico en un horario compacto.
const STOP_WORDS = new Set([
    'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS',
    'A', 'AL', 'EN', 'Y', 'E', 'PARA', 'POR',
    'CON', 'SOBRE', 'SUS'
]);

// 2. DICCIONARIO SEMÁNTICO: Mapeo directo de términos comunes encontrados en tu lista.
// Se usa un objeto para búsqueda O(1) en lugar de múltiples regex.
const ABBREVIATIONS: Record<string, string> = {
    // Tipos de Clase
    'LABORATORIO': 'LAB.',
    'AYUDANTIA': 'AYUD.',
    'TALLER': 'TALLER', // Taller suele ser corto y clave en Arquitectura
    'SEMINARIO': 'SEM.',
    'INTRODUCCION': 'INTRO.',
    'FUNDAMENTOS': 'FUND.',
    'PROYECTO': 'PROY.',
    'TRABAJO': 'TRAB.',
    'PRACTICA': 'PRAC.',
    'METODOS': 'MET.',
    'ANALISIS': 'ANÁL.',
    'TEORIA': 'TEO.',
    'HISTORIA': 'HIST.',
    'DISEÑO': 'DISEÑO', // Corto y relevante
    'MEMORIA': 'MEM.',
    'INVESTIGACION': 'INVEST.',
    'INTELIGENCIA': 'INTEL.',

    // Disciplinas (Basado en ramos.txt)
    'MATEMATICA': 'MAT.',
    'MATEMATICAS': 'MAT.',
    'FISICA': 'FIS.',
    'QUIMICA': 'QMC.', // QMC es más distintivo que QUIM
    'INGENIERIA': 'ING.',
    'PROGRAMACION': 'PROGRA.',
    'COMPUTACION': 'COMP.',
    'COMPUTACIONAL': 'COMP.',
    'ALGORITMOS': 'ALG.',
    'ARQUITECTURA': 'ARQ.',
    'ESTRUCTURAS': 'EST.',
    'ESTRUCTURAL': 'EST.',
    'MECANICA': 'MEC.',
    'ELECTRICA': 'ELEC.',
    'ELECTRONICA': 'ELECTRO.',
    'INDUSTRIAL': 'IND.',
    'AMBIENTAL': 'AMB.',
    'ECONOMIA': 'ECON.',
    'ADMINISTRACION': 'ADMIN.',
    'GESTION': 'GEST.',
    'SISTEMAS': 'SIST.',
    'TELEMATICA': 'TELEM.',
    'MINERIA': 'MIN.',

    // Calificativos
    'GENERAL': 'GRAL.',
    'AVANZADO': 'AV.',
    'AVANZADA': 'AV.',
    'APLICADA': 'APLIC.',
    'APLICADO': 'APLIC.',
    'BASICA': 'BAS.',
    'BASICO': 'BAS.',
    'CONTEMPORANEA': 'CONTEMP.',
    'EXPERIMENTALES': 'EXP.',
    'EXPERIMENTAL': 'EXP.',
    'SOSTENIBLE': 'SOST.',
    'SUSTENTABILIDAD': 'SUST.',
    'CORPORATIVA': 'CORP.',
    'ORGANIZACIONAL': 'ORG.',
    'TECNOLOGIA': 'TEC.',
    'TECNOLOGIAS': 'TEC.',
    'DIGITAL': 'DIG.',
    'DIGITALES': 'DIG.'
};

// 3. SUFIJOS GENÉRICOS: Reglas heurísticas para palabras largas desconocidas.
const SUFFIX_RULES: Array<[RegExp, string]> = [
    [/LOGI[A|AS]$/, 'LOG.'],      // Geología -> GEOLOG.
    [/METRI[A|AS]$/, 'MET.'],     // Geometría -> GEOMET.
    [/DAD[ES]?$/, 'DAD.'],        // Probabilidades -> PROBABILIDAD.
    [/CION[ES]?$/, 'CIÓN.'],      // Planificación -> PLANIFICACIÓN.
];

// 4. REEMPLAZO DE NOMBRES COMÚNES: Apodos que reciben los ramos
const REPLACEMENT_RULES: Array<[RegExp, string]> = [
    [/ESTAD.STICA.+COMPUTACIONAL/, 'ESTACA'],
    [/DISEÑO.+INTERFACES.+USUARIAS/, 'DISEÑO UI'],
    [/INGENIER.A.+INFORM.TICA.+SOCIEDAD/, 'INFOSOC'],
];

// --- FUNCIONES CORE ---

/**
 * Elimina acentos para facilitar el mapeo, pero intentaremos restaurar
 * la legibilidad en el output si es necesario (aunque mayúsculas sin tilde es estándar en horarios).
 */
function normalize(str: string): string {
    return str
        .normalize('NFD')
        .toUpperCase()
        .replace(/[^A-Z0-9\s\.\-\u0303]/g, "")
        .normalize('NFC');
}

/**
 * Procesa un token individual contra el diccionario y reglas.
 */
function processToken(token: string): string {
    // 1. Chequeo directo en diccionario
    if (ABBREVIATIONS[token]) {
        return ABBREVIATIONS[token];
    }

    // 2. Reglas de Sufijos (Heurística para casos no mapeados)
    if (token.length > 6) { // Solo aplicar a palabras largas
        for (const [regex, replacement] of SUFFIX_RULES) {
            if (regex.test(token)) {
                return token.replace(regex, replacement);
            }
        }
    }

    return token;
}

/**
 * Función Principal exportable
 */
export function formatCourseName(originalName: string, maxLength: number = 35): string {
    if (!originalName) return "";

    // Paso 1: Normalización inicial
    let cleanName = normalize(originalName);

    // Si es que tiene un apodo
    for (const [regex, replacement] of REPLACEMENT_RULES)
        if (regex.test(cleanName))
            return replacement;

    // Paso 2: Tokenización inteligente (separa por espacios, puntos o guiones)
    let tokens = cleanName.split(/[\s\.]+/);

    // Paso 3: Filtrado de Stopwords
    // Excepción: Si el nombre queda vacío (ej: "A Y E"), no filtramos todo.
    const filteredTokens = tokens.filter(t => !STOP_WORDS.has(t));
    if (filteredTokens.length === 0) return tokens.join(" "); // Fallback seguro
    tokens = filteredTokens;

    // Paso 4: Transformación (Mapeo)
    let processedTokens = tokens.map(processToken);

    // Paso 5: Reconstrucción y Verificación de Longitud
    let result = processedTokens.join(" ");

    // Paso 6: Compresión de Emergencia (Si sigue siendo muy largo)
    if (result.length > maxLength) {
        // Estrategia agresiva: Truncar palabras largas que NO fueron abreviadas
        result = processedTokens.map(token => {
            // Si tiene punto (ya fue abreviada), la dejamos. Si es corta, la dejamos.
            if (token.includes('.') || token.length <= 4) return token;
            // Si es larga y no estaba en el diccionario, cortamos a 4 chars
            return token.slice(0, 4) + '.';
        }).join(" ");
    }

    return result;
}