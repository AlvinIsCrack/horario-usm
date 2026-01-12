import type { ProfessorRegistry, ProfessorView, TagDefinition } from './types';
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
 * Genera la estructura para la UI consumiendo la nueva View Layer
 */
export function getProfessorRenderData(input: string | ProfessorView | null) {
    if (!input) return null;

    const profile = typeof input === 'string' ? findProfessor(input) : input;
    if (!profile) return null;

    const stats = profile.stats || {};
    const meta: Record<string, any> = {};
    let hasAnyData = false;

    for (const [dimKey, dimDef] of Object.entries(EVALUATION_DIMENSIONS)) {
        const subMetas: Record<string, any> = {};
        let hasDimData = false;

        for (const [subKey, subDef] of Object.entries(dimDef.sub_dimensions)) {
            // Buscamos la métrica. Ahora 'val' es un objeto MetricStats { avg, stdev... }
            const statObj = stats[subDef.id];

            if (statObj) {
                subMetas[subKey] = {
                    val: statObj.avg, // Usamos el promedio para sliders/números
                    stats: statObj,   // Pasamos el objeto completo por si queremos mostrar distribución
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
        tags: (profile.tags || []).map(tagId => getTagMetadata(tagId)),
        sampleMeta: profile.meta
    };
}