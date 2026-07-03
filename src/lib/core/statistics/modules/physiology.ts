import { BLOQUE_COMIDA, BLOQUE_DURATION_MINUTES } from "$lib/constants/usm";
import Time from "$lib/helpers/time";
import { Días } from "../../ramos/types";
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

    // C. Nutrición (Logística de Colas) - LÓGICA REFINADA
    // Asumimos que BLOQUE_COMIDA es el bloque previo al salto protegido (ej: 8).
    // El salto protegido está implícitamente entre BLOQUE_COMIDA y BLOQUE_COMIDA + 1.
    const preAlmuerzo = BLOQUE_COMIDA;
    const postAlmuerzo = BLOQUE_COMIDA + 1;

    const diasSandwich: string[] = []; // Días apretados estándar
    const diasColapso: string[] = [];  // Miércoles apretados (Peak de filas)

    for (let d = 0; d <= 5; d++) {
        const bloquesDia = ctx.ramos.flatMap(r => r.horario).filter(b => b.dia === d).map(b => b.bloque);
        if (bloquesDia.length === 0) continue;

        const tienePre = bloquesDia.includes(preAlmuerzo);
        const tienePost = bloquesDia.includes(postAlmuerzo);

        // Caso "Sandwich": Clase justo antes y justo después del bloque protegido.
        // Esto te deja SOLO con la hora protegida (aprox 50-60 min) para salir, hacer fila, comer y volver.
        if (tienePre && tienePost) {
            // El Miércoles (índice 2) es históricamente el día de mayor congestión en casinos/kioscos.
            if (d === 2) {
                diasColapso.push(Días[d]);
            } else {
                diasSandwich.push(Días[d]);
            }
        }
    }

    if (diasColapso.length > 0) {
        // Prioridad alta: El miércoles es crítico
        const otrosDias = diasSandwich.length > 0 ? `, más ${diasSandwich.join(', ')}` : '';
        out.push({
            icon: icons.Fire, // Usamos fuego para denotar "Zona caliente/Tráfico"
            label: STAT_LABELS.NUTRICION,
            value: 'Casino Colapsado',
            tooltip: `El <b>Miércoles</b> tienes horario "Sandwich" justo en el peak semanal de filas.<br/><span class="opacity-70 text-xs">Dependerás exclusivamente del Bloque Protegido. Lleva almuerzo o prepárate para comer en 10 minutos.${otrosDias ? ` (También aplica para ${diasSandwich.join(', ')})` : ''}</span>`,
            status: 'warning' // Warning fuerte, pero no Danger porque "comer se puede".
        });
    } else if (diasSandwich.length > 0) {
        // Prioridad media: Días normales apretados
        out.push({
            icon: icons.FastFood,
            label: STAT_LABELS.NUTRICION,
            value: 'Almuerzo Express',
            tooltip: `Días con logística ajustada: <b>${diasSandwich.join(', ')}</b>.<br/><span class="opacity-70 text-xs">Tienes clases pegadas al bloque protegido. Considera filas de microondas o casino.</span>`,
            status: 'warning' // Warning suave (Amarillo)
        });
    } else {
        // Opcional: Feedback positivo si tiene holgura (ej: bloque 8 o 9 libre)
        // Esto refuerza la tranquilidad del usuario
        out.push({
            icon: icons.Leaf,
            label: STAT_LABELS.NUTRICION,
            value: 'Holgado',
            tooltip: 'Tienes bloques libres adyacentes al almuerzo. Puedes comer tranquilo.',
            status: 'success'
        });
    }

    return out;
}