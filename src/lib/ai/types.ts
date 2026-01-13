import TrendingUp from '$lib/icons/trending-up.svelte';
import TrendingDown from '$lib/icons/trending-down.svelte';
import Activity from '$lib/icons/activity.svelte';
import Paralelos from '$lib/icons/paralelos.svelte';
import Sun from '$lib/icons/sun.svelte';
import Moon from '$lib/icons/moon.svelte';
import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';

// Definimos el tipo de status compatible con el frontend
export type StatStatus = 'success' | 'warning' | 'danger' | null;

export const DISTRIBUTION_LABELS = [
    'Uniforme', 'Decreciente', 'Creciente', 'Campana', 'Valle', 'Irregular'
] as const;

export const RHYTHM_LABELS = [
    'Alondra', 'Vespertino', 'Jornada Completa', 'Oficinista', 'Noctámbulo'
] as const;

export const STRUCTURE_LABELS = [
    'Bloque Sólido', 'Queso Suizo', 'Archipiélago', 'Equilibrado'
] as const;

// --- SINGLE SOURCE OF TRUTH PARA ESTADOS ---
export const STATUS_MAP: {
    distribution: Record<string, StatStatus>;
    rhythm: Record<string, StatStatus>;
    structure: Record<string, StatStatus>;
} = {
    distribution: {
        'Uniforme': 'success',
        'Decreciente': 'success', // Front-load es bueno para liberar el finde
        'Creciente': 'warning',   // Back-load puede acumular estrés
        'Campana': 'success',     // Ideal
        'Valle': 'warning',       // Inconsistente
        'Irregular': 'danger'     // Caótico
    },
    rhythm: {
        'Alondra': 'success',
        'Vespertino': 'success',
        'Jornada Completa': 'warning', // Riesgo de agotamiento
        'Oficinista': 'success',
        'Noctámbulo': 'warning'        // Riesgo de seguridad/sueño
    },
    structure: {
        'Bloque Sólido': 'success',
        'Queso Suizo': 'danger',      // "Ventanas de la muerte"
        'Archipiélago': 'warning',    // Doble jornada percibida
        'Equilibrado': 'success'
    }
};

// --- CONFIG ---
// Definimos la topología de las redes aquí para que train.ts y classifier.ts siempre coincidan.
export const AI_CONFIG = {
    dist: { layers: [5, 10, 8, DISTRIBUTION_LABELS.length] }, // 5 Días de input
    rhythm: { layers: [5, 10, 8, RHYTHM_LABELS.length] },      // 5 Días de input (Centro de Gravedad)
    structure: { layers: [3, 8, 6, STRUCTURE_LABELS.length] }  // 3 Inputs (GapRatio, Efficiency, Streak)
};

// --- MAPEOS VISUALES ---
export const ICONS = {
    distribution: {
        'Uniforme': Paralelos,
        'Decreciente': TrendingDown,
        'Creciente': TrendingUp,
        'Campana': Activity, // O Fire
        'Valle': Activity, // O Leaf
        'Irregular': Activity
    },
    rhythm: {
        'Alondra': Sun,
        'Vespertino': Moon,
        'Jornada Completa': MaterialSymbolsDirectionsRun,
        'Oficinista': MaterialSymbolsNestClockFarsightAnalogOutline,
        'Noctámbulo': Moon
    },
    structure: {
        'Bloque Sólido': Paralelos,
        'Queso Suizo': Paralelos,
        'Archipiélago': Activity,
        'Equilibrado': Paralelos
    }
};

export const DESCRIPTIONS = {
    distribution: {
        'Uniforme': 'Carga distribuida equitativamente durante la semana.',
        'Decreciente': 'Mayor actividad al inicio, liberándose hacia el viernes.',
        'Creciente': 'Inicio ligero con mayor actividad hacia el final de la semana.',
        'Campana': 'La mayor actividad se concentra a mitad de semana.',
        'Valle': 'Actividad concentrada en los extremos (Lunes/Viernes).',
        'Irregular': 'Distribución variable sin un patrón fijo diario.'
    },
    rhythm: {
        'Alondra': 'Tus bloques tienden a concentrarse en las mañanas.',
        'Vespertino': 'Tus bloques tienden a concentrarse en las tardes.',
        'Jornada Completa': 'Actividad distribuida a lo largo de gran parte del día.',
        'Oficinista': 'Patrón regular, similar a una jornada laboral estándar.',
        'Noctámbulo': 'Tendencia a tener actividad en bloques tardíos.'
    },
    structure: {
        'Bloque Sólido': 'Bloques continuos con pocas interrupciones entre clases.',
        'Queso Suizo': 'Horario fragmentado con múltiples intervalos breves.',
        'Archipiélago': 'Bloques de clases separados por ventanas prolongadas.',
        'Equilibrado': 'Balance moderado entre tiempo de clases y descansos.'
    }
};