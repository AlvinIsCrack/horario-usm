import { REGISTRY } from './index';
import type { ProfessorView } from './types';

/**
 * Normaliza nombres para comparación insensible a formato.
 * Ej: "PEREZ J. JUAN (CATEDRA)" -> "PEREZ JUAN"
 */
export function normalizeString(str: string): string {
    return str
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Sin tildes
        .toUpperCase()
        .replace(/\(.*\)/g, "") // Quitar (CATEDRA), (LAB)
        .replace(/[^A-Z\s]/g, "") // Solo letras
        .trim()
        .replace(/\s+/g, " "); // Unificar espacios
}

/**
 * Coeficiente de Dice para similitud de strings (Bigramas).
 * Mejor que Levenshtein para nombres invertidos o incompletos.
 */
function getSimilarity(s1: string, s2: string): number {
    const clean1 = normalizeString(s1);
    const clean2 = normalizeString(s2);

    if (clean1 === clean2) return 1.0;
    if (clean1.length < 2 || clean2.length < 2) return 0.0;

    const getBigrams = (str: string) => {
        const bigrams = new Set<string>();
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.add(str.substring(i, i + 2));
        }
        return bigrams;
    };

    const set1 = getBigrams(clean1);
    const set2 = getBigrams(clean2);

    let intersection = 0;
    set1.forEach(bg => {
        if (set2.has(bg)) intersection++;
    });

    return (2 * intersection) / (set1.size + set2.size);
}

/**
 * Encuentra el perfil más cercano dado un nombre sucio.
 * Prioriza match exacto de ID, luego similitud de nombre.
 */
export function findBestMatch(rawName: string, threshold = 0.95): ProfessorView | null {
    if (!rawName) return null;
    const target = normalizeString(rawName);

    let bestMatch: ProfessorView | null = null;
    let maxScore = 0;

    for (const [id, profile] of Object.entries(REGISTRY)) {
        // 1. Check ID directo (normalizado)
        const idScore = getSimilarity(target, id.replace(/_/g, ' '));
        // 2. Check Nombre completo
        const nameScore = getSimilarity(target, profile.name);

        const currentMax = Math.max(idScore, nameScore);

        if (currentMax > maxScore) {
            maxScore = currentMax;
            bestMatch = profile;
        }
    }

    return maxScore >= threshold ? bestMatch : null;
}