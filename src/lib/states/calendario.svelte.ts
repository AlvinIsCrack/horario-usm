import { SAVED_HORARIOS } from "$lib/constants/ids";
import { Config } from "$lib/logic/config/store.svelte";
import { generateColorForRamo } from "$lib/logic/ramos/colors";
import { type Ramo, Días, type Bloque } from "$lib/types/horario";
import Color from "color";
import { tick } from "svelte";

// Estructura del archivo de guardado completo.
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

let _ramoPreview: Ramo | undefined = $state(undefined);
let _ramos: Ramo[] = $state([]);
const _calendarioVisible = $derived(_ramos.length || _ramoPreview);

let _initialized = $state(false);
let _savedHorarios: { [key: string]: SavedHorarios } = $state({});
const _lockedLocation: boolean = $derived(_initialized && Boolean(_ramos.length));

// El estado derivado se calcula reactivamente cuando _ramos o _ramoPreview cambian.
const derivedState = $derived.by(() => {
    const todosLosRamos = [..._ramos.filter(r => r.sigla !== _ramoPreview?.sigla), ...(_ramoPreview ? [_ramoPreview] : [])];

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
    // let minBloque = Math.min(...bloquesNums);
    // if (minBloque > 1 && minBloque % 2 === 0) {
    //     minBloque -= 1;
    // }
    const maxBloque = Math.max(8, ...bloquesNums);
    const bloqueRange: [number, number] = [1, maxBloque];

    // Creación del mapa de bloques por día
    const bloquesDía: { [día: number]: { [bloque: number]: Bloque[] } } = {};
    for (const bloque of allBloques) {
        // Sintaxis moderna para inicializar si es nulo
        (bloquesDía[bloque.dia] ??= {})[bloque.bloque] ??= [];
        bloquesDía[bloque.dia][bloque.bloque].push(bloque);
    }

    //Ordenar bloques en conflicto por sigla
    for (const día in bloquesDía)
        for (const bloque in bloquesDía[día])
            bloquesDía[día][bloque].sort((a, b) => a.ramo.sigla.localeCompare(b.ramo.sigla));

    return { range, bloqueRange, bloquesDía };
});

let _ventanas = $derived.by(() => {
    const _ = [_ramos];
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

// --- INTERFAZ PÚBLICA (MODIFICADA PARA USAR ESTADO DERIVADO) ---

export const Calendario = {
    init(localStorage: any) {
        _savedHorarios = localStorage.getItem(SAVED_HORARIOS) ? JSON.parse(localStorage.getItem(SAVED_HORARIOS)!) : [];
        _initialized = true;
    },

    get ramos(): Ramo[] {
        return _ramos;
    },

    get inicializado() {
        return _initialized;
    },

    get lockedLocation() {
        return _lockedLocation;
    },

    get visible() {
        return _calendarioVisible;
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
        return _ramoPreview;
    },

    set ramoPreview(ramo: Ramo | undefined) {
        _ramoPreview = !ramo ? undefined : {
            ...ramo,
            highlighted: true,
            color: _ramoPreview?.color && _ramoPreview.sigla === ramo.sigla ? _ramoPreview.color : generateColorForRamo(ramo.sigla, ramo.nombre)
        };
    },

    checkCollision(ramo: Ramo) {
        if (!ramo.horario.length) return false;
        return ramo.horario.some(b => this.checkCollisionAt(b));
    },

    checkCollisionAt(bloque: { dia: Días, bloque: number }): boolean {
        const bloques = _ramos.flatMap(r => r.horario);
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
        if (!_ramos.length) return false;
        if (Object.values(query).filter(s => s).length === 0) return false;

        const { sigla, paralelo } = query;
        return _ramos.some(r => (!sigla || r.sigla === sigla) && (!paralelo || r.paralelo === paralelo));
    },

    addRamo(ramo: Ramo) {
        this.removeRamo(ramo.sigla);
        _ramoPreview = undefined;
        _ramos = [..._ramos, { ...ramo, highlighted: undefined }];
    },

    removeRamo(sigla: string) {
        if (!_ramos.some(r => r.sigla === sigla)) return false;
        _ramos = [..._ramos.filter(r => r.sigla !== sigla)];
        if (_ramoPreview?.sigla === sigla)
            _ramoPreview = undefined;
        return true;
    },

    clear() {
        _ramos = [];
    },

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
        if (!_ramos.length) return;
        _savedHorarios = {
            ..._savedHorarios, [key]: {
                version: 1,
                meta: {
                    sede: Config.sede,
                    jornada: Config.jornada,
                    semestre: Config.semestre,
                    exportedAt: new Date()
                },
                ramos: _ramos.map(r => ({
                    sigla: r.sigla,
                    paralelo: r.paralelo,
                    color: r.color?.hexa()
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
            alert("Error al parsear el horario guardado. Asegúrate de que el formato sea correcto.");
            return false;
        }

        Config.sede = parsed.meta.sede ?? "";
        Config.jornada = parsed.meta.jornada ?? "";
        Config.semestre = parsed.meta.semestre ?? "";

        const [, Data] = await Promise.all([
            tick(),
            import("$lib/data/data.svelte").then((data) => data.Data)
        ])

        if (!Data.cachedRamos) {
            alert("No se pudo cargar el horario guardado. Asegúrate de que los ramos estén disponibles.");
            return false;
        }

        const loadedRamos: Ramo[] = [];
        let notFoundCount = 0;

        for (const savedRamo of parsed.ramos) {
            const ramoData = Data.cachedRamos[savedRamo.sigla]?.[savedRamo.paralelo];

            if (ramoData) {
                const newRamo = { ...ramoData };
                // Recrea la instancia de Color a partir del string guardado.
                newRamo.color = Color(savedRamo.color);
                loadedRamos.push(newRamo);
            } else {
                notFoundCount++;
            }
        }

        _ramos = loadedRamos;
        _ramoPreview = undefined;
        return true;
    }
};