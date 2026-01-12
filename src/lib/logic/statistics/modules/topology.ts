import { Días } from "$lib/types/horario";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";
import { calculateDailyMetrics } from "./utils";

const esBloqueFlexible = (tipo: string = '') => {
    const t = tipo.toUpperCase();
    return ['LAB', 'TAL', 'TER', 'LIN', 'PRA', 'AYU', 'TALLER'].some(x => t.includes(x));
};

// 2. TOPOLOGÍA DEL HORARIO (Forma, Intensidad, Fragmentación)
export function analyzeTopology(ctx: AnalyzerContext, creditosMap: Record<string, number>, icons: any): StatItem[] {
    const out: StatItem[] = [];
    const metrics = calculateDailyMetrics(ctx.ramos, creditosMap);

    // A. Fragmentación (Queso Suizo)
    let ventanasCortas = 0;
    for (const v of ctx.ventanas) {
        if (v.duraciónBloques === 1) ventanasCortas++;
    }

    // A.2. Compacidad Tóxica (Saturación Teórica)
    // Buscamos el día con la racha continua más larga de CÁTEDRA (Teoría pura)
    let maxRachaTeorica = 0;

    // Iteramos por día
    Object.entries(metrics).forEach(([d, m]) => {
        // Obtenemos los bloques con su tipo
        const bloquesDia = ctx.ramos.flatMap(r => r.horario.map(h => ({
            bloque: h.bloque,
            tipo: h.tipo || 'CAT'
        })))
            .filter(b => b.dia === Number(d))
            .sort((a, b) => a.bloque - b.bloque);

        if (bloquesDia.length === 0) return;

        let currentStreak = 0;

        // Inicializamos la racha solo si el primero es teórico
        if (!esBloqueFlexible(bloquesDia[0].tipo)) {
            currentStreak = 1;
        }

        for (let i = 0; i < bloquesDia.length - 1; i++) {
            const actual = bloquesDia[i];
            const siguiente = bloquesDia[i + 1];

            // 1. Verificamos continuidad temporal (bloques pegados)
            if (siguiente.bloque === actual.bloque + 1) {
                // 2. Verificamos continuidad del "Dolor" (Ambos deben ser Teóricos)
                // Si pasas de Cátedra a Taller, el Taller actúa como válvula de escape.
                if (!esBloqueFlexible(actual.tipo) && !esBloqueFlexible(siguiente.tipo)) {
                    currentStreak++;
                } else {
                    // Se rompió la racha de teoría (hubo un Lab/Taller entre medio o cambiamos a uno)
                    maxRachaTeorica = Math.max(maxRachaTeorica, currentStreak);
                    // Si el siguiente es teórico, reiniciamos racha en 1. Si es práctico, en 0.
                    currentStreak = !esBloqueFlexible(siguiente.tipo) ? 1 : 0;
                }
            } else {
                // Hubo una ventana de tiempo real
                maxRachaTeorica = Math.max(maxRachaTeorica, currentStreak);
                currentStreak = !esBloqueFlexible(siguiente.tipo) ? 1 : 0;
            }
        }
        maxRachaTeorica = Math.max(maxRachaTeorica, currentStreak);
    });

    // Si el horario es "demasiado" compacto en TEORÍA
    if (maxRachaTeorica >= 5) {
        out.push({
            icon: icons.Warning,
            label: STAT_LABELS.HORARIO,
            value: 'Asfixiante',
            tooltip: `Detectada racha de <b>${maxRachaTeorica} bloques teóricos</b> (Cátedras) consecutivos.<br/><span class="opacity-70 text-xs">A diferencia de un taller, aquí no hay espacio para pausas activas. Tu atención caerá en picada tras el 3er bloque.</span>`,
            status: 'danger'
        });
    } else if (ctx.ventanas.length === 0) {
        // Si es compacto pero no disparó la alerta de asfixia, es porque son Talleres o Labs (Compacto Sano)
        // O son pocas cátedras seguidas.
        out.push({
            icon: icons.Asterisk,
            label: STAT_LABELS.HORARIO,
            value: 'Compacto',
            tooltip: 'Jornada continua eficiente. Los bloques prácticos o laboratorios ayudan a mitigar la carga.',
            status: 'success'
        });
    }

    if (ventanasCortas > 0) {
        let status: StatStatus = 'warning';
        let valor = 'Moderada';
        let desc = 'Tu horario presenta algunas interrupciones breves.';

        if (ventanasCortas >= 3) {
            status = 'danger';
            valor = 'Queso Suizo';
            desc = `Tienes <b>${ventanasCortas} interrupciones de un solo bloque</b> (claves de ~40-70 min).`;
        }

        out.push({
            icon: icons.Circles,
            label: STAT_LABELS.FRAGMENTACION,
            value: valor,
            tooltip: `${desc}<br/><span class="opacity-70 text-xs">Este tiempo suele perderse en filas y traslados, impidiendo el estudio profundo (Deep Work).</span>`,
            status
        });
    }

    // B. Perfil de Carga (Front/Back loaded)
    let cargaTotal = 0;
    let cargaLunesMartes = 0;
    let cargaJuevesViernes = 0;

    Object.entries(metrics).forEach(([d, m]) => {
        const dia = Number(d);
        if (dia <= 4) { // L-V
            cargaTotal += m.carga;
            if (dia === 0 || dia === 1) cargaLunesMartes += m.carga;
            if (dia === 3 || dia === 4) cargaJuevesViernes += m.carga;
        }
    });

    if (cargaTotal > 0) {
        const pctFront = cargaLunesMartes / cargaTotal;
        const pctBack = cargaJuevesViernes / cargaTotal;

        if (pctBack > 0.55) {
            out.push({
                icon: icons.Weight,
                label: STAT_LABELS.PERFIL_CARGA,
                value: 'Viernes Pesado',
                tooltip: `El <b>${(pctBack * 100).toFixed(0)}%</b> de tu carga ponderada está en Jueves/Viernes.<br/><span class="opacity-70 text-xs">Llegarás con fatiga acumulada. Requiere resistencia.</span>`,
                status: 'warning'
            });
        } else if (pctFront > 0.60) {
            out.push({
                icon: icons.Weight,
                label: STAT_LABELS.PERFIL_CARGA,
                value: 'Front-loaded',
                tooltip: `El <b>${(pctFront * 100).toFixed(0)}%</b> de tu carga está en Lunes/Martes.<br/><span class="opacity-70 text-xs">Ideal para usar la energía del fin de semana, pero exige disciplina inmediata.</span>`,
                status: 'success'
            });
        }
    }

    // C. Intensidad (Zen vs Hardcore)
    const diasCalculados = Object.entries(metrics)
        .map(([d, m]) => m.bloques > 0 ? { dia: Number(d), carga: m.carga, score: m.carga + (m.carga / m.bloques) } : null)
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .sort((a, b) => a.score - b.score);

    if (diasCalculados.length > 1) {
        const ligero = diasCalculados[0];
        const pesado = diasCalculados[diasCalculados.length - 1];
        const diff = pesado.score - ligero.score;

        if (diff >= 1.5) {
            out.push({
                icon: icons.Leaf,
                label: STAT_LABELS.BAJA_CARGA,
                value: `${Días[ligero.dia]}`,
                tooltip: `Tu día más liviano (Carga ponderada: ${ligero.carga.toFixed(1)}).`
            });

            if (diff >= 3.0) {
                out.push({
                    icon: icons.Fire,
                    label: STAT_LABELS.ALTA_INTENSIDAD,
                    value: `${Días[pesado.dia]}`,
                    tooltip: `Tu día de mayor exigencia (Carga ponderada: ${pesado.carga.toFixed(1)}).<br/><span class="opacity-70 text-xs">Alta concentración de dificultad y densidad horaria.</span>`
                });
            }
        }
    }

    return out;
}