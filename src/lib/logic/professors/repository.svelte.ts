// src/lib/logic/professors/repository.svelte.ts
import { Data } from '$lib/data/data.svelte';

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

        // Usamos la estructura completa ASIGNATURAS para poder inferir la SEDE desde las claves
        // Estructura: ASIGNATURAS[sede][jornada][periodo][sigla][paralelo]
        const allData = Data.ASIGNATURAS;

        if (allData) {
            for (const sedeKey in allData) {
                const sedeData = allData[sedeKey];

                for (const jornadaKey in sedeData) {
                    const jornadaData = sedeData[jornadaKey];

                    for (const periodoKey in jornadaData) {
                        const periodoData = jornadaData[periodoKey];

                        // Aquí iteramos sobre las asignaturas (siglas)
                        const asignaturas = Object.values(periodoData || {});

                        for (const subjectData of asignaturas) {
                            // subjectData es un objeto donde las values son los paralelos
                            const paralelos = Object.values(subjectData || {});

                            for (const paralelo of paralelos) {
                                // paralelo.profesor es un array de strings (según tu código previo)
                                // Verificamos que sea iterable por seguridad
                                if (!paralelo.profesor || !Array.isArray(paralelo.profesor)) continue;

                                for (const rawName of paralelo.profesor) {
                                    if (!rawName || rawName === 'POR ASIGNAR') continue;

                                    // 1. Normalización de Nombre
                                    const cleanName = rawName
                                        .replace(/\(.*\)/g, '')
                                        .trim();

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

                                    // 2. Extracción de Metadata
                                    // Sede: La inferimos del bucle principal (sedeKey)
                                    if (sedeKey) entry.campuses.add(sedeKey);

                                    // Departamento: Si existe en el objeto paralelo
                                    // @ts-ignore - Asumimos que paralelo puede tener 'departamento' aunque el tipo sea Ramo estricto
                                    if (paralelo.departamento) entry.departments.add(paralelo.departamento);

                                    // 3. Agregamos el ramo si no está
                                    if (!entry.subjects.some(s => s.sigla === paralelo.sigla)) {
                                        entry.subjects.push({
                                            sigla: paralelo.sigla,
                                            name: paralelo.nombre // Nombre del ramo
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

        // 1. Filtrado por Sede (si se selecciona)
        // MEJORA: Búsqueda flexible (contains) y normalizada
        if (filters.sede && filters.sede !== 'ALL') {
            const filterSedeNormalized = filters.sede
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            results = results.filter(p => {
                // Verificamos si ALGUNA de las sedes del profesor contiene el texto del filtro
                for (const campus of p.campuses) {
                    const campusNormalized = campus
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                    if (campusNormalized.includes(filterSedeNormalized)) return true;
                }
                return false;
            });
        }

        // Filtrado por Departamento (similar lógica robusta)
        if (filters.depto && filters.depto !== 'ALL') {
            const filterDeptoNormalized = filters.depto
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            results = results.filter(p => {
                for (const depto of p.departments) {
                    const deptoNormalized = depto
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");
                    if (deptoNormalized.includes(filterDeptoNormalized)) return true;
                }
                return false;
            });
        }

        // 2. Búsqueda de Texto (Multi-atributo)
        if (q.length > 0) {
            const tokens = q.split(/\s+/);

            results = results.filter(prof => {
                // Estrategia: Cada token debe matchear ALGO (Nombre O Ramo)
                return tokens.every(token => {
                    // A. Match Nombre (ya normalizado en init)
                    if (prof.normalizedName.includes(token)) return true;

                    // B. Match Ramo (Sigla o Nombre) - Normalización "On the fly" para nombre del ramo
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