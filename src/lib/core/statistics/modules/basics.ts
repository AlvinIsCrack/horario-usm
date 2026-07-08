// statistics/modules/basics.ts
import { BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";

/**
 * Configuration factors for academic load heuristics.
 */
const CONFIG = {
    REALISTIC_STUDY_FACTOR: 0.8, // Reduces theoretical study hours to realistic student behavior
    WEEKLY_HOURS: 168,
    IDEAL_SLEEP_HOURS: 56,       // 8 hours * 7 days
    BASIC_ROUTINE_HOURS: 14      // Meals, hygiene (approx 2 hours/day)
} as const;

/**
 * Analyzes baseline academic load, physical permanence on campus,
 * focus density, and systemic time budget (Temporal Bankruptcy).
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
        } else if (averageWeight >= 5.5 && totalSubjects >= 3) {
            // Raised threshold to 5.5+ and requires at least 3 subjects to avoid triggering on a single thesis/capstone course.
            out.push({
                icon: icons.Balance,
                label: STAT_LABELS.ENFOQUE,
                value: 'Denso',
                tooltip: `Promedio General: ${averageWeight.toFixed(1)}<br/><span class="opacity-70 text-xs">Carga densa. Mayoría de "ladrillos" (Créditos > 5). Requiere profundidad técnica constante y madurez académica.</span>`,
                status: 'warning'
            });
        }
    }

    // D. Shared Variables for Study and Temporal Bankruptcy
    const subjectsWithoutSCT = Object.values(creditosMap).filter((c) => c === 0).length;
    const weeklyClassHours = minutesAula / 60;

    // Base formula: (SCT * 27) / 17 weeks. Scaled down by realistic student behavior factor (0.8).
    const theoreticalSuggestedHours = (totalSCT * 27) / 17;
    const weeklyAutonomousHours = Math.max(0, theoreticalSuggestedHours - weeklyClassHours) * CONFIG.REALISTIC_STUDY_FACTOR;
    const dailyAutonomousHours = weeklyAutonomousHours / 6; // Mon-Sat

    // E. Autonomous Study Load Alert
    if (totalSCT > 0 || subjectsWithoutSCT > 0) {
        const isCritical = dailyAutonomousHours > 6.0;
        const isWarning = dailyAutonomousHours > 4.5;

        if (isCritical || isWarning || subjectsWithoutSCT > 0) {
            const status: StatStatus = isCritical ? 'danger' : 'warning';
            const recommendation = isCritical ? 'Carga extrema. Riesgo inminente de burnout.' : 'Carga elevada. Requiere planificación estricta Lunes a Sábado.';
            const missingDataWarning = subjectsWithoutSCT > 0 ? `<br/><br/>⚠️ <b>Nota:</b> Se detectaron ${subjectsWithoutSCT} asignatura(s) sin créditos, la carga real será mayor.` : '';

            out.push({
                icon: icons.Book,
                label: STAT_LABELS.ESTUDIO_AUTONOMO,
                value: `${dailyAutonomousHours.toFixed(1)} hrs/día`,
                tooltip: `Dedicación teórica estimada fuera del aula. ${recommendation}${missingDataWarning}`,
                status
            });
        }
    }

    // F. Temporal Bankruptcy (Systemic Time Budget)
    if (totalSCT > 0) {
        // Calculate unique days traveling to campus
        const activeDays = new Set(ctx.ramos.flatMap(r => r.horario.map(h => h.dia)));
        const weeklyTravelHours = (ctx.tiempoTraslado * 2 * activeDays.size) / 60;

        const totalCommittedHours =
            CONFIG.IDEAL_SLEEP_HOURS +
            CONFIG.BASIC_ROUTINE_HOURS +
            weeklyTravelHours +
            weeklyClassHours +
            weeklyAutonomousHours;

        const slackHours = CONFIG.WEEKLY_HOURS - totalCommittedHours;

        // Alerts if the student has less than ~2 hours of free time per day
        if (slackHours < 15) {
            const isCritical = slackHours < 7; // < 1 hour of freedom per day
            out.push({
                icon: icons.Warning,
                label: STAT_LABELS.BANCARROTA_TEMPORAL || 'Bancarrota Temporal' as any, // Fallback if type isn't updated yet
                value: isCritical ? 'Margen Cero' : 'Crítico',
                tooltip: `Tu presupuesto de tiempo semanal está al límite (Holgura: <b>${slackHours.toFixed(1)} hrs libres/semana</b>).<br/><span class="opacity-70 text-xs">Considerando sueño, clases, horas realistas de estudio y ${weeklyTravelHours.toFixed(1)}h de viaje. Un pequeño atraso o imprevisto colapsará toda tu semana.</span>`,
                status: isCritical ? 'danger' : 'warning'
            });
        }
    }

    return { items: out, minutesAula, minutesPermanencia };
}