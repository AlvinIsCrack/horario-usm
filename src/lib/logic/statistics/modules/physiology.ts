import { BLOQUE_COMIDA, BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { Días } from "$lib/types/horario";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";


// 4. FISIOLOGÍA SANSANA (Sueño, Nutrición, Regularidad)
export function analyzePhysiology(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];

    // A. Sueño: Horas Disponibles (Jetlag Social)
    let minTiempoLibre = 24 * 60;
    const TIEMPO_LOGISTICA = ctx.tiempoTraslado * 2 + 60; // Viajes + Rutina

    for (let d = 0; d < 4; d++) {
        const hoy = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        const manana = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d + 1).map(b => b.bloque);

        if (hoy.length && manana.length) {
            const finHoy = Time.bloqueToMinutes(Math.max(...hoy)) + BLOQUE_DURATION_MINUTES;
            const iniManana = Time.bloqueToMinutes(Math.min(...manana));
            const brecha = 1440 - finHoy + iniManana;
            if (brecha < minTiempoLibre) minTiempoLibre = brecha;
        }
    }

    const sueñoDisponible = minTiempoLibre - TIEMPO_LOGISTICA;
    if (sueñoDisponible < 450) { // < 7.5h
        let status: StatStatus = 'warning';
        let msg = `Considerando traslados, tu ventana real de sueño es de <b>${(sueñoDisponible / 60).toFixed(1)} hrs</b>.`;
        if (ctx.esTiempoEstimado) msg += `<br/><br/>⚠️ <b>Nota:</b> Dato estimado (traslado no informado).`;

        if (sueñoDisponible < 360) {
            status = 'danger';
            msg = `<b>Alerta Crítica:</b> Menos de 6 horas para dormir. Riesgo alto.` + (ctx.esTiempoEstimado ? ' (Estimado)' : '');
        }

        out.push({
            icon: icons.Moon,
            label: STAT_LABELS.RECUPERACIÓN_TRANSLADO,
            value: `${(sueñoDisponible / 60).toFixed(1)} hrs netas`,
            tooltip: msg,
            status
        });
    }

    // B. Sueño: Estabilidad (Varianza del Despertar)
    const inicios: number[] = [];
    for (let d = 0; d <= 5; d++) {
        const bloques = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloques.length) inicios.push(Time.bloqueToMinutes(Math.min(...bloques)));
    }

    if (inicios.length > 2) {
        const minInicio = Math.min(...inicios);
        const maxInicio = Math.max(...inicios);
        const deltaHoras = (maxInicio - minInicio) / 60;

        if (deltaHoras >= 3) {
            out.push({
                icon: icons.Resting,
                label: STAT_LABELS.SUEÑO,
                value: 'Inestable',
                tooltip: `Tu hora de entrada varía <b>${deltaHoras.toFixed(1)} horas</b> entre días.<br/><span class="opacity-70 text-xs">Esta varianza dificulta crear un hábito de sueño estable y genera sensación de cansancio ("Jetlag Social"). Intenta anclar tu despertar.</span>`,
                status: 'warning'
            });
        }
    }

    // C. Nutrición (Ventana Ajustada)
    const bloquesAlmuerzo = [BLOQUE_COMIDA, BLOQUE_COMIDA + 1].filter(b => b !== undefined);
    const diasSinAlmuerzo: string[] = [];
    const diasAjustados: string[] = [];

    for (let d = 0; d <= 5; d++) {
        const bloquesDia = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloquesDia.length === 0) continue;

        const ocupados = bloquesAlmuerzo.filter(b => bloquesDia.includes(b)).length;
        if (ocupados === bloquesAlmuerzo.length) {
            diasSinAlmuerzo.push(Días[d]);
        } else if (ocupados > 0) {
            diasAjustados.push(Días[d]);
        }
    }

    if (diasSinAlmuerzo.length > 0) {
        out.push({
            icon: icons.Fire,
            label: STAT_LABELS.NUTRICION,
            value: 'Sin Ventana',
            tooltip: `Días críticos: <b>${diasSinAlmuerzo.join(', ')}</b> sin bloque protegido.<br/><span class="opacity-70 text-xs">Riesgo de malnutrición o hipoglucemia funcional.</span>`,
            status: 'danger'
        });
    } else if (diasAjustados.length > 0) {
        out.push({
            icon: icons.FastFood,
            label: STAT_LABELS.NUTRICION,
            value: 'Ajustada',
            tooltip: `Días apretados: <b>${diasAjustados.join(', ')}</b>.<br/><span class="opacity-70 text-xs">Solo un bloque libre. Entre filas y traslados, te quedarán ~20 min efectivos para comer.</span>`,
            status: 'warning'
        });
    }

    return out;
}