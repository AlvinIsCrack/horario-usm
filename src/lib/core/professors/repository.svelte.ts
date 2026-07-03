import { Data } from "$lib/data/data.svelte";

export type ProfessorEntry = {
    name: string;
    normalizedName: string;
    departments: Set<string>;
    campuses: Set<string>;
    subjects: Array<{ sigla: string; name: string }>;
};

export class ProfessorRepository {
    // Cache de todos los profesores procesados
    private _allProfessors: ProfessorEntry[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        const registry = new Map<string, ProfessorEntry>();

        // Estructura: ASIGNATURAS[sede][jornada][periodo][sigla][paralelo]
        const allData = Data.ASIGNATURAS;

        if (allData) {
            for (const sedeKey in allData) {
                const sedeData = allData[sedeKey];

                for (const jornadaKey in sedeData) {
                    const jornadaData = sedeData[jornadaKey];

                    for (const periodoKey in jornadaData) {
                        const periodoData = jornadaData[periodoKey];
                        const asignaturas = Object.values(periodoData || {});

                        for (const subjectData of asignaturas) {
                            const paralelos = Object.values(subjectData || {});

                            for (const paralelo of paralelos) {
                                if (!paralelo.profesor || !Array.isArray(paralelo.profesor)) continue;

                                for (const rawName of paralelo.profesor) {
                                    if (!rawName || rawName === 'NN' || rawName === 'Sin profesor' || rawName === 'POR ASIGNAR') continue;

                                    // 1. Normalización de Nombre del Profesor
                                    const cleanName = rawName.replace(/\(.*\)/g, '').trim();
                                    const normalized = cleanName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

                                    if (!registry.has(cleanName)) {
                                        registry.set(cleanName, {
                                            name: cleanName,
                                            normalizedName: normalized,
                                            departments: new Set(),
                                            campuses: new Set(),
                                            subjects: []
                                        });
                                    }

                                    const entry = registry.get(cleanName)!;

                                    // 2. Extracción de Metadata (Sede)
                                    if (sedeKey) entry.campuses.add(sedeKey);

                                    // 3. Extracción y NORMALIZACIÓN de Departamento
                                    // AQUÍ ESTÁ LA SOLUCIÓN: Usamos la misma lógica que el selector UI.
                                    // Esto convierte "Electrotecnia" -> "Electrónica" internamente.
                                    // @ts-ignore
                                    if (paralelo.departamento) {
                                        const rawDepto = paralelo.departamento;
                                        const cleanDepto = Data.normalizeDepto(rawDepto);
                                        entry.departments.add(cleanDepto);
                                    }

                                    // 4. Agregamos el ramo si no está
                                    if (!entry.subjects.some(s => s.sigla === paralelo.sigla)) {
                                        entry.subjects.push({
                                            sigla: paralelo.sigla,
                                            name: paralelo.nombre
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this._allProfessors = Array.from(registry.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    get all() {
        return this._allProfessors;
    }

    search(query: string, filters: { sede?: string; depto?: string } = {}) {
        let results = this._allProfessors;
        const q = query.toLowerCase().trim();

        // 1. Filtrado por Sede
        if (filters.sede && filters.sede !== 'ALL') {
            const filterSedeNormalized = filters.sede.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            results = results.filter(p => {
                for (const campus of p.campuses) {
                    const campusNormalized = campus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (campusNormalized.includes(filterSedeNormalized)) return true;
                }
                return false;
            });
        }

        // 2. Filtrado por Departamento
        // Ahora es seguro porque p.departments ya contiene los nombres limpios ("Electrónica")
        // independientemente de si el JSON original decía "Electrotecnia".
        if (filters.depto && filters.depto !== 'ALL') {
            // Normalizamos el input del filtro (que viene del SelectUI)
            const filterDeptoNormalized = filters.depto
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            results = results.filter(p => {
                for (const depto of p.departments) {
                    // Normalizamos el dato guardado (que ya está limpio, pero quitamos acentos por si acaso)
                    const deptoNormalized = depto
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                    // Usamos includes para mayor tolerancia, o === si quieres exactitud estricta
                    if (deptoNormalized.includes(filterDeptoNormalized)) return true;
                }
                return false;
            });
        }

        // 3. Búsqueda de Texto (Multi-atributo)
        if (q.length > 0) {
            const tokens = q.split(/\s+/);

            results = results.filter(prof => {
                return tokens.every(token => {
                    // A. Match Nombre
                    if (prof.normalizedName.includes(token)) return true;

                    // B. Match Ramo
                    return prof.subjects.some(s =>
                        s.sigla.toLowerCase().includes(token) ||
                        s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(token)
                    );
                });
            });
        }

        return results;
    }
}

// Singleton para usar en la app
export const professorRepo = new ProfessorRepository();