// src/lib/logic/config/store.svelte.ts
import { browser } from '$app/environment';

// Si prefieres usar tus constantes existentes, impórtalas. 
// Si no, estos strings literales funcionan perfectamente y aíslan el módulo.
const STORAGE_KEYS = {
    SEDE: 'sede',
    JORNADA: 'jornada',
    CARRERA: 'carrera',
    SEMESTRE: 'semestre',
    TRASLADO: 'tiempo-traslado'
};

class ConfigManager {
    // Estado reactivo (Runes)
    sede = $state<string>('');
    jornada = $state<string>('');
    carrera = $state<string>('');
    semestre = $state<string>('');
    tiempoTraslado = $state<number>(60);

    constructor() {
        if (browser) {
            // Recuperar persistencia al iniciar
            this.sede = localStorage.getItem(STORAGE_KEYS.SEDE) || '';
            this.jornada = localStorage.getItem(STORAGE_KEYS.JORNADA) || '';
            this.carrera = localStorage.getItem(STORAGE_KEYS.CARRERA) || '';
            this.semestre = localStorage.getItem(STORAGE_KEYS.SEMESTRE) || '';

            const savedTraslado = localStorage.getItem(STORAGE_KEYS.TRASLADO);
            this.tiempoTraslado = savedTraslado ? parseInt(savedTraslado) : 60;
        }
    }

    // --- Setters con Persistencia Automática ---

    setSede(val: string) {
        this.sede = val;
        if (browser) localStorage.setItem(STORAGE_KEYS.SEDE, val);
    }

    setJornada(val: string) {
        this.jornada = val;
        if (browser) localStorage.setItem(STORAGE_KEYS.JORNADA, val);
    }

    setCarrera(val: string) {
        this.carrera = val;
        if (browser) localStorage.setItem(STORAGE_KEYS.CARRERA, val);
    }

    setSemestre(val: string) {
        this.semestre = val;
        if (browser) localStorage.setItem(STORAGE_KEYS.SEMESTRE, val);
    }

    setTiempoTraslado(val: number) {
        this.tiempoTraslado = val;
        if (browser) localStorage.setItem(STORAGE_KEYS.TRASLADO, val.toString());
    }

    // --- Computed / Getters ---

    /**
     * Determina si la configuración mínima para cargar ramos está lista.
     */
    get isReady() {
        return this.sede !== '' && this.jornada !== '';
    }
}

export const Config = new ConfigManager();