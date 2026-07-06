// professors/matcher.ts

import { REGISTRY } from './index';
import type { ProfessorView } from './types';

// O(1) Cache for exact normalized names
const normalizedRegistryLookup = new Map<string, ProfessorView>();
const similarityCache = new Map<string, ProfessorView | null>();

/**
 * Pre-indexes the registry to allow O(1) lookups on exact matches.
 * This completely avoids the O(N) Dice scanning for standard cases.
 */
export function preIndexRegistry(): void {
    normalizedRegistryLookup.clear();
    similarityCache.clear();

    for (const [id, profile] of Object.entries(REGISTRY)) {
        const normalizedId = normalizeString(id.replace(/_/g, ' '));
        const normalizedName = normalizeString(profile.name);

        normalizedRegistryLookup.set(normalizedId, profile);
        normalizedRegistryLookup.set(normalizedName, profile);
    }
}

export function normalizeString(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\(.*\)/g, "") // Removes context tags like (CATEDRA)
        .replace(/[^A-Z\s]/g, "")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Finds the closest matching professor profile using a dual-layered strategy:
 * 1. Exact O(1) matching via pre-indexed maps.
 * 2. Fallback to Dice's Coefficient using a memoization cache.
 */
export function findBestMatch(rawName: string, threshold = 0.85): ProfessorView | null {
    if (!rawName) return null;

    const target = normalizeString(rawName);

    // Layer 1: Fast O(1) Exact Match Check
    if (normalizedRegistryLookup.has(target)) {
        return normalizedRegistryLookup.get(target)!;
    }

    // Layer 2: Cache Check for fuzzy searches
    if (similarityCache.has(target)) {
        return similarityCache.get(target)!;
    }

    let bestMatch: ProfessorView | null = null;
    let maxScore = 0;

    // Layer 3: O(N) Fuzzy Match (Lowered default threshold slightly for real-world typos)
    for (const [id, profile] of Object.entries(REGISTRY)) {
        const idScore = getSimilarity(target, id.replace(/_/g, ' '));
        const nameScore = getSimilarity(target, profile.name);
        const currentMax = Math.max(idScore, nameScore);

        if (currentMax > maxScore) {
            maxScore = currentMax;
            bestMatch = profile;
        }
    }

    const result = maxScore >= threshold ? bestMatch : null;
    similarityCache.set(target, result); // Memoize result
    return result;
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