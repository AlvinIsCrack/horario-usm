import type { RequisitoFicha } from "$lib/types/horario";
import type { ColorInstance } from "color";

export enum Días {
    Lunes = 0,
    Martes = 1,
    Miércoles = 2,
    Jueves = 3,
    Viernes = 4,
    Sábado = 5,
    Domingo = 6
}

export enum TipoBloque {
    Cátedra = "Cát",
    Ayudantía = "Ayu",
    Laboratorio = "Lab",
    Recitación = "Rec",
    Práctica = "Prá",
    Otro = "Otr",
}

// Sub-entidades
export interface Bloque {
    bloque: number;
    tipo: TipoBloque;
    sala: string;
    campus: string;
    profesor: string;
    dia: number;
    // Referencia circular opcional o manejada en lógica superior si es necesaria
    ramo?: Ramo;
}

// Entidad Principal (Hidratada)
export interface Ramo {
    // Propiedades Base (raw)
    sigla: string;
    nombre: string;
    profesor: string[];
    paralelo: string;
    horario: Bloque[];

    // Propiedades de UI/Estado
    color?: ColorInstance;
    highlighted?: boolean;

    // Propiedades Hidratadas (Contexto Académico)
    // Son opcionales porque dependen de si se encuentra la info en Data/Config
    creditos?: number;
    departamento?: string;
    tipoCurricular?: "IMPAR" | "PAR" | "AMBOS" | "ELECTIVO"; // Derivado del programa
    cupo?: number;

    horas?: {
        teoricas: number;
        practicas: number;
        laboratorios: number;
        ayudantias: number;
    };
    requisitos?: RequisitoFicha[][];
    equivalencias?: RequisitoFicha[][];

    // Información específica de la carrera (si aplica)
    // requisitos?: string[];
    // conflict?: boolean;
}

// Tipos auxiliares para la carga de datos (Legacy/Data mapping)
export interface RamoRawData {
    nombre: string;
    sigla: string;
    horario: Bloque[];
    profesor: string[];
    paralelo: string;
    cupo?: number;
}