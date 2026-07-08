import { getSubjectWeight } from "$lib/constants/usm";
import type { Ramo } from "$lib/core/ramos/types";
import { Data } from "$lib/data/data.svelte";

/**
 * Calculates aggregated daily metrics ensuring overlapping blocks (conflicts) 
 * do not artificially inflate cognitive load or block counts.
 */
export function calculateDailyMetrics(ramos: Ramo[], creditosMap: Record<string, number>) {
    const metrics: Record<number, { carga: number; bloques: number }> = {
        0: { carga: 0, bloques: 0 }, 1: { carga: 0, bloques: 0 }, 2: { carga: 0, bloques: 0 },
        3: { carga: 0, bloques: 0 }, 4: { carga: 0, bloques: 0 }, 5: { carga: 0, bloques: 0 }
    };

    // 1. Calculate block-level distributed load for each subject
    const blockLoads: Record<string, number> = {};
    for (const ramo of ramos) {
        const creditos = creditosMap[ramo.sigla] || 0;
        const weightMultiplier = getSubjectWeight(ramo.sigla);
        const totalCarga = creditos * weightMultiplier;
        const totalBlocks = ramo.horario.length;

        blockLoads[ramo.sigla] = totalBlocks > 0 ? (totalCarga / totalBlocks) : 0;
    }

    // 2. Map blocks per day to handle potential overlaps safely
    for (let d = 0; d <= 5; d++) {
        const dayBlocksMap = new Map<number, number[]>(); // Tracks all loads present in a specific block index

        for (const ramo of ramos) {
            const blocksToday = ramo.horario.filter((b) => b.dia === d);
            for (const b of blocksToday) {
                if (!dayBlocksMap.has(b.bloque)) {
                    dayBlocksMap.set(b.bloque, []);
                }
                dayBlocksMap.get(b.bloque)!.push(blockLoads[ramo.sigla]);
            }
        }

        // 3. Aggregate without double-counting: only unique blocks are tallied.
        // In case of a conflict, the student only absorbs the maximum cognitive load present.
        metrics[d].bloques = dayBlocksMap.size;

        let dailyLoad = 0;
        dayBlocksMap.forEach((loads) => {
            dailyLoad += Math.max(...loads);
        });

        metrics[d].carga = dailyLoad;
    }

    return metrics;
}

export function getDatosCurriculares(sigla: string) {
    const carreras = Data.cachedCarreras;
    for (const carrera of carreras) {
        for (const mención of Object.values(carrera['menciones/especialidades'])) {
            for (const plan of Object.values(mención.planes)) {
                const nivel = plan.malla.findIndex((semestre) => semestre[sigla]);
                if (nivel !== -1) {
                    return {
                        nivel: nivel + 1,
                        info: plan.malla[nivel][sigla],
                        carrera: carrera.nombre
                    };
                }
            }
        }
    }
    return null;
}