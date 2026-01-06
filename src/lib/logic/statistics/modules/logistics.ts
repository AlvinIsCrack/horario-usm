import { BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { Días } from "$lib/types/horario";
import { type AnalyzerContext, type StatItem, STAT_LABELS } from "../types";

// 3. LOGÍSTICA Y REALIDAD FÍSICA (Transporte, ROC, Seguridad Invernal)
export function analyzeLogistics(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];
    const esInvierno = ctx.semestre.includes('1') || ctx.semestre.toLowerCase().includes('primer');
    const esSedeRiesgosa = ['San Joaquín', 'Valparaíso', 'Casa Central'].some(s => ctx.sede.includes(s));
    const tiempoViajeTotal = ctx.tiempoTraslado * 2;

    // A. Costo de Activación (ROC)
    for (let d = 0; d <= 5; d++) {
        const bloquesDia = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d);
        if (bloquesDia.length === 0) continue;

        const unicos = new Set(bloquesDia.map(b => b.bloque)).size;
        const minutosAulaDia = unicos * BLOQUE_DURATION_MINUTES;

        // Si viajas más del doble de lo que estás en clases
        if (minutosAulaDia > 0 && tiempoViajeTotal > minutosAulaDia) {
            out.push({
                icon: icons.Run,
                label: STAT_LABELS.ACTIVACION,
                value: `Ineficiente (${Días[d]})`,
                tooltip: `El ${Días[d]} inviertes <b>${(tiempoViajeTotal / 60).toFixed(1)}h</b> en transporte para solo <b>${(minutosAulaDia / 60).toFixed(1)}h</b> de clases.<br/><span class="opacity-70 text-xs">"Retorno de Inversión" negativo. Considera paralelos online.</span>`,
                status: 'danger'
            });
        }
    }

    // B. Hora Punta vs Valle
    let diasHoraPunta = 0;
    let diasValle = 0;
    for (let d = 0; d <= 5; d++) {
        const bloques = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloques.length === 0) continue;

        const inicio = Math.min(...bloques);
        const fin = Math.max(...bloques);

        // Punta PM y AM
        if ((fin >= 11 && fin <= 16) || (inicio <= 2)) {
            diasHoraPunta++;
        } else if (inicio >= 3 && fin <= 10) {
            diasValle++;
        }
    }

    if (diasHoraPunta >= 2) {
        out.push({
            icon: icons.Bus, // Icono Transporte
            label: STAT_LABELS.TRANSPORTE,
            value: 'Hora Punta',
            tooltip: `Tus horarios coinciden frecuentemente con el peak de congestión.<br/><span class="opacity-70 text-xs">El tiempo de viaje podría aumentar un 30-40% respecto al promedio.</span>`,
            status: 'warning'
        });
    } else if (diasValle >= 3) {
        out.push({
            icon: icons.Bus,
            label: STAT_LABELS.TRANSPORTE,
            value: 'Horario Valle',
            tooltip: `Tus horarios evitan los peaks de congestión, permitiendo viajes más rápidos.`,
            status: 'success'
        });
    }

    // C. Seguridad Dinámica (Invierno/Noche) y Llegada Tarde
    const HORA_OSCURIDAD = 18 * 60 + 40; // 18:40
    const HORA_LIMITE_CASA = 21 * 60; // 21:00

    for (let d = 0; d <= 5; d++) {
        const bloques = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloques.length === 0) continue;

        const maxB = Math.max(...bloques);
        const salida = Time.bloqueToMinutes(maxB) + BLOQUE_DURATION_MINUTES;
        const llegada = salida + ctx.tiempoTraslado;

        // Salida Noche (Invierno)
        if (esInvierno && esSedeRiesgosa && salida > HORA_OSCURIDAD) {
            out.push({
                icon: icons.Moon,
                label: STAT_LABELS.SEGURIDAD,
                value: `Salida Noche (${Días[d]})`,
                tooltip: `Alerta de Invierno: El ${Días[d]} sales de noche (~18:40).<br/><span class="opacity-70 text-xs">Considera la seguridad del entorno de tu campus.</span>`,
                status: 'warning'
            });
        }

        // Llegada Tarde
        if (llegada > HORA_LIMITE_CASA) {
            const hh = Math.floor(llegada / 60);
            const mm = llegada % 60;
            let tt = `El ${Días[d]} llegarías a casa cerca de las <b>${hh}:${mm.toString().padStart(2, '0')}</b>.`;
            if (ctx.esTiempoEstimado) tt += `<br/><br/>⚠️ <b>Certeza limitada:</b> Basado en estimación genérica de traslado.`;

            out.push({
                icon: icons.Warning,
                label: STAT_LABELS.SEGURIDAD,
                value: 'Llegada Tarde',
                tooltip: tt,
                status: 'warning'
            });
        }
    }

    return out;
}