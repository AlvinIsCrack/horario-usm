import { BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { Días } from "../../ramos/types";
import { type AnalyzerContext, type StatItem, STAT_LABELS } from "../types";

// 3. LOGÍSTICA Y REALIDAD FÍSICA (Transporte, ROC, Seguridad Invernal)
export function analyzeLogistics(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];
    const esInvierno = ctx.semestre.includes('1') || ctx.semestre.toLowerCase().includes('primer');

    // Detectamos si es una sede con tráfico pesado urbano (Santiago/Valpo)
    const esSedeUrbana = ['San Joaquín', 'Valparaíso', 'Casa Central', 'Vitacura'].some(s => ctx.sede.includes(s));

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

    // B. Hora Punta vs Valle - LÓGICA SANTIAGO/URBANA AJUSTADA
    let diasHoraPunta = 0;
    let diasValle = 0;
    for (let d = 0; d <= 5; d++) {
        const bloques = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloques.length === 0) continue;

        const inicio = Math.min(...bloques);
        const fin = Math.max(...bloques);

        // Definición de Punta para Sede Urbana (San Joaquín/Casa Central):
        // AM: Entrar Bloque 1 o 2 (Viajar entre 7:00 - 9:00)
        // PM: Salir Bloque 10 o superior (Estar en la calle a las 17:30+)
        // Nota: Bloque 10 termina aprox 17:15. Salir ahí ya roza el inicio del peak.
        const esPuntaAM = inicio <= 2;
        const esPuntaPM = fin >= 10;

        if (esPuntaAM || esPuntaPM) {
            diasHoraPunta++;
        } else if (inicio >= 3 && fin <= 9) {
            // Entrar después de las 11:00 y salir antes de las 16:00
            diasValle++;
        }
    }

    if (diasHoraPunta >= 2) {
        out.push({
            icon: icons.Bus,
            label: STAT_LABELS.TRANSPORTE,
            value: 'Hora Punta',
            tooltip: `Tus horarios coinciden con el peak de congestión (Entrada 8:15/9:35 o Salida >17:15).<br/><span class="opacity-70 text-xs">En San Joaquín/Valpo esto aumenta el tiempo de viaje drásticamente.</span>`,
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

    // C. Seguridad (Se mantiene igual, solo ajustando el tooltip si quieres)
    const HORA_OSCURIDAD = 18 * 60 + 40;
    const HORA_LIMITE_CASA = 21 * 60;

    for (let d = 0; d <= 5; d++) {
        const bloques = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloques.length === 0) continue;

        const maxB = Math.max(...bloques);
        const salida = Time.bloqueToMinutes(maxB) + BLOQUE_DURATION_MINUTES;
        const llegada = salida + ctx.tiempoTraslado;

        if (esInvierno && esSedeUrbana && salida > HORA_OSCURIDAD) {
            out.push({
                icon: icons.Moon,
                label: STAT_LABELS.SEGURIDAD,
                value: `Salida Noche (${Días[d]})`,
                tooltip: `Alerta: El ${Días[d]} sales de noche (~18:40).<br/><span class="opacity-70 text-xs">Precaución en paraderos y entorno del campus.</span>`,
                status: 'warning'
            });
        }

        if (llegada > HORA_LIMITE_CASA) {
            const hh = Math.floor(llegada / 60);
            const mm = llegada % 60;
            out.push({
                icon: icons.Warning,
                label: STAT_LABELS.SEGURIDAD,
                value: 'Llegada Tarde',
                tooltip: `El ${Días[d]} llegarías a casa cerca de las <b>${hh}:${mm.toString().padStart(2, '0')}</b>.`,
                status: 'warning'
            });
        }
    }

    return out;
}