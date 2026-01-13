import { Config } from "$lib/logic/config/store.svelte";
import { Data } from "$lib/data/data.svelte";
import { generateColorForRamo } from "./colors"; // Asumo que moverás o importarás esto aquí
import type { Ramo, RamoRawData } from "./types";

class RamosManager {
    // Estado interno: Lista cruda de ramos seleccionados (mínima info necesaria)
    private _selectedRamos = $state<Ramo[]>([]);

    // Estado para preview (hover en buscador, etc.)
    private _previewRamo = $state<Ramo | undefined>(undefined);

    // --- GETTERS (Derived State) ---

    /**
     * Retorna la lista de ramos seleccionados, enriquecidos (hidratados)
     * dinámicamente con información de la carrera y el programa actual.
     */
    get all(): Ramo[] {
        return this.hydrateRamos(this._selectedRamos);
    }

    /**
     * Retorna el ramo en preview hidratado.
     */
    get preview(): Ramo | undefined {
        if (!this._previewRamo) return undefined;
        return this.hydrateRamos([this._previewRamo])[0];
    }

    /**
     * Combina seleccionados + preview para cálculos de calendario.
     */
    get visible(): Ramo[] {
        const base = [...this.all.filter(r => r.sigla !== this._previewRamo?.sigla)];
        if (this.preview) base.push(this.preview);
        return base;
    }

    // --- LÓGICA DE HIDRATACIÓN (DDD) ---

    /**
     * Toma un array de ramos base y los "hidrata" cruzando datos
     * con Data (global) y Config (contexto usuario).
     */
    private hydrateRamos(ramos: Ramo[]): Ramo[] {
        return ramos.map(ramo => {
            // 1. Obtener info base del Programa (Sede + Sigla) -> Tipo (Par/Impar) y Departamento
            const infoPrograma = Data.getProgramaRamo(Config.sede, ramo.sigla);

            // 2. Obtener info específica de la Carrera (Créditos, Malla)
            // Buscamos en las carreras cacheadas (filtradas por sede/jornada en Data)
            // aquella que coincida con la carrera seleccionada en Config.
            let infoCarrera = undefined;

            if (Config.carrera) {
                const carreraActual = Data.cachedCarreras.find(c => c.nombre === Config.carrera);

                if (carreraActual) {
                    // Búsqueda profunda en la malla de la carrera
                    // Nota: Podríamos optimizar esto en Data, pero aquí mantenemos la lógica encapsulada.
                    outerLoop:
                    for (const mencion of Object.values(carreraActual["menciones/especialidades"])) {
                        for (const plan of Object.values(mencion.planes)) {
                            for (const semestre of plan.malla) {
                                if (semestre[ramo.sigla]) {
                                    infoCarrera = semestre[ramo.sigla];
                                    break outerLoop;
                                }
                            }
                        }
                    }
                }
            }

            // 3. Fusión de datos (Prioridad: Carrera > Programa > Ramo Base)
            // Si no hay info de carrera, usamos la del programa (créditos genéricos).
            const creditos = infoCarrera?.creditos ?? infoPrograma?.creditos;

            return {
                ...ramo,
                // Si ya tiene color (guardado/asignado), lo mantiene, sino undefined (la UI decidirá o se asigna al añadir)
                color: ramo.color,
                departamento: infoPrograma?.departamento ?? ramo.departamento, // Fallback al raw si existe
                tipoCurricular: infoPrograma?.tipo,
                creditos: creditos, // Puede ser undefined
                // Aquí podrías añadir más campos derivados como requisitos
            };
        });
    }

    // --- ACCIONES ---

    add(ramoRaw: RamoRawData) {
        // Evitar duplicados por sigla
        this.remove(ramoRaw.sigla);

        const newRamo: Ramo = {
            ...ramoRaw,
            // Asignar color persistente al momento de agregar
            color: generateColorForRamo(ramoRaw.sigla, ramoRaw.nombre),
            highlighted: false
        };

        this._selectedRamos = [...this._selectedRamos, newRamo];
        this._previewRamo = undefined;
    }

    remove(sigla: string) {
        if (!this._selectedRamos.some(r => r.sigla === sigla)) return;
        this._selectedRamos = this._selectedRamos.filter(r => r.sigla !== sigla);

        if (this._previewRamo?.sigla === sigla)
            this._previewRamo = undefined;
    }

    setPreview(ramo: RamoRawData | undefined) {
        if (!ramo) {
            this._previewRamo = undefined;
            return;
        }

        // Si el ramo ya existe en la selección, usamos su color existente para el preview
        const existing = this._selectedRamos.find(r => r.sigla === ramo.sigla);
        const color = existing?.color ?? generateColorForRamo(ramo.sigla, ramo.nombre);

        this._previewRamo = {
            ...ramo,
            color,
            highlighted: true
        };
    }

    has(sigla: string): boolean {
        return this._selectedRamos.some(r => r.sigla === sigla);
    }

    clear() {
        this._selectedRamos = [];
    }
}

export const Ramos = new RamosManager();