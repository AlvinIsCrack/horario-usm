import type { RamoPrograma, Carrera, RamoCarrera } from "$lib/types/horario";
import _ASIGNATURAS from "./horario_asignaturas.json";
import _CARRERAS from "./planes_carreras.json";
import _METADATA from "./metadata.json";
import _PROGRAMAS from "./programas_academicos.json";
import dayjs from '$lib/helpers/dayjs';
import { Config } from "$lib/logic/config/store.svelte";
import type { Ramo } from "$lib/logic/ramos/types";

//@ts-ignore
const ASIGNATURAS: {
    [sede: string]: {
        [jornada: string]: {
            [periodo: string]: {
                [sigla_ramo: string]: {
                    [paralelo: string]: Ramo;
                };
            };
        };
    };
    //@ts-ignore
} = _ASIGNATURAS as const;

const PROGRAMAS: {
    [sede: string]: {
        [departamento: string]: RamoPrograma[];
    };
} = Object.fromEntries(
    Object.entries(_PROGRAMAS)
        .filter(([key]) => key !== 'date') // Filtra propiedades extra como 'date'
        .map(([sede, departamentos]) => [
            sede,
            Object.fromEntries(
                Object.entries(departamentos as any).map(([depto, tipos]) => {
                    const ramos: RamoPrograma[] = [];
                    for (const [tipo, ramosPorTipo] of Object.entries(tipos as any)) {
                        for (const [sigla, ramoInfo] of Object.entries(ramosPorTipo as any)) {
                            ramos.push({
                                tipo: tipo as "IMPAR" | "PAR" | "AMBOS" | "ELECTIVO",
                                sigla,
                                //@ts-ignore
                                nombre: ramoInfo.nombre,
                                //@ts-ignore
                                creditos: parseInt(ramoInfo.creditos, 10),
                                //@ts-ignore
                                programa: ramoInfo.programa,
                            });
                        }
                    }
                    return [depto, ramos];
                })
            ),
        ])
);
let CARRERAS = _CARRERAS as Carrera[];

const _sedes = Object.keys(ASIGNATURAS);
const _jornadas: { [sede: string]: string[] } = Object.fromEntries(
    _sedes.map(sede => [
        sede,
        Object.keys(ASIGNATURAS[sede]).filter(
            jornada => Object.keys(ASIGNATURAS[sede][jornada]).some(
                semestre => Object.keys(ASIGNATURAS[sede][jornada][semestre]).length > 0
            )
        )
    ])
);
const _semestres: { [sede: string]: { [jornada: string]: string[] } } = Object.fromEntries(
    _sedes.map(sede => [
        sede,
        Object.fromEntries(
            Object.keys(ASIGNATURAS[sede]).map(jornada => [
                jornada,
                Object.keys(ASIGNATURAS[sede][jornada]).filter(semestre =>
                    Object.keys(ASIGNATURAS[sede][jornada][semestre]).length > 0
                )
            ])
        )
    ])
);

const _jornadasCarreras: { [sede: string]: string[] } = Object.fromEntries(
    _sedes.map(sede => [
        sede,
        [...new Set(CARRERAS.filter(c => c.sede === sede).map(c => c.jornada))]
    ])
);

function normalizeDepto(rawName: string): string {
    const lower = rawName.trim().toLowerCase();

    // 1. Mapeos directos para casos conocidos y unificación
    const MAP: Record<string, string> = {
        "defider": "DEFIDER",
        "matematica": "Matemática",
        "fisica": "Física",
        "quimica": "Química",
        "mecanica": "Mecánica",
        "aeronautica": "Aeronáutica",
        "electronica": "Electrónica",
        "electrica": "Eléctrica",
        "informatica": "Informática",
        "humanisticos": "Humanísticos",
        // Unificaciones semánticas
        "electrotecnia": "Electrónica", // Unificamos Electrotecnia -> Electrónica
        "electrotecnia e informatica": "Electrónica e Informática",
        "construccion y prevencion de riesgos": "Construcción y Prevención de Riesgos",
        "construcción y prevención de riesgos": "Construcción y Prevención de Riesgos",
        "quimica y medio ambiente": "Química y Medio Ambiente",
        "química y medio ambiente": "Química y Medio Ambiente",
        "diseño y manufactura": "Diseño y Manufactura"
    };

    // Si está en el mapa directo, devolver corrección
    if (MAP[lower]) return MAP[lower];

    // Si contiene "electrotecnia", lo forzamos a "Electrónica" si no cayó arriba
    if (lower.includes("electrotecnia")) {
        return normalizeDepto(lower.replace("electrotecnia", "electrónica"));
    }

    // 2. Capitalización automática (Title Case) para los que no están en el mapa
    return rawName
        .toLowerCase()
        .replace(/(?:^|\s|['"([{])+\S/g, (match) => match.toUpperCase())
        .replace(/\b(De|Y|E|Del|La|El|En)\b/g, (match) => match.toLowerCase()) // Lowercase connectors
        .replace(/^\w/, (c) => c.toUpperCase()); // Asegurar primera mayúscula
}

const _departamentos = Array.from(
    new Set(
        Object.values(PROGRAMAS)
            .flatMap((sedeData) => Object.keys(sedeData))
            .map(normalizeDepto) // Aplicamos la limpieza
    )
).sort((a, b) => a.localeCompare(b, 'es')); // Orden alfabético correcto en español

const _PROGRAMAS_LOOKUP: Record<string, Record<string, (RamoPrograma & { departamento: string })>> = {};

for (const [sede, deptos] of Object.entries(PROGRAMAS)) {
    _PROGRAMAS_LOOKUP[sede] ??= {};
    for (const [depto, ramos] of Object.entries(deptos as Record<string, RamoPrograma[]>)) {
        for (const ramo of ramos) {
            _PROGRAMAS_LOOKUP[sede][ramo.sigla] = { ...ramo, departamento: depto };
        }
    }
}

const _cachedRamos = $derived.by(() => {
    // Acceso seguro a la estructura raw
    const rawSemester = ASIGNATURAS[Config.sede]?.[Config.jornada]?.[Config.semestre];
    if (!rawSemester) return {};

    // Pre-calcular mapa de ramos de la carrera actual (si existe) para obtener créditos específicos
    // Esto evita iterar carreras por cada ramo del semestre
    const carreraMap: Record<string, RamoCarrera> = {};
    if (Config.carrera) {
        const carrera = _cachedCarreras.find(c => c.nombre === Config.carrera);
        if (carrera) {
            // Aplanamos la malla de la carrera para búsqueda rápida por sigla
            Object.values(carrera["menciones/especialidades"]).forEach(mencion => {
                Object.values(mencion.planes).forEach(plan => {
                    plan.malla.forEach(semestre => {
                        Object.assign(carreraMap, semestre);
                    });
                });
            });
        }
    }

    const hydrated: typeof rawSemester = {};

    for (const [sigla, paralelos] of Object.entries(rawSemester)) {
        hydrated[sigla] = {};

        // 1. Obtener info base del programa (Departamento, Tipo, Créditos Genéricos)
        // Intentamos sede actual, fallback a 'Campus + Sede' (ej: Santiago -> Campus Santiago)
        const infoPrograma = _PROGRAMAS_LOOKUP[Config.sede]?.[sigla] ??
            _PROGRAMAS_LOOKUP[`Campus ${Config.sede}`]?.[sigla];

        // 2. Obtener info específica de carrera (Créditos prioritarios)
        const infoCarrera = carreraMap[sigla];

        // 3. Resolver valores finales
        const creditos = infoCarrera?.creditos ?? infoPrograma?.creditos;
        const horas = infoCarrera?.horas;
        const requisitos = infoCarrera?.requisitos;
        const equivalencias = infoCarrera?.equivalencias;
        const departamento = infoPrograma?.departamento;
        const tipoCurricular = infoPrograma?.tipo;

        for (const [paralelo, ramoRaw] of Object.entries(paralelos)) {
            hydrated[sigla][paralelo] = {
                ...ramoRaw,
                horario: [...ramoRaw.horario].map(h => ({ ...h, sala: h.sala.replace(/san joaqu.n/gi, '').replace(/((?:-|_)\s+$|^\s+(?:-|_))/g, '') })),
                horas,
                requisitos,
                equivalencias,
                creditos,
                departamento,
                tipoCurricular,
            };
        }
    }

    return hydrated;
});

const _cachedCarreras = $derived(CARRERAS.filter(carrera => {
    const sede = Config.sede;
    const jornada = Config.jornada;
    return carrera.sede === sede && (!jornada || carrera.jornada === jornada);
}));
// Se reemplaza la lectura de la fecha desde ASIGNATURAS por la de METADATA
let _updatedDate: dayjs.Dayjs | undefined = dayjs(!_METADATA?.generatedAt?.unix ? undefined : _METADATA.generatedAt.unix * 1000);

export const Data = {
    ASIGNATURAS,
    METADATA: _METADATA,

    /**
     * Busca la primera ocurrencia de un ramo por su sigla a través de todas las carreras y mallas.
     * @param sigla La sigla del ramo a buscar.
     * @param sede Opcional. Sede a filtrar.
     * @param jornada Opcional. Jornada a filtrar.
     * @returns El objeto RamoCarrera si se encuentra, de lo contrario undefined.
     */
    getInfoRamoCarrera(sigla: string, sede?: string, jornada?: string): RamoCarrera | undefined {
        for (const carrera of CARRERAS) {
            if (sede && carrera.sede !== sede) continue;
            if (jornada && carrera.jornada !== jornada) continue;
            for (const mencionKey in carrera["menciones/especialidades"]) {
                const mencion = carrera["menciones/especialidades"][mencionKey];
                for (const planKey in mencion.planes) {
                    const plan = mencion.planes[planKey];
                    for (const semestre of plan.malla) {
                        if (semestre[sigla]) {
                            return semestre[sigla];
                        }
                    }
                }
            }
        }
        return undefined;
    },

    /**
     * Obtiene la información de un ramo desde la estructura de PROGRAMAS,
     * buscando en todos los departamentos de una sede.
     * @param sede La sede del ramo.
     * @param sigla La sigla del ramo a buscar.
     * @returns Un objeto que combina RamoPrograma con el nombre del departamento,
     * o undefined si no se encuentra.
     */
    getProgramaRamo(sede: string, sigla: string): (RamoPrograma & { departamento: string }) | undefined {
        return _PROGRAMAS_LOOKUP[sede]?.[sigla] ?? _PROGRAMAS_LOOKUP[`Campus ${sede}`]?.[sigla];
    },

    get sedes(): string[] {
        return _sedes;
    },

    get jornadas(): { [sede: string]: string[] } {
        return _jornadas;
    },

    get jornadasCarreras(): { [sede: string]: string[] } {
        return _jornadasCarreras;
    },

    get semestres(): { [sede: string]: { [jornada: string]: string[] } } {
        return _semestres;
    },

    get departamentos(): string[] {
        return _departamentos;
    },

    get cachedRamos() {
        return _cachedRamos;
    },

    get cachedCarreras() {
        return _cachedCarreras;
    },

    get updateDate() {
        return _updatedDate;
    },

    normalizeDepto
};