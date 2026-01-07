import planesRaw from '$lib/data/planes_carreras.json';
import type { Malla } from './types';

// Nombres personalizados para planes específicos
export const PLAN_CUSTOM_NAMES: Record<string, string> = {
    '7313': 'Ing. Civil Informática (Antigua)',
    '7310': 'Ing. Civil Informática (Nueva)'
};

/**
 * Busca y formatea la malla curricular desde el JSON crudo
 */
export function fetchMallaData(planId: string): Malla {
    if (!planId) return [];

    for (const carrera of planesRaw) {
        for (const sedeKey in carrera['menciones/especialidades'] || {}) {
            // @ts-ignore
            const planes = carrera['menciones/especialidades'][sedeKey]?.planes;

            if (planes && planes[planId]) {
                return (planes[planId].malla || []).map((sem: any) =>
                    Object.entries(sem)
                        .map(([sigla, d]: [string, any]) => ({
                            sigla,
                            nombre: d.nombre,
                            creditos: parseInt(d.creditos) || 0,
                            requisitos: d.requisitos || [],
                            esElectivo: /ELECTIVO [IVXCMD]+|ELECTIVO DE|OPTATIVO|ASIGNATURA LIBRE/gi.test(d.nombre),
                            esHumanista: /HUMANIST|ANTROPOL|ETICA/gi.test(d.nombre)
                        }))
                        .sort((a, b) => {
                            const isSpecialA = a.esElectivo || a.esHumanista;
                            const isSpecialB = b.esElectivo || b.esHumanista;
                            if (isSpecialA !== isSpecialB) return isSpecialA ? 1 : -1;
                            return a.sigla.localeCompare(b.sigla);
                        })
                );
            }
        }
    }
    return [];
}

/**
 * Genera las opciones para el selector de carreras
 */
export function getCareerOptions(sedeActual: string, jornadaActual: string) {
    const opts: { label: string; value: string; plan: string; }[] = [];
    const seenIds = new Set<string>();

    planesRaw.forEach((carrera) => {
        // CAMBIO: Validación inicial. Si no tiene nombre o es inválida, se salta.
        if (!carrera || !carrera.nombre) return;

        const menciones = carrera['menciones/especialidades'] || {};

        Object.keys(menciones).forEach((sedeKey) => {
            if (carrera.sede !== sedeActual) return;
            if (carrera.jornada !== jornadaActual) return;

            // @ts-ignore
            const mencion = menciones[sedeKey];

            // CAMBIO: Verificamos que la mención y sus planes existan
            if (!mencion?.planes) return;

            Object.entries(mencion.planes).forEach(([id, plan]: [string, any]) => {
                // CAMBIO: Filtramos si no tiene malla, si la malla está vacía (length 0), o si ya la vimos
                if (!plan?.malla || (Array.isArray(plan.malla) && plan.malla.length === 0) || seenIds.has(id)) {
                    return;
                }

                seenIds.add(id);

                const planCode = plan.plan?.toString();
                const customLabel = PLAN_CUSTOM_NAMES[planCode];

                opts.push({
                    // CAMBIO: El label ahora solo contiene el nombre y mención. El plan va solo en el valor o se extrae luego.
                    label: customLabel || `${carrera.nombre}${mencion.nombre === 'Sin mención' ? '' : ' - ' + mencion.nombre}`,
                    value: id,
                    plan: plan.plan // Asegúrate de pasar el código del plan en el objeto si es posible, o extraerlo del ID.
                });
            });
        });
    });

    return opts.sort((a, b) => a.label.localeCompare(b.label));
}