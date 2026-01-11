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

    // B. Sobrecarga Continua vs Inmersión (LÓGICA REFINADA)
    let maxStreakBloques = 0;
    // CAMBIO 1: En vez de booleano, guardamos cuántos ramos distintos componen la racha
    let maxStreakUniqueCount = 0;
    let detectedMainName = '';

    for (let d = 0; d <= 5; d++) {
        const bloquesDia = ctx.ramos
            .flatMap(r => r.horario.map(h => ({ ...h, sigla: r.sigla }))) //
            .filter(b => b.dia === d)
            .sort((a, b) => a.bloque - b.bloque);

        if (bloquesDia.length === 0) continue;

        let currentStreak = 1;
        let currentSiglas = new Set<string>([bloquesDia[0].sigla]);

        for (let i = 0; i < bloquesDia.length - 1; i++) {
            const actual = bloquesDia[i];
            const siguiente = bloquesDia[i + 1];

            const esContinuo = siguiente.bloque === actual.bloque + 1;
            const saltaAlmuerzo = actual.bloque === 8 && siguiente.bloque === 9;

            if (esContinuo && (!saltaAlmuerzo || actual.sigla === siguiente.sigla)) {
                currentStreak++;
                currentSiglas.add(siguiente.sigla);
            } else {
                checkStreak(currentStreak, currentSiglas);
                currentStreak = 1;
                currentSiglas = new Set<string>([siguiente.sigla]);
            }
        }
        checkStreak(currentStreak, currentSiglas);
    }

    function checkStreak(length: number, siglas: Set<string>) {
        if (length > maxStreakBloques) {
            maxStreakBloques = length;
            maxStreakUniqueCount = siglas.size; // Guardamos cuántos ramos únicos hay en la racha
            if (siglas.size === 1) {
                detectedMainName = [...siglas][0];
            }
        }
    }

    // Reportar resultados (LÓGICA TRI-ESTADO)
    if (maxStreakBloques >= 5) {
        const hrs = (maxStreakBloques * BLOQUE_DURATION_MINUTES) / 60;

        // CASO 1: Inmersión (1 solo ramo) - Taller/Lab
        if (maxStreakUniqueCount === 1) {
            out.push({
                icon: icons.Category,
                label: STAT_LABELS.IMMERSION,
                value: `${hrs.toFixed(1)} hrs Taller`,
                tooltip: `Se detectó un bloque extendido de <b>${detectedMainName}</b> (${maxStreakBloques} bloques).<br/><span class="opacity-70 text-xs">Al ser una única asignatura, se considera una jornada de taller o laboratorio práctico.</span>`,
                status: 'success'
            });
        }
        // CASO 2: Jornada Dual (2 Ramos) - Cansado pero Enfocado (TU CASO)
        else if (maxStreakUniqueCount === 2) {
            out.push({
                icon: icons.Weight, // Icono de peso/carga física
                label: STAT_LABELS.SOBRECARGA_CONTINUA,
                value: 'Extensa', // No "Sobrecarga", sino "Extensa"
                tooltip: `Tienes <b>${hrs.toFixed(1)} horas seguidas</b> divididas en solo 2 asignaturas.<br/><span class="opacity-70 text-xs">Aunque el cambio de contexto es bajo (bueno), el agotamiento físico será alto. Camina en los recreos.</span>`,
                status: 'warning' // Amarillo, no Rojo
            });
        }
        // CASO 3: Maratón Fragmentada (3+ Ramos) - Peligro Cognitivo
        else {
            let status: StatStatus = 'warning';
            if (maxStreakBloques >= 6) status = 'danger';

            out.push({
                icon: icons.Run,
                label: STAT_LABELS.SOBRECARGA_CONTINUA,
                value: `${hrs.toFixed(1)} hrs seguidas`,
                tooltip: `Maratón de <b>${maxStreakBloques} bloques</b> con ${maxStreakUniqueCount} asignaturas distintas.<br/><span class="opacity-70 text-xs">El alto "Coste de Cambio de Contexto" generará fatiga cognitiva severa.</span>`,
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