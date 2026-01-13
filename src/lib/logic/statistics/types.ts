// --- DEFINICIONES Y TIPOS ---
// Iconos (Agrupados para pasar al pipeline)
import Moon from '$lib/icons/moon.svelte';
import MaterialSymbolsNestEcoLeaf from '$lib/icons/MaterialSymbolsNestEcoLeaf.svelte';
import MaterialSymbolsLocalFireDepartmentRounded from '$lib/icons/MaterialSymbolsLocalFireDepartmentRounded.svelte';
import MaterialSymbolsDirectionsRun from '$lib/icons/MaterialSymbolsDirectionsRun.svelte';
import MaterialSymbolsTimeline from '$lib/icons/MaterialSymbolsTimeline.svelte';
import MaterialSymbolsBookRibbon from '$lib/icons/MaterialSymbolsBookRibbon.svelte';
import MaterialSymbolsNestClockFarsightAnalogOutline from '$lib/icons/MaterialSymbolsNestClockFarsightAnalogOutline.svelte';
import MaterialSymbolsBalance from '$lib/icons/MaterialSymbolsBalance.svelte';
import MaterialSymbolsWarningRounded from '$lib/icons/MaterialSymbolsWarningRounded.svelte';
import MaterialSymbolsHrRestingOutlineSharp from '$lib/icons/MaterialSymbolsHrRestingOutlineSharp.svelte';
import MaterialSymbolsLink from '$lib/icons/MaterialSymbolsMenu.svelte';
import MaterialSymbolsCategory from '$lib/icons/MaterialSymbolsMenu.svelte';
import MaterialSymbolsDirectionsBusOutline from '$lib/icons/MaterialSymbolsDirectionsBusOutline.svelte';
import MaterialSymbolsFastfoodRounded from '$lib/icons/MaterialSymbolsFastfoodRounded.svelte';
import Asterisk from "$lib/icons/asterisk.svelte";
import MaterialSymbolsMagicButton from "$lib/icons/MaterialSymbolsMagicButton.svelte";
import MingcuteBrainLine from "$lib/icons/MingcuteBrainLine.svelte";
import MajesticonsTicket from "$lib/icons/MajesticonsTicket.svelte";
import MaterialSymbolsWeight from "$lib/icons/MaterialSymbolsWeight.svelte";
import type { Días, Ramo } from '../ramos/types';

export const ICONS = {
    Leaf: MaterialSymbolsNestEcoLeaf,
    Fire: MaterialSymbolsLocalFireDepartmentRounded,
    Clock: MaterialSymbolsNestClockFarsightAnalogOutline,
    Moon: Moon,
    Timeline: MaterialSymbolsTimeline,
    Balance: MaterialSymbolsBalance,
    Book: MaterialSymbolsBookRibbon,
    Run: MaterialSymbolsDirectionsRun,
    Resting: MaterialSymbolsHrRestingOutlineSharp,
    Warning: MaterialSymbolsWarningRounded,
    Link: MaterialSymbolsLink,
    Category: MaterialSymbolsCategory,
    Bus: MaterialSymbolsDirectionsBusOutline,
    FastFood: MaterialSymbolsFastfoodRounded,
    Asterisk: Asterisk,
    Magic: MaterialSymbolsMagicButton,
    Brain: MingcuteBrainLine,
    Ticket: MajesticonsTicket,
    Weight: MaterialSymbolsWeight
} as const;

export const STAT_LABELS = {
    // --- Básicos / Gestión del Tiempo ---
    EN_AULA: 'En Aula',
    EFICIENCIA: 'Eficiencia', // Ratio Permanencia/Aula
    ESTUDIO_AUTONOMO: 'Estudio Autónomo',
    ENFOQUE: 'Enfoque', // Peso Promedio (Fragmentado/Denso)

    // --- Topología (Forma del Horario) ---
    FRAGMENTACION: 'Fragmentación', // Queso Suizo
    PERFIL_CARGA: 'Perfil de Carga', // Ascendente/Descendente
    BAJA_CARGA: 'Día de Baja Carga', // Zen
    ALTA_INTENSIDAD: 'Día de Alta Intensidad', // Hardcore
    HORARIO: 'Horario', // Compacto (Estado ideal)
    VENTANAS: 'Ventanas', // Estado general de ventanas

    // --- Logística / Realidad Física ---
    ACTIVACION: 'Costo de Activación', // ROC (Viajar mucho por poco)
    TRANSPORTE: 'Transporte', // Hora Punta vs Valle
    SEGURIDAD: 'Seguridad', // Salida Noche / Llegada Tarde

    // --- Fisiología Sansana ---
    SUEÑO: 'Estabilidad del Sueño', // Varianza / Jetlag
    RECUPERACIÓN_TRANSLADO: 'Recuperación y Traslado', // Horas sueño netas
    NUTRICION: 'Logística de Almuerzo', // Ventana Ajustada / Sin Almuerzo
    REGULARIDAD: 'Regularidad', // Anclaje matutino (Legacy, merged into Sueño usually but kept for compatibility)

    // --- Estrategia y Currículum ---
    SATURACION: 'Saturación Temática', // Bloques de Muerte (Hard streaks)
    SOBRECARGA_CONTINUA: 'Sobrecarga Continua', // Maratón (Any streaks)
    IMMERSION: 'Inmersión Práctica', // Inmersión
    DEMANDA: 'Demanda de Cupos', // Prioridad Académica
    TRAYECTORIA: 'Trayectoria', // Dispersión Malla
    DEPENDENCIAS: 'Dependencias', // Requisitos
    TEMÁTICA: 'Temática', // Monotemático (Depto)
    CONFLICTOS: 'Conflictos' // Topes
} as const;

export type StatLabel = (typeof STAT_LABELS)[keyof typeof STAT_LABELS];
export type StatStatus = 'success' | 'warning' | 'danger' | null;

export type StatItem = {
    icon: any; // Se pasa desde el componente
    label: StatLabel;
    value: string;
    tooltip: string;
    status?: StatStatus;
};

export type AnalyzerContext = {
    ramos: Ramo[];
    sede: string;
    jornada: string;
    semestre: string;
    tiempoTraslado: number;
    esTiempoEstimado: boolean;
    ventanas: { día: Días; bloque: number; duraciónBloques: number }[];
};