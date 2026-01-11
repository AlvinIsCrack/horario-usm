import { Días } from "$lib/types/horario";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";
import { calculateDailyMetrics } from "./utils";

// 2. TOPOLOGÍA DEL HORARIO (Forma, Intensidad, Fragmentación)
export function analyzeTopology(ctx: AnalyzerContext, creditosMap: Record<string, number>, icons: any): StatItem[] {
    const out: StatItem[] = [];
    const metrics = calculateDailyMetrics(ctx.ramos, creditosMap);

    // A. Fragmentación (Queso Suizo)
    let ventanasCortas = 0;
    for (const v of ctx.ventanas) {
        if (v.duraciónBloques === 1) ventanasCortas++;
    }

    // A.2. Compacidad Tóxica (La vejiga no perdona)
    // Buscamos el día con la racha continua más larga SIN ventanas intermedias
    let maxRachaSinRecreo = 0;

    // Iteramos por día para ver "ladrillos" sólidos
    Object.entries(metrics).forEach(([d, m]) => {
        // Obtenemos los bloques del día ordenados
        const bloquesDia = ctx.ramos.flatMap(r => r.horario)
            .filter(b => b.dia === Number(d))
            .map(b => b.bloque)
            .sort((a, b) => a - b);

        if (bloquesDia.length === 0) return;

        let currentStreak = 1;
        for (let i = 0; i < bloquesDia.length - 1; i++) {
            // Si son consecutivos (ej: 3 y 4) sumamos. 
            // Si hay un salto (ej: 4 y 6), se rompe la racha.
            if (bloquesDia[i + 1] === bloquesDia[i] + 1) {
                currentStreak++;
            } else {
                maxRachaSinRecreo = Math.max(maxRachaSinRecreo, currentStreak);
                currentStreak = 1;
            }
        }
        maxRachaSinRecreo = Math.max(maxRachaSinRecreo, currentStreak);
    });

    // Si el horario es "demasiado" compacto
    if (maxRachaSinRecreo >= 5) {
        // Reemplazamos o agregamos sobre el status de "Compacto"
        // Nota: Esto podría coexistir con "Compacto", pero es una advertencia de salud.
        out.push({
            icon: icons.Warning, // O un icono de batería baja
            label: STAT_LABELS.HORARIO,
            value: 'Asfixiante',
            tooltip: `Tienes una racha de <b>${maxRachaSinRecreo} bloques seguidos</b> sin ni una sola ventana.<br/><span class="opacity-70 text-xs">La eficiencia es buena, pero ojo con la ausencia de una ventana estratégica.</span>`,
            status: 'danger'
        });
    } else if (ctx.ventanas.length === 0) {
        // (Tu código original de Compacto Success se mantiene aquí como else)
        out.push({
            icon: icons.Asterisk,
            label: STAT_LABELS.HORARIO,
            value: 'Compacto',
            tooltip: 'Sin tiempos muertos entre bloques. Máxima eficiencia de tiempo.',
            status: 'success'
        });
    }

    if (ventanasCortas > 0) {
        let status: StatStatus = 'warning';
        let valor = 'Moderada';
        let desc = 'Tu horario presenta algunas interrupciones breves.';

        if (ventanasCortas >= 3) {
            status = 'danger';
            valor = 'Queso Suizo'; // Alta fragmentación
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