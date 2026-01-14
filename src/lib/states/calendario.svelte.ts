import { SAVED_HORARIOS } from "$lib/constants/ids";
import { Config } from "$lib/logic/config/store.svelte";
import { Ramos } from "$lib/logic/ramos/store.svelte";
import { Días, type Bloque, type Ramo } from "$lib/logic/ramos/types";
import { Data } from "$lib/data/data.svelte";
import Color from "color";
import { tick } from "svelte";

// Estructura del archivo de guardado completo (Slots).
interface SavedHorarios {
    version: number;
    meta: {
        sede: string;
        jornada: string;
        semestre: string;
        exportedAt: Date;
    };
    ramos: {
        sigla: string;
        paralelo: string;
        color?: string;
    }[];
}

// --- ESTADO Y CÁLCULOS DERIVADOS REACTIVOS ---

let _initialized = $state(false);
let _savedHorarios: { [key: string]: SavedHorarios } = $state({});

// El estado derivado se calcula reactivamente basado en la visibilidad del store Ramos.
const derivedState = $derived.by(() => {
    const todosLosRamos = Ramos.visible;

    // Caso base cuando no hay ramos.
    if (todosLosRamos.length === 0) {
        return {
            range: [Días.Lunes, Días.Viernes] as [Días, Días],
            bloqueRange: [1, 8] as [number, number],
            bloquesDía: {} as { [día: number]: { [bloque: number]: Bloque[] } }
        };
    }

    const allBloques = todosLosRamos.flatMap(ramo =>
        ramo.horario.map(b => ({ ...b, ramo }))
    );

    // Cálculo del rango de días
    const días = allBloques.map(b => b.dia);
    const range: [Días, Días] = [Días.Lunes, Math.max(Días.Viernes, ...días)];

    // Cálculo del rango de bloques
    const bloquesNums = allBloques.map(b => b.bloque);
    const maxBloque = Math.max(8, ...bloquesNums);
    const bloqueRange: [number, number] = [1, maxBloque];

    // Creación del mapa de bloques por día
    const bloquesDía: { [día: number]: { [bloque: number]: Bloque[] } } = {};
    for (const bloque of allBloques) {
        (bloquesDía[bloque.dia] ??= {})[bloque.bloque] ??= [];
        bloquesDía[bloque.dia][bloque.bloque].push(bloque);
    }

    // Ordenar bloques en conflicto por sigla
    for (const día in bloquesDía)
        for (const bloque in bloquesDía[día])
            bloquesDía[día][bloque].sort((a, b) => {
                // Manejo defensivo por si ramo es undefined (aunque no debería en lógica estricta)
                const siglaA = a.ramo?.sigla ?? "";
                const siglaB = b.ramo?.sigla ?? "";
                return siglaA.localeCompare(siglaB);
            });

    return { range, bloqueRange, bloquesDía };
});

let _ventanas = $derived.by(() => {
    // Dependencia reactiva explícita
    const _ = Ramos.visible;

    const ventanas: { día: Días; bloque: number; duraciónBloques: number }[] = [];
    for (let día = derivedState.range[0]; día <= derivedState.range[1]; día++) {
        // Obtiene los números de bloque que tienen clases, ordenados
        const bloquesOcupados = Object.keys(derivedState.bloquesDía[día] ?? {})
            .map(Number)
            .sort((a, b) => a - b);

        // No hay ventanas si hay menos de 2 grupos de clases en el día
        if (bloquesOcupados.length < 2) continue;

        const primerBloque = bloquesOcupados[0];
        const ultimoBloque = bloquesOcupados[bloquesOcupados.length - 1];

        // Itera entre la primera y la última clase del día
        for (let bloqueNum = primerBloque + 1; bloqueNum < ultimoBloque; bloqueNum++) {
            // Si el bloque actual no tiene clases, es una ventana
            if (!derivedState.bloquesDía[día]?.[bloqueNum]?.length) {
                // Si el bloque siguiente también es una ventana, se extiende la duración
                if (!derivedState.bloquesDía[día]?.[bloqueNum + 1]?.length) {
                    let duraciónBloques = 1;
                    while (!derivedState.bloquesDía[día]?.[bloqueNum + duraciónBloques]?.length) {
                        duraciónBloques++;
                    }
                    ventanas.push({ día, bloque: bloqueNum, duraciónBloques });
                    bloqueNum += duraciónBloques - 1; // Salta los bloques de la ventana
                } else {
                    // Si no hay ventana extendida, se registra una ventana de un solo bloque
                    ventanas.push({ día, bloque: bloqueNum, duraciónBloques: 1 });
                }
            }
        }
    }
    return ventanas;
});

// 1. Definir la interfaz explícita (puedes ubicarla antes de 'export const Calendario')
interface CalendarioStore {
    init(localStorage: any): void;
    readonly ramos: Ramo[];
    readonly inicializado: boolean;
    readonly lockedLocation: boolean;
    readonly visible: boolean;
    readonly ventanas: { día: Días; bloque: number; duraciónBloques: number }[];
    readonly range: [Días, Días];
    readonly bloqueRange: [number, number];
    readonly bloqueRangeDifference: number;
    ramoPreview: Ramo | undefined;
    checkCollision(ramo: Ramo): boolean;
    checkCollisionAt(bloque: { dia: Días, bloque: number }): boolean;
    getBloques(día: Días, bloque: number): Bloque[] | null;
    getAllBloquesDía(día: Días): { [bloque: number]: Bloque[] } | null;
    hasRamo(query: { sigla?: string, paralelo?: string }): boolean;
    addRamo(ramo: Ramo): void;
    removeRamo(sigla: string): boolean;
    clear(): void;
    clearSaved(): void;
    hasSaved(): boolean;
    removeSaved(key: string): boolean;
    getSaved(): string[];
    save(key: string): void;
    load(key: string): Promise<boolean>;
}

// 2. Asignar la interfaz y añadir los tipos de retorno a los métodos
export const Calendario: CalendarioStore = {
    init(localStorage: any) {
        _savedHorarios = localStorage.getItem(SAVED_HORARIOS) ? JSON.parse(localStorage.getItem(SAVED_HORARIOS)!) : {};
        _initialized = true;
        // Ramos se inicializa a sí mismo en su constructor.
    },

    get ramos(): Ramo[] {
        return Ramos.all;
    },

    get inicializado() {
        return _initialized;
    },

    get lockedLocation() {
        return _initialized && Ramos.all.length > 0;
    },

    get visible() {
        // Devuelve true si hay algo que mostrar (ramos o preview), manteniendo compatibilidad semántica
        return Ramos.visible.length > 0;
    },

    get ventanas() {
        return _ventanas;
    },

    get range() {
        return derivedState.range;
    },

    get bloqueRange() {
        return derivedState.bloqueRange;
    },

    get bloqueRangeDifference() {
        return derivedState.bloqueRange[1] - derivedState.bloqueRange[0];
    },

    get ramoPreview() {
        return Ramos.preview;
    },

    set ramoPreview(ramo: Ramo | undefined) {
        Ramos.setPreview(ramo);
    },

    checkCollision(ramo: Ramo) {
        if (!ramo.horario.length) return false;
        return ramo.horario.some(b => this.checkCollisionAt(b));
    },

    checkCollisionAt(bloque: { dia: Días, bloque: number }): boolean {
        // Chequeamos contra todos los ramos visibles (incluyendo selección)
        const bloques = Ramos.all.flatMap(r => r.horario);
        if (!bloques.length) return false;
        return bloques.some(b => b.dia === bloque.dia && b.bloque === bloque.bloque);
    },

    getBloques(día: Días, bloque: number): Bloque[] | null {
        return derivedState.bloquesDía[día as number]?.[bloque] ?? null;
    },

    getAllBloquesDía(día: Días): { [bloque: number]: Bloque[] } | null {
        return derivedState.bloquesDía[día as number] ?? null;
    },

    hasRamo(query: { sigla?: string, paralelo?: string }) {
        if (!Ramos.all.length) return false;
        if (Object.values(query).filter(s => s).length === 0) return false;

        const { sigla, paralelo } = query;
        return Ramos.all.some(r => (!sigla || r.sigla === sigla) && (!paralelo || r.paralelo === paralelo));
    },

    addRamo(ramo: Ramo) {
        // Ramos.add maneja la lógica de reemplazo y actualización
        Ramos.add(ramo);
    },

    removeRamo(sigla: string) {
        if (!Ramos.has(sigla)) return false;
        Ramos.remove(sigla);
        return true;
    },

    clear() {
        Ramos.clear();
    },

    // --- GESTIÓN DE SLOTS DE GUARDADO ---
    // Esta lógica se mantiene en Calendario pues gestiona "snapshots" y no el estado vivo.

    clearSaved() {
        _savedHorarios = {};
        localStorage.removeItem(SAVED_HORARIOS);
    },

    hasSaved() {
        return Object.keys(_savedHorarios).length > 0;
    },

    removeSaved(key: string) {
        if (!_savedHorarios[key]) return false;
        delete _savedHorarios[key];
        localStorage.setItem(SAVED_HORARIOS, JSON.stringify(_savedHorarios));
        return true;
    },

    getSaved() {
        return Object.keys(_savedHorarios);
    },

    save(key: string) {
        if (!Ramos.all.length) return;
        _savedHorarios = {
            ..._savedHorarios, [key]: {
                version: 1,
                meta: {
                    sede: Config.sede,
                    jornada: Config.jornada,
                    semestre: Config.semestre,
                    exportedAt: new Date()
                },
                ramos: Ramos.all.map(r => ({
                    sigla: r.sigla,
                    paralelo: r.paralelo,
                    color: r.color?.hex() // Serializamos el color
                }))
            }
        };
        localStorage.setItem(SAVED_HORARIOS, JSON.stringify(_savedHorarios));
    },

    async load(key: string) {
        let parsed: SavedHorarios | undefined;
        try {
            parsed = _savedHorarios[key] as SavedHorarios;
        } catch (e) {
            alert("Error al parsear el horario guardado.");
            return false;
        }

        // Restaurar contexto global
        Config.sede = parsed.meta.sede ?? "";
        Config.jornada = parsed.meta.jornada ?? "";
        Config.semestre = parsed.meta.semestre ?? "";

        // Asegurar que la data base esté cargada para reconstruir los objetos Ramo completos
        await tick();
        // Nota: Data.cachedRamos es un derived, así que al cambiar Config arriba, 
        // debería actualizarse reactivamente.

        const cachedRamos = Data.cachedRamos; // Acceso directo al getter

        if (!cachedRamos || Object.keys(cachedRamos).length === 0) {
            alert("No se pudo cargar el horario: Datos de asignaturas no disponibles para esta sede/jornada.");
            return false;
        }

        Ramos.clear();
        let notFoundCount = 0;

        for (const savedRamo of parsed.ramos) {
            // Buscamos la definición completa del ramo en la data estática
            const ramoData = cachedRamos[savedRamo.sigla]?.[savedRamo.paralelo];

            if (ramoData) {
                // Reconstruimos el ramo. 
                // Nota: Ramos.add generará un nuevo color si no se maneja,
                // pero como la UI se reconstruye, priorizamos la consistencia de datos.
                // Si Ramos.add soportara color explícito, lo pasaríamos aquí.
                // Asumimos comportamiento estándar de Ramos.add
                Ramos.add({
                    ...ramoData,
                    // Intentamos pasar el color si la implementación de Ramos.add lo permite o lo permitiera en el futuro
                    // (casting a any para evitar error de tipos estricto si RamoRawData no tiene color)
                    color: savedRamo.color ? Color(savedRamo.color) : undefined
                } as any);
            } else {
                notFoundCount++;
            }
        }

        return true;
    }
};