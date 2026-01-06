import { getSubjectWeight } from "$lib/constants/usm";
import { Data } from "$lib/data/data.svelte";
import type { Ramo } from "$lib/types/horario";

export function calculateDailyMetrics(ramos: Ramo[], creditosMap: Record<string, number>) {
    const metrics: Record<number, { carga: number; bloques: number }> = {
        0: { carga: 0, bloques: 0 }, 1: { carga: 0, bloques: 0 }, 2: { carga: 0, bloques: 0 },
        3: { carga: 0, bloques: 0 }, 4: { carga: 0, bloques: 0 }, 5: { carga: 0, bloques: 0 }
    };

    for (const ramo of ramos) {
        const creditos = creditosMap[ramo.sigla] || 0;
        const weightMultiplier = getSubjectWeight(ramo.sigla);
        const cargaReal = creditos * weightMultiplier;

        const diasRamo = new Set(ramo.horario.map((b) => b.dia));
        diasRamo.forEach((d) => {
            if (metrics[d]) metrics[d].carga += cargaReal;
        });
        ramo.horario.forEach((b) => {
            if (metrics[b.dia]) metrics[b.dia].bloques++;
        });
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