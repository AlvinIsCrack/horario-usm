import type { ProfessorRegistry, ProfessorProfile, TagDefinition, TagSentiment } from './types';
// @ts-ignore
import rawData from './registry.json';
import { findBestMatch } from './matcher';
import { EVALUATION_DIMENSIONS, TAGS_ORDER_SENTIMENT, USM_TAGS, type TagId } from './types';

export const REGISTRY: ProfessorRegistry = rawData as unknown as ProfessorRegistry;

// --- API ---

export function getProfessorById(id: string): ProfessorProfile | null {
    return REGISTRY[id] || null;
}

export function findProfessor(rawName: string): ProfessorProfile | null {
    return findBestMatch(rawName);
}

// --- Helpers de Renderizado ---

export function getTagMetadata(tagId: TagId) {
    return USM_TAGS[tagId] || {
        id: tagId,
        label: tagId,
        category: 'ESTILO',
        sentiment: 'NEUTRAL',
        description: ''
    };
}

export function orderTags(tags: TagDefinition[]) {
    return [...tags].sort((a, b) => {
        // 1. Comparar por sentimiento
        const sentimentDiff = TAGS_ORDER_SENTIMENT[a.sentiment] - TAGS_ORDER_SENTIMENT[b.sentiment];
        if (sentimentDiff !== 0) return sentimentDiff;

        // 2. Si el sentimiento es igual, ordenar por label A-Z
        return a.label.localeCompare(b.label);
    });
}

export function getBarsLabel(
    dimension: 'temperamento' | 'justicia',
    subDim: 'estabilidad' | 'coherencia',
    score?: number
): string {
    if (score === undefined) return 'Sin datos';

    const level = Math.round(Math.max(1, Math.min(5, score))) as 1 | 2 | 3 | 4 | 5;
    // @ts-ignore
    return EVALUATION_DIMENSIONS[dimension]?.sub_dimensions[subDim]?.levels[level]?.label || 'N/A';
}

/**
 * Resuelve el texto descriptivo de una métrica de forma dinámica.
 * @param subDimDef La definición de la sub-dimensión (desde EVALUATION_DIMENSIONS)
 * @param value El valor almacenado en stats
 */
function resolveMetricLabel(subDimDef: any, value: any): string {
    if (value === undefined || value === null) return 'Sin datos';

    if (subDimDef.type === 'BARS') {
        const numericVal = Math.round(Number(value));
        // Validamos rango 1-5
        const level = Math.max(1, Math.min(5, numericVal));
        return subDimDef.levels[level]?.label || 'N/A';
    }

    if (subDimDef.type === 'DISCRETE') {
        return subDimDef.options[value]?.label || value;
    }

    return String(value);
}

/**
 * Genera la estructura de datos para la UI iterando sobre la configuración
 * de dimensiones, sin hardcodear claves.
 */
export function getProfessorRenderData(input: string | ProfessorProfile | null) {
    if (!input) return null;

    const profile = typeof input === 'string' ? findProfessor(input) : input;
    if (!profile) return null;

    const stats = profile.stats || {};
    const meta: Record<string, any> = {};
    let hasAnyData = false;

    // Iteración Dinámica: Recorremos las dimensiones definidas en types.ts
    for (const [dimKey, dimDef] of Object.entries(EVALUATION_DIMENSIONS)) {
        const subMetas: Record<string, any> = {};
        let hasDimData = false;

        // Recorremos las sub-dimensiones (ej: estabilidad, accesibilidad)
        for (const [subKey, subDef] of Object.entries(dimDef.sub_dimensions)) {
            // Usamos el ID definido en la configuración para buscar el valor en stats
            const val = stats[subDef.id];

            // Si existe un valor válido, lo procesamos
            if (val !== undefined && val !== null) {
                subMetas[subKey] = {
                    val,
                    label: resolveMetricLabel(subDef, val),
                    def: subDef // Pasamos la definición por si la UI necesita tooltips/descripciones
                };
                hasDimData = true;
                hasAnyData = true;
            }
        }

        // Solo agregamos la dimensión si tiene al menos una métrica con datos
        if (hasDimData) {
            meta[dimKey] = {
                label: dimDef.label,
                id: dimDef.id,
                subs: subMetas
            };
        }
    }

    return {
        profile,
        hasData: hasAnyData,
        meta, // Estructura dinámica: { temperamento: { subs: { ... } }, exigencia: { ... } }
        tags: (profile.activeTags || []).map(tagId => getTagMetadata(tagId))
    };
}