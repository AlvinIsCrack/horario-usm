import type { RamoPrograma, Carrera, RamoCarrera } from "$lib/types/horario";
import _ASIGNATURAS from "./horario_asignaturas.json";
import _CARRERAS from "./planes_carreras.json";
import _METADATA from "./metadata.json";
import _PROGRAMAS from "./programas_academicos.json";
import dayjs from "dayjs";
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

const _cachedRamos = $derived(ASIGNATURAS[Config?.sede]?.[Config.jornada]?.[Config.semestre] ?? []);
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
        let sedeData = PROGRAMAS[sede];
        sedeData ??= PROGRAMAS['Campus ' + sede];
        if (!sedeData) {
            return undefined;
        }

        for (const [departamento, ramos] of Object.entries(sedeData)) {
            const ramoEncontrado = ramos.find(ramo => ramo.sigla === sigla);
            if (ramoEncontrado) {
                return {
                    ...ramoEncontrado,
                    departamento: departamento,
                };
            }
        }

        return undefined;
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