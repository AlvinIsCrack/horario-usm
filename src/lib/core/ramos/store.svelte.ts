import { Config } from "$lib/core/config/store.svelte";
import { Data } from "$lib/data/data.svelte";
import { generateColorForRamo, resetColorPool } from "./colors"; // Asumo que moverás o importarás esto aquí
import type { Ramo, RamoRawData } from "./types";
import { RamoRawSchema } from "$lib/data/schemas";
import { toast } from "$lib/components/ui/sonner/ctx.svelte";

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
     * Mapea los ramos seleccionados contra la Single Source of Truth (Data.cachedRamos).
     * Esto asegura que siempre tengamos la info más fresca (créditos, conflictos, requisitos)
     * calculada reactivamente en Data.
     */
    private hydrateRamos(ramos: Ramo[]): Ramo[] {
        return ramos.map(ramo => {
            // Buscamos la versión "oficial" y fresca en Data
            // Nota: Data.cachedRamos ya depende de Config.carrera, Config.sede, etc.
            const freshData = Data.cachedRamos[ramo.sigla]?.[ramo.paralelo];

            if (freshData) {
                return {
                    ...freshData,
                    // Preservamos el estado de UI local que no viene de la BD (color, highlight)
                    color: ramo.color ?? generateColorForRamo(ramo.sigla, ramo.sigla + ramo.nombre),
                    highlighted: ramo.highlighted,
                    // Si hubiese lógica de conflictos calculada en Data, la heredamos aquí
                    // conflict: freshData.conflict 
                };
            }

            // Fallback robusto: Si por alguna razón el ramo no está en el cache actual
            // (ej: cargaste un horario guardado de otro semestre/sede), devolvemos la data guardada.
            // Opcional: Podrías marcarlo visualmente como "Desincronizado".
            return ramo;
        });
    }

    // --- ACCIONES ---

    add(ramoRaw: RamoRawData) {
        // Esto protege contra datos corruptos que vengan de Data o LocalStorage manipulado
        const parseResult = RamoRawSchema.safeParse(ramoRaw);

        if (!parseResult.success) {
            console.error("Error de validación al agregar ramo:", parseResult.error);
            toast.error("Error de validación al agregar ramo", { description: "Revisa consola para más detalles." })
            return;
        }

        const validRamo = parseResult.data;
        this.remove(validRamo.sigla);

        const newRamo: Ramo = {
            ...validRamo,
            color: generateColorForRamo(validRamo.sigla, validRamo.nombre),
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

        const parseResult = RamoRawSchema.safeParse(ramo);
        if (!parseResult.success) return;

        const existing = this._selectedRamos.find(r => r.sigla === ramo.sigla);
        const color = existing?.color ?? generateColorForRamo(ramo.sigla, ramo.nombre);

        this._previewRamo = {
            ...parseResult.data,
            color,
            highlighted: true
        };
    }

    has(sigla: string): boolean {
        return this._selectedRamos.some(r => r.sigla === sigla);
    }

    clear() {
        this._selectedRamos = [];
        resetColorPool();
    }
}

export const Ramos = new RamosManager();