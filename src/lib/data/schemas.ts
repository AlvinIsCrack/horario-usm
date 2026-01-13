import { z } from "zod";
import { TipoBloque } from "$lib/logic/ramos/types";

// Esquemas base
export const BloqueSchema = z.object({
    bloque: z.number(),
    tipo: z.nativeEnum(TipoBloque).or(z.string().transform(val => val as TipoBloque)), // Tolerancia a strings
    sala: z.string(),
    campus: z.string(),
    profesor: z.string(),
    dia: z.number().min(0).max(6)
});

// Esquema para la data cruda que viene del scraper (JSON Asignaturas)
export const RamoRawSchema = z.object({
    nombre: z.string(),
    sigla: z.string(),
    horario: z.array(BloqueSchema),
    profesor: z.array(z.string()),
    paralelo: z.string(),
    cupo: z.number().optional()
});

// Esquema para la info de Carrera (JSON Planes)
export const RequisitoSchema = z.object({
    sigla: z.string(),
    tipo: z.enum(["PRE", "CO"]).optional()
});

export const RamoCarreraSchema = z.object({
    nombre: z.string(),
    creditos: z.number(),
    departamento: z.string(),
    // Estructura compleja de requisitos: (A y B) o (C)
    requisitos: z.array(z.array(RequisitoSchema)).optional(),
    equivalencias: z.array(z.array(RequisitoSchema)).optional()
});

export type RamoRaw = z.infer<typeof RamoRawSchema>;