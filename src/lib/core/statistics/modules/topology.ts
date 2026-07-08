import { Días } from "../../ramos/types";
import { STAT_LABELS, type AnalyzerContext, type StatItem } from "../types";
import { calculateDailyMetrics } from "./utils";

const isFlexibleBlock = (type: string = '') => {
    const t = type.toUpperCase();
    return ['LAB', 'TAL', 'TER', 'LIN', 'PRA', 'AYU', 'TALLER'].some(x => t.includes(x));
};

/**
 * Evaluates the physical shape of the schedule.
 * Only emits stats if the schedule presents a pathological pattern.
 */
export function analyzeTopology(ctx: AnalyzerContext, creditosMap: Record<string, number>, icons: any): StatItem[] {
    const out: StatItem[] = [];
    const metrics = calculateDailyMetrics(ctx.ramos, creditosMap);

    // A. Fragmentation (Swiss Cheese Pattern)
    let shortGaps = 0;
    for (const v of ctx.ventanas) {
        if (v.duraciónBloques === 1) shortGaps++;
    }

    if (shortGaps >= 3) {
        const isCritical = shortGaps >= 5;
        out.push({
            icon: icons.Circles,
            label: STAT_LABELS.FRAGMENTACION,
            value: isCritical ? 'Queso Suizo' : 'Moderada',
            tooltip: `Tienes <b>${shortGaps} interrupciones de un solo bloque</b>.<br/><span class="opacity-70 text-xs">Este tiempo suele perderse en filas y traslados, impidiendo el estudio profundo.</span>`,
            status: isCritical ? 'danger' : 'warning'
        });
    }

    // B. Toxic Compactness (Theoretical Suffocation)
    let maxTheoreticalStreak = 0;

    Object.entries(metrics).forEach(([d, m]) => {
        const dayBlocks = ctx.ramos.flatMap(r => r.horario.map(h => ({
            bloque: h.bloque,
            tipo: h.tipo || 'CAT',
            dia: h.dia
        }))).filter(b => b.dia === Number(d)).sort((a, b) => a.bloque - b.bloque);

        if (dayBlocks.length === 0) return;

        let currentStreak = !isFlexibleBlock(dayBlocks[0].tipo) ? 1 : 0;

        for (let i = 0; i < dayBlocks.length - 1; i++) {
            const current = dayBlocks[i];
            const next = dayBlocks[i + 1];

            const isContinuous = next.bloque === current.bloque + 1;
            const isBothTheoretical = !isFlexibleBlock(current.tipo) && !isFlexibleBlock(next.tipo);

            if (isContinuous && isBothTheoretical) {
                currentStreak++;
            } else {
                maxTheoreticalStreak = Math.max(maxTheoreticalStreak, currentStreak);
                currentStreak = !isFlexibleBlock(next.tipo) ? 1 : 0;
            }
        }
        maxTheoreticalStreak = Math.max(maxTheoreticalStreak, currentStreak);
    });

    if (maxTheoreticalStreak >= 5) {
        out.push({
            icon: icons.Warning,
            label: STAT_LABELS.HORARIO,
            value: 'Asfixiante',
            tooltip: `Detectada racha de <b>${maxTheoreticalStreak} bloques teóricos</b> consecutivos.<br/><span class="opacity-70 text-xs">Tu atención caerá en picada tras el 3er bloque. No hay espacio para pausas activas.</span>`,
            status: 'danger'
        });
    }

    // C. Load Profile (Front/Back loaded)
    let totalLoad = 0;
    let lateWeekLoad = 0;

    Object.entries(metrics).forEach(([d, m]) => {
        const dayIdx = Number(d);
        if (dayIdx <= 4) { // L-V
            totalLoad += m.carga;
            if (dayIdx === 3 || dayIdx === 4) lateWeekLoad += m.carga; // Thu-Fri
        }
    });

    if (totalLoad > 0) {
        const lateWeekRatio = lateWeekLoad / totalLoad;

        // Increased threshold to filter false positives
        if (lateWeekRatio > 0.60) {
            out.push({
                icon: icons.Weight,
                label: STAT_LABELS.PERFIL_CARGA,
                value: 'Viernes Pesado',
                tooltip: `El <b>${(lateWeekRatio * 100).toFixed(0)}%</b> de tu carga ponderada está en Jueves/Viernes.<br/><span class="opacity-70 text-xs">Llegarás con fatiga acumulada al final de la semana. Requiere resistencia.</span>`,
                status: 'warning'
            });
        }
    }

    // D. Intensity Variance (Zen vs Hardcore)
    const activeDays = Object.entries(metrics)
        .map(([d, m]) => m.bloques > 0 ? { dia: Number(d), carga: m.carga, score: m.carga + (m.carga / m.bloques) } : null)
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .sort((a, b) => a.score - b.score);

    if (activeDays.length > 1) {
        const lightest = activeDays[0];
        const heaviest = activeDays[activeDays.length - 1];
        const intensityDelta = heaviest.score - lightest.score;

        // Emits only on extreme disparity
        if (intensityDelta >= 3.5) {
            out.push({
                icon: icons.Fire,
                label: STAT_LABELS.ALTA_INTENSIDAD,
                value: `${Días[heaviest.dia]}`,
                tooltip: `Día de exigencia extrema (Carga ponderada: ${heaviest.carga.toFixed(1)}).<br/><span class="opacity-70 text-xs">Alta concentración de dificultad y densidad horaria respecto al resto de la semana.</span>`,
                status: 'warning'
            });
        }
    }

    return out;
}