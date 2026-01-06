import { BLOQUE_DURATION_MINUTES, getSubjectWeight } from "$lib/constants/usm";
import { Días } from "$lib/types/horario";
import { STAT_LABELS, type AnalyzerContext, type StatItem, type StatStatus } from "../types";

// 5. ESTRATEGIA ACADÉMICA (Saturación, Demanda)
export function analyzeAcademicStrategy(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];

    // A. Saturación Temática (Bloques de Muerte - Ramos pesados consecutivos)
    for (let d = 0; d <= 5; d++) {
        // Bloques del día ordenados con su sigla
        const bloquesObj = ctx.ramos.flatMap(r => r.horario.map(h => ({ ...h, sigla: r.sigla })))
            .filter(b => b.dia === d)
            .sort((a, b) => a.bloque - b.bloque);

        let hardStreak = 0;
        let lastBloque = -1;

        for (const b of bloquesObj) {
            const peso = getSubjectWeight(b.sigla);
            const esDuro = peso >= 1.4; // Heurística: Ramos pesados

            if (esDuro) {
                if (lastBloque === -1 || b.bloque === lastBloque + 1) {
                    hardStreak++;
                } else {
                    hardStreak = 1; // Reiniciar racha
                }
            } else {
                hardStreak = 0;
            }
            lastBloque = b.bloque;

            if (hardStreak >= 3) {
                out.push({
                    icon: icons.Brain,
                    label: STAT_LABELS.SATURACION,
                    value: `Crítica (${Días[d]})`,
                    tooltip: `El ${Días[d]} tienes <b>3+ bloques consecutivos</b> de alta carga cognitiva.<br/><span class="opacity-70 text-xs">La atención técnica disminuye drásticamente tras 90 min sin cambio de contexto. Considera intercalar un ramo humanista.</span>`,
                    status: 'danger'
                });
                break; // Una alerta por día basta
            }
        }
    }

    // B. Sobrecarga Continua vs Inmersión (Detección de Talleres)
    // Buscamos rachas largas, pero distinguimos si son varios ramos (agotador) o uno solo (taller).

    let maxStreakBloques = 0;
    let isTallerStreak = false; // Flag para saber si la racha más larga es un taller
    let detectedTallerName = '';

    for (let d = 0; d <= 5; d++) {
        // Obtenemos bloques con metadata para identificar el ramo
        const bloquesDia = ctx.ramos
            .flatMap(r => r.horario.map(h => ({ ...h, sigla: r.sigla })))
            .filter(b => b.dia === d)
            .sort((a, b) => a.bloque - b.bloque);

        if (bloquesDia.length === 0) continue;

        // Algoritmo de detección de rachas
        let currentStreak = 1;
        let currentSiglas = new Set<string>([bloquesDia[0].sigla]);

        for (let i = 0; i < bloquesDia.length - 1; i++) {
            const actual = bloquesDia[i];
            const siguiente = bloquesDia[i + 1];

            // Continuidad: Siguiente es el bloque inmediatamente posterior (y no es el corte de almuerzo 8-9)
            // NOTA: Si es el MISMO ramo, a veces el corte de almuerzo es irrelevante para considerarlo "Taller de todo el día"
            // pero mantendremos la lógica de corte de almuerzo para ser conservadores, salvo que sea la misma sigla.

            const esContinuo = siguiente.bloque === actual.bloque + 1;
            const saltaAlmuerzo = actual.bloque === 8 && siguiente.bloque === 9; // En USM bloque 8 termina 15:40, 9 empieza 15:50 (o similar según sede).

            // Si es continuo (incluyendo salto de almuerzo si es el mismo ramo, para detectar 'Jornada')
            if (esContinuo && (!saltaAlmuerzo || actual.sigla === siguiente.sigla)) {
                currentStreak++;
                currentSiglas.add(siguiente.sigla);
            } else {
                // Fin de la racha actual, evaluamos
                checkStreak(currentStreak, currentSiglas);
                // Reiniciar
                currentStreak = 1;
                currentSiglas = new Set<string>([siguiente.sigla]);
            }
        }
        // Check final del día
        checkStreak(currentStreak, currentSiglas);
    }

    function checkStreak(length: number, siglas: Set<string>) {
        if (length > maxStreakBloques) {
            maxStreakBloques = length;
            // Si la racha es larga y solo tiene 1 sigla, es un Taller/Lab
            if (siglas.size === 1) {
                isTallerStreak = true;
                detectedTallerName = [...siglas][0]; // Guardamos la sigla
            } else {
                isTallerStreak = false;
            }
        }
    }

    // Reportar resultados
    if (maxStreakBloques >= 5) {
        const hrs = (maxStreakBloques * BLOQUE_DURATION_MINUTES) / 60;

        if (isTallerStreak) {
            // CASO: Taller / Laboratorio (Mismo ramo > 5 bloques) -> Info/Success
            out.push({
                icon: icons.Category, // Icono visual de "Bloque sólido"
                label: STAT_LABELS.IMMERSION, // Nuevo Label
                value: `${hrs.toFixed(1)} hrs Taller`,
                tooltip: `Se detectó un bloque extendido de <b>${detectedTallerName}</b> (${maxStreakBloques} bloques).<br/><span class="opacity-70 text-xs">Al ser una única asignatura, se considera una jornada de taller o laboratorio práctico donde el ritmo suele ser diferente a una cátedra continua.</span>`,
                status: 'success' // O 'null' si prefieres neutro, pero success indica que "está bien, no es error"
            });
        } else {
            // CASO: Maratón (Varios ramos) -> Danger
            let status: StatStatus = 'warning';
            if (maxStreakBloques >= 6) status = 'danger';

            out.push({
                icon: icons.Run,
                label: STAT_LABELS.SOBRECARGA_CONTINUA,
                value: `${hrs.toFixed(1)} hrs seguidas`,
                tooltip: `Maratón de <b>${maxStreakBloques} bloques</b> de distintas asignaturas sin pausas reales.<br/><span class="opacity-70 text-xs">Cambiar de contexto tantas veces seguidas sin descanso genera fatiga cognitiva severa.</span>`,
                status
            });
        }
    }

    // C. Demanda de Cupos (Prioridad)
    const bloquesPrime = [5, 6, 7, 8, 9, 10]; // 10:00 - 15:00
    let cargaPrime = 0;
    let totalBloques = 0;
    ctx.ramos.forEach(r => r.horario.forEach(h => {
        totalBloques++;
        if (bloquesPrime.includes(h.bloque)) cargaPrime++;
    }));

    if (totalBloques > 0 && (cargaPrime / totalBloques) > 0.6) {
        out.push({
            icon: icons.Ticket,
            label: STAT_LABELS.DEMANDA,
            value: 'Alta',
            tooltip: `Gran parte de tu horario ocupa bloques "Prime" (10:00 - 15:00).<br/><span class="opacity-70 text-xs">Estas secciones son las primeras en llenarse. Si tu Prioridad Académica no es alta, ten listo un Plan B.</span>`,
            status: 'warning'
        });
    }

    return out;
}