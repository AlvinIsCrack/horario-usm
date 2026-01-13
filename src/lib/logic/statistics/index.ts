// src/lib/logic/statistics/index.ts
import { Data } from '$lib/data/data.svelte';
import { classifySchedule } from '$lib/ai/classifier';
import { type StatItem, type AnalyzerContext, type StatStatus, ICONS } from './types';

// Importación de módulos
import { analyzeBasics } from './modules/basics';
import { analyzeTopology } from './modules/topology';
import { analyzeLogistics } from './modules/logistics';
import { analyzePhysiology } from './modules/physiology';
import { analyzeAcademicStrategy } from './modules/strategy';
import { analyzeCurriculum } from './modules/curriculum';
import { analyzeConflicts } from './modules/conflicts';

/**
 * Agrupa items que tengan el mismo label (ej. múltiples 'Costo de Activación' o 'IA Insight').
 * Fusiona sus valores y tooltips, y conserva el status más crítico.
 */
function groupStatItems(items: StatItem[]): StatItem[] {
    const grouped = new Map<string, StatItem>();

    // Prioridad de severidad: Danger (0) > Warning (1) > Null/Info (2) > Success (3)
    // Usamos esto para que al fusionar, gane el estado más crítico.
    const severityMap: Record<string, number> = {
        danger: 0,
        warning: 1,
        null: 2,
        success: 3
    };

    for (const item of items) {
        if (!grouped.has(item.label)) {
            // Clonamos el item para no mutar referencias originales
            grouped.set(item.label, { ...item });
        } else {
            const existing = grouped.get(item.label)!;

            // 1. Fusionar Valores
            // Ej: "Ineficiente (Lunes)" + "Ineficiente (Jueves)" -> "Ineficiente (Lunes) • Ineficiente (Jueves)"
            existing.value = `${existing.value} • ${item.value}`;

            // 2. Fusionar Tooltips
            // Agregamos un separador visual para que no se mezclen los textos
            const separator = `<div class="my-2 border-t border-white/20"></div>`;
            existing.tooltip = `${existing.tooltip}${separator}${item.tooltip}`;

            // 3. Fusionar Status (Gana el más severo)
            const currentSeverity = severityMap[existing.status || 'null'] ?? 2;
            const newSeverity = severityMap[item.status || 'null'] ?? 2;

            if (newSeverity < currentSeverity) {
                existing.status = item.status;
            }
        }
    }

    return Array.from(grouped.values());
}

/**
 * Motor principal de estadísticas.
 * Centraliza el cálculo de créditos, ejecución de analizadores, agrupación y ordenamiento.
 */
export async function generateScheduleStatistics(
    context: AnalyzerContext
): Promise<StatItem[]> {
    const { ramos, sede, jornada } = context;

    if (!ramos.length) return [];

    // 1. Pre-cálculo de Créditos (SCT)
    const creditosMap: Record<string, number> = {};
    for (const r of ramos)
        if (creditosMap[r.sigla] === undefined)
            creditosMap[r.sigla] = r.creditos || 0;

    // 2. Ejecución del Pipeline Modular
    const icons = ICONS;
    const basicsResult = analyzeBasics(context, creditosMap, icons);

    const rawStats: StatItem[] = [
        ...basicsResult.items,
        ...analyzeTopology(context, creditosMap, icons),
        ...analyzeLogistics(context, icons),
        ...analyzePhysiology(context, icons),
        ...analyzeAcademicStrategy(context, icons),
        ...analyzeCurriculum(context, icons),
        ...analyzeConflicts(context, icons)
    ];

    // 3. Integración de IA (Clasificador)
    const aiStats: StatItem[] = [];
    try {
        const aiResult = classifySchedule(ramos, creditosMap);
        const categories = ['distribution', 'rhythm', 'structure'] as const;

        categories.forEach(cat => {
            if (!aiResult[cat].isLowConfidence) {
                aiStats.push({
                    icon: icons.Magic,
                    label: 'IA Insight', // Label común para agrupar
                    value: aiResult[cat].label,
                    tooltip: aiResult[cat].description,
                    status: null
                } as any);
            }
        });
    } catch (e) {
        console.warn("Error generando estadísticas de IA", e);
    }

    // 4. Agrupación y Consolidación
    const fullList = [...rawStats, ...aiStats];
    const groupedList = groupStatItems(fullList);

    // 5. Ordenamiento por Prioridad UX (Severidad y luego Alfabético)
    const priorityMap: Record<string, number> = {
        danger: 0,
        warning: 1,
        null: 2,
        success: 3
    };

    return groupedList.sort((a, b) => {
        // 1. Ordenar por severidad (priorityMap)
        const aPriority = priorityMap[a.status || 'null'] ?? 2;
        const bPriority = priorityMap[b.status || 'null'] ?? 2;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        // 2. Si tienen la misma prioridad, ordenar alfabéticamente por label
        return a.label.localeCompare(b.label);
    });
}