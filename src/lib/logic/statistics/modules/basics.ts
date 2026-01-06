import { BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";

// 1. ANÁLISIS BÁSICO (Aula, Eficiencia Global, Estudio)
export function analyzeBasics(ctx: AnalyzerContext, creditosMap: Record<string, number>, icons: any): { items: StatItem[], minutesAula: number, minutesPermanencia: number } {
    const out: StatItem[] = [];

    // A. En Aula
    const bloquesUnicos = new Set<string>();
    ctx.ramos.forEach((r) => r.horario.forEach((b) => bloquesUnicos.add(`${b.dia}-${b.bloque}`)));
    const minutesAula = bloquesUnicos.size * BLOQUE_DURATION_MINUTES;

    out.push({
        icon: icons.Clock,
        label: STAT_LABELS.EN_AULA,
        value: `${(minutesAula / 60).toFixed(1)} horas`,
        tooltip: `Carga presencial obligatoria.<br/><span class="opacity-70 text-xs">Total de horas cronológicas "de silla". No incluye estudio, transporte ni ventanas.</span>`
    });

    // B. Eficiencia de Campus (Permanencia vs Aula)
    let minutesPermanencia = 0;
    for (let d = 0; d <= 5; d++) {
        const bloques = ctx.ramos.flatMap((r) => r.horario).filter((b) => b.dia === d);
        if (bloques.length > 0) {
            const minB = Math.min(...bloques.map((b) => b.bloque));
            const maxB = Math.max(...bloques.map((b) => b.bloque));
            const start = Time.bloqueToMinutes(minB);
            const end = Time.bloqueToMinutes(maxB) + BLOQUE_DURATION_MINUTES;
            minutesPermanencia += end - start;
        }
    }

    if (minutesPermanencia > 0) {
        const eficiencia = Math.round((minutesAula / minutesPermanencia) * 100);
        let status: StatStatus = null;
        let mensaje = '';

        if (eficiencia < 50) {
            status = 'danger';
            mensaje = 'Pasas más tiempo "haciendo hora" que en clases. Si vives lejos, es ineficiente.';
        } else if (eficiencia < 75) {
            status = 'warning';
            mensaje = 'Densidad media. Si no usas las ventanas para estudiar, tu jornada será eterna.';
        } else {
            status = 'success';
            mensaje = 'Jornada compacta. Ideal para optimizar tu tiempo en campus.';
        }

        const minutosLibresPorHora = Math.round((minutesPermanencia - minutesAula) / (minutesAula / 60));

        out.push({
            icon: icons.Timeline,
            label: STAT_LABELS.EFICIENCIA,
            value: `${eficiencia}%`,
            tooltip: `Por cada 1 hora de clase, tienes <b>${minutosLibresPorHora} min</b> de espera/ventana.<br/><span class="opacity-70 text-xs">${mensaje}</span>`,
            status
        });
    }

    // C. Enfoque (Peso Promedio)
    const totalSCT = Object.values(creditosMap).reduce((sum, c) => sum + c, 0);
    if (ctx.ramos.length > 0 && totalSCT > 0) {
        const pesoPromedio = totalSCT / ctx.ramos.length;
        let perfil = 'Estándar';
        let desc = 'Tu carga combina asignaturas de distinto peso, requiriendo un balance normal.';
        let status: StatStatus = 'success';

        if (pesoPromedio < 4.0) {
            perfil = 'Fragmentado';
            desc = 'Mucha "challa". Tu enemigo será el desorden administrativo. Usa agenda.';
            status = 'warning';
        } else if (pesoPromedio > 5.2) {
            perfil = 'Denso';
            desc = 'Pocos ramos, pero "ladrillos". Un error cuesta caro; requiere profundidad.';
            status = 'warning';
        }

        out.push({
            icon: icons.Balance,
            label: STAT_LABELS.ENFOQUE,
            value: perfil,
            tooltip: `Promedio: ${pesoPromedio.toFixed(1)} créditos por ramo.<br/><span class="opacity-70 text-xs">${desc}</span>`,
            status
        });
    }

    // D. Estudio Autónomo
    const ramosSinSCT = Object.values(creditosMap).filter((c) => c === 0).length;
    if (totalSCT > 0 || ramosSinSCT > 0) {
        const horasTotalesSugeridasSemanal = (totalSCT * 27) / 17;
        const horasAutonomasDiarias = Math.max(0, horasTotalesSugeridasSemanal - minutesAula / 60) / 6;

        let status: StatStatus = 'success';
        let recomendacion = 'La carga estimada permite mantener un equilibrio adecuado.';
        let advertenciaDatos = '';

        if (ramosSinSCT > 0) {
            status = 'warning';
            advertenciaDatos = `<br/>Nota: Se detectaron ${ramosSinSCT} asignatura(s) sin información de créditos.`;
        }

        if (horasAutonomasDiarias > 5.5) {
            status = 'danger';
            recomendacion = 'Carga académica extrema. Riesgo alto de agotamiento.';
        } else if (horasAutonomasDiarias > 4.0) {
            status = 'warning';
            recomendacion = 'Carga elevada. Requiere planificación rigurosa de lunes a sábado.';
        }

        out.push({
            icon: icons.Book,
            label: STAT_LABELS.ESTUDIO_AUTONOMO,
            value: `${horasAutonomasDiarias.toFixed(1)} hrs/día`,
            tooltip: `Dedicación teórica fuera del aula (1 SCT = 27h). ${recomendacion}${advertenciaDatos}`,
            status
        });
    }

    return { items: out, minutesAula, minutesPermanencia };
}