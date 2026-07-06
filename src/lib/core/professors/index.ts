import type { EvaluationDimensionKey, EvaluationSubDimensionKey, ProcessedDimensionStructure, ProcessedSubDimension, ProfessorRegistry, ProfessorView, TagDefinition } from './types';
// 🔥 CAMBIO CLAVE: Importamos la vista agregada, no las reviews crudas
// @ts-ignore
import viewData from '$lib/data/professors_view.json';
import { findBestMatch } from './matcher';
import { EVALUATION_DIMENSIONS, TAGS_ORDER_SENTIMENT, USM_TAGS, type TagId } from './types';

// El registro ahora es directamente la vista procesada
export const REGISTRY: ProfessorRegistry = viewData as unknown as ProfessorRegistry;

// --- API ---

export function getProfessorById(id: string): ProfessorView | null {
    return REGISTRY[id] || null;
}

export function findProfessor(rawName: string): ProfessorView | null {
    return findBestMatch(rawName);
}

// --- Helpers de Renderizado ---

export function getTagMetadata(tagId: TagId): TagDefinition & { score?: number; } {
    return USM_TAGS[tagId] || {
        id: tagId,
        label: tagId,
        category: 'ESTILO',
        sentiment: 'NEUTRAL',
        description: ''
    };
}

export function orderTags<T extends { sentiment: keyof typeof TAGS_ORDER_SENTIMENT, label: string }>(tags: T[]): T[] {
    return [...tags].sort((a, b) => {
        const sentimentDiff = TAGS_ORDER_SENTIMENT[a.sentiment] - TAGS_ORDER_SENTIMENT[b.sentiment];
        if (sentimentDiff !== 0) return sentimentDiff;
        return a.label.localeCompare(b.label);
    });
}

/**
 * Resuelve el texto descriptivo de una métrica de forma dinámica.
 * @param subDimDef La definición de la sub-dimensión
 * @param valueObj El objeto de estadísticas (MetricStats) o valor crudo
 */
function resolveMetricLabel(subDimDef: any, valueObj: any): string {
    if (!valueObj) return 'Sin datos';

    // Obtenemos el valor numérico promedio
    const rawVal = typeof valueObj === 'object' ? valueObj.avg : valueObj;
    const numericVal = Math.round(Number(rawVal));

    // Como ahora todo es BARS (incluida accesibilidad), esta lógica es universal
    if (subDimDef.type === 'BARS') {
        const level = Math.max(1, Math.min(5, numericVal));
        return subDimDef.levels[level]?.label || 'N/A';
    }

    // Fallback simple para otros casos (si existieran en el futuro)
    return String(numericVal);
}

/**
 * Strongly-typed adapter layer transforming raw statistics into presentation-ready domain aggregates.
 */
export function getProfessorRenderData(input: string | ProfessorView | null) {
    if (!input) return null;

    const profile = typeof input === 'string' ? findProfessor(input) : input;
    if (!profile) return null;

    const stats = profile.stats || {};
    const meta: Record<string, ProcessedDimensionStructure> = {};
    let hasAnyData = false;

    for (const [dimKey, dimDef] of Object.entries(EVALUATION_DIMENSIONS) as [EvaluationDimensionKey, any][]) {
        const subMetas: Record<string, ProcessedSubDimension> = {};
        let hasDimData = false;

        for (const [subKey, subDef] of Object.entries(dimDef.sub_dimensions) as [EvaluationSubDimensionKey<typeof dimKey>, any][]) {
            const statObj = stats[subDef.id];

            if (statObj) {
                subMetas[subKey] = {
                    val: statObj.avg,
                    stats: statObj,
                    label: resolveMetricLabel(subDef, statObj),
                    def: subDef
                };
                hasDimData = true;
                hasAnyData = true;
            }
        }

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
        meta,
        tags: (profile.tags || []).map(([tagId, score]) => ({
            ...getTagMetadata(tagId),
            score
        })),
        sampleMeta: profile.meta
    };
}