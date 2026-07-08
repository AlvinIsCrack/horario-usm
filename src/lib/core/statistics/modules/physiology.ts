import { BLOQUE_COMIDA, BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { Días } from "../../ramos/types";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";

/**
 * Analyzes human limits: sleep deprivation, social jetlag, and nutrition logistics.
 */
export function analyzePhysiology(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];

    // A. Sleep Availability 
    let minFreeTime = 24 * 60;
    const logisticsOverhead = ctx.tiempoTraslado * 2 + 60;

    for (let d = 0; d < 4; d++) {
        const today = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        const tomorrow = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d + 1).map(b => b.bloque);

        if (today.length && tomorrow.length) {
            const endToday = Time.bloqueToMinutes(Math.max(...today)) + BLOQUE_DURATION_MINUTES;
            const startTomorrow = Time.bloqueToMinutes(Math.min(...tomorrow));
            const gap = 1440 - endToday + startTomorrow;
            if (gap < minFreeTime) minFreeTime = gap;
        }
    }

    const availableSleep = minFreeTime - logisticsOverhead;
    if (availableSleep < 450) {
        const isCritical = availableSleep < 360;
        const status: StatStatus = isCritical ? 'danger' : 'warning';
        let msg = `Considerando traslados, tu ventana real de sueño es de <b>${(availableSleep / 60).toFixed(1)} hrs</b>.`;

        if (ctx.esTiempoEstimado) msg += `<br/><br/>⚠️ <b>Nota:</b> Dato estimado (traslado no informado).`;
        if (isCritical) msg = `<b>Alerta Crítica:</b> Menos de 6 horas para dormir. Riesgo alto.` + (ctx.esTiempoEstimado ? ' (Estimado)' : '');

        out.push({
            icon: icons.Moon,
            label: STAT_LABELS.RECUPERACIÓN_TRANSLADO,
            value: `${(availableSleep / 60).toFixed(1)} hrs netas`,
            tooltip: msg,
            status
        });
    }

    // B. Sleep Stability (Social Jetlag)
    const morningStarts: number[] = [];
    for (let d = 0; d <= 5; d++) {
        const blocks = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (blocks.length) morningStarts.push(Time.bloqueToMinutes(Math.min(...blocks)));
    }

    if (morningStarts.length > 2) {
        const minStart = Math.min(...morningStarts);
        const maxStart = Math.max(...morningStarts);
        const deltaHours = (maxStart - minStart) / 60;

        // Tolerates up to 4 hours of variance before issuing an alert.
        if (deltaHours >= 4) {
            out.push({
                icon: icons.Resting,
                label: STAT_LABELS.SUEÑO,
                value: 'Inestable',
                tooltip: `Tu hora de entrada varía <b>${deltaHours.toFixed(1)} horas</b> entre días.<br/><span class="opacity-70 text-xs">Esta varianza extrema destruye el ritmo circadiano ("Jetlag Social").</span>`,
                status: 'warning'
            });
        }
    }

    // C. Nutrition Logistics (Queue collision)
    const preLunch = BLOQUE_COMIDA;
    const postLunch = BLOQUE_COMIDA + 1;

    const sandwichDays: string[] = [];
    const collapseDays: string[] = [];

    for (let d = 0; d <= 5; d++) {
        const dayBlocks = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (dayBlocks.length === 0) continue;

        const hasPre = dayBlocks.includes(preLunch);
        const hasPost = dayBlocks.includes(postLunch);

        if (hasPre && hasPost) {
            if (d === 2) { // Wednesday: Historical peak congestion 
                collapseDays.push(Días[d]);
            } else {
                sandwichDays.push(Días[d]);
            }
        }
    }

    if (collapseDays.length > 0) {
        const otherDays = sandwichDays.length > 0 ? `, más ${sandwichDays.join(', ')}` : '';
        out.push({
            icon: icons.Fire,
            label: STAT_LABELS.NUTRICION,
            value: 'Casino Colapsado',
            tooltip: `El <b>Miércoles</b> tienes horario "Sandwich" justo en el peak semanal de filas.<br/><span class="opacity-70 text-xs">Dependerás exclusivamente del Bloque Protegido. Lleva almuerzo.${otherDays ? ` (También aplica para ${sandwichDays.join(', ')})` : ''}</span>`,
            status: 'warning'
        });
    } else if (sandwichDays.length > 0) {
        out.push({
            icon: icons.FastFood,
            label: STAT_LABELS.NUTRICION,
            value: 'Almuerzo Express',
            tooltip: `Días con logística ajustada: <b>${sandwichDays.join(', ')}</b>.<br/><span class="opacity-70 text-xs">Tienes clases pegadas al bloque protegido. Considera filas de microondas o casino.</span>`,
            status: 'warning'
        });
    }

    return out;
}