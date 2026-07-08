import { BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";

/**
 * Analyzes baseline academic load, physical permanence on campus,
 * and hidden density in the theoretical core.
 */
export function analyzeBasics(ctx: AnalyzerContext, creditosMap: Record<string, number>, icons: any): { items: StatItem[], minutesAula: number, minutesPermanencia: number } {
    const out: StatItem[] = [];

    // A. In-Class Time
    const uniqueBlocks = new Set<string>();
    ctx.ramos.forEach((r) => r.horario.forEach((b) => uniqueBlocks.add(`${b.dia}-${b.bloque}`)));
    const minutesAula = uniqueBlocks.size * BLOQUE_DURATION_MINUTES;

    out.push({
        icon: icons.Clock,
        label: STAT_LABELS.EN_AULA,
        value: `${(minutesAula / 60).toFixed(1)} horas`,
        tooltip: `Carga presencial obligatoria.<br/><span class="opacity-70 text-xs">Total de horas cronológicas "de silla". No incluye estudio, transporte ni ventanas.</span>`
    });

    // B. Campus Efficiency (Permanence vs. Active Class Time)
    let minutesPermanencia = 0;
    for (let d = 0; d <= 5; d++) {
        const blocks = ctx.ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
        if (blocks.length > 0) {
            const minB = Math.min(...blocks.map((b) => b.bloque));
            const maxB = Math.max(...blocks.map((b) => b.bloque));
            const start = Time.bloqueToMinutes(minB);
            const end = Time.bloqueToMinutes(maxB) + BLOQUE_DURATION_MINUTES;
            minutesPermanencia += end - start;
        }
    }

    if (minutesPermanencia > 0) {
        const efficiency = Math.round((minutesAula / minutesPermanencia) * 100);

        // Emits an alert strictly if the layout acts as a time sink.
        if (efficiency < 60) {
            const isCritical = efficiency < 45;
            const idleMinutesPerHour = Math.round((minutesPermanencia - minutesAula) / (minutesAula / 60));

            out.push({
                icon: icons.Brain,
                label: STAT_LABELS.EFICIENCIA,
                value: `${efficiency}%`,
                tooltip: `Por cada 1 hora de clase, tienes <b>${idleMinutesPerHour} min</b> de espera/ventana.<br/><span class="opacity-70 text-xs">${isCritical ? 'Peligro: Pasas más tiempo "haciendo hora" que estudiando.' : 'Densidad baja. Requiere disciplina para usar las ventanas.'}</span>`,
                status: isCritical ? 'danger' : 'warning'
            });
        }
    }

    // C. Focus (Density Profile)
    const totalSCT = Object.values(creditosMap).reduce((sum, c) => sum + c, 0);
    const totalSubjects = ctx.ramos.length;

    if (totalSubjects > 0 && totalSCT > 0) {
        const averageWeight = totalSCT / totalSubjects;
        const coreSubjects = Object.values(creditosMap).filter(c => c >= 3);
        const technicalWeight = coreSubjects.length > 0
            ? coreSubjects.reduce((a, b) => a + b, 0) / coreSubjects.length
            : 0;

        // Alerts triggered solely on pathological curriculum setups.
        if (technicalWeight >= 5 && averageWeight < 4) {
            out.push({
                icon: icons.Balance,
                label: STAT_LABELS.ENFOQUE,
                value: 'Disfrazada',
                tooltip: `Promedio General: ${averageWeight.toFixed(1)} <span class="opacity-50">|</span> Núcleo Técnico: ${technicalWeight.toFixed(1)}<br/><span class="opacity-70 text-xs">Tu promedio es bajo por los ramos chicos, pero tu núcleo es <b>muy pesado</b>. No te confíes.</span>`,
                status: 'warning'
            });
        } else if (averageWeight < 3.5 && totalSubjects >= 5) {
            out.push({
                icon: icons.Balance,
                label: STAT_LABELS.ENFOQUE,
                value: 'Fragmentado',
                tooltip: `Promedio General: ${averageWeight.toFixed(1)}<br/><span class="opacity-70 text-xs">Muchos ramos de bajo crédito. El peligro es el desorden administrativo, no la dificultad.</span>`,
                status: 'warning'
            });
        } else if (averageWeight > 5.0) {
            out.push({
                icon: icons.Balance,
                label: STAT_LABELS.ENFOQUE,
                value: 'Denso',
                tooltip: `Promedio General: ${averageWeight.toFixed(1)}<br/><span class="opacity-70 text-xs">Pocos ramos, pero "ladrillos" (Créditos > 5). Requiere profundidad técnica constante.</span>`,
                status: 'warning'
            });
        }
    }

    // D. Autonomous Study Load
    const subjectsWithoutSCT = Object.values(creditosMap).filter((c) => c === 0).length;
    if (totalSCT > 0 || subjectsWithoutSCT > 0) {
        const weeklySuggestedHours = (totalSCT * 27) / 17;
        const dailyAutonomousHours = Math.max(0, weeklySuggestedHours - (minutesAula / 60)) / 6;

        const isCritical = dailyAutonomousHours > 6.0;
        const isWarning = dailyAutonomousHours > 4.5;

        if (isCritical || isWarning || subjectsWithoutSCT > 0) {
            const status: StatStatus = isCritical ? 'danger' : 'warning';
            const recommendation = isCritical ? 'Carga extrema. Riesgo inminente de burnout.' : 'Carga elevada. Requiere planificación estricta Lunes a Sábado.';
            const missingDataWarning = subjectsWithoutSCT > 0 ? `<br/>Nota: Se detectaron ${subjectsWithoutSCT} asignatura(s) sin información de créditos.` : '';

            out.push({
                icon: icons.Book,
                label: STAT_LABELS.ESTUDIO_AUTONOMO,
                value: `${dailyAutonomousHours.toFixed(1)} hrs/día`,
                tooltip: `Dedicación teórica estimada fuera del aula. ${recommendation}${missingDataWarning}`,
                status
            });
        }
    }

    return { items: out, minutesAula, minutesPermanencia };
}