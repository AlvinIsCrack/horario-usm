export interface Metadata {
    version: number;
    status: string;
    generatedAt: {
        unix: number;
        iso: string;
    };
    system: {
        scraperVersion: string;
        environment: string;
        executionTimeSeconds: number;
    };
    stats: {
        totalAsignaturas: number;
        totalParalelos: number;
    };
    files: Record<string, {
        hash: string;
        updatedAt: number;
        cambiosUltimaEjecucion?: number;
        size?: number;
    }>;
}

export interface Menciones {
    [mencion: string]: {
        nombre: string;
        planes: Planes;
    };
}

export interface Planes {
    [plan: string]: {
        plan: string;
        malla: Semestre[];
    };
}

export interface Semestre {
    [sigla: string]: RamoCarrera;
}

export interface Carrera {
    nombre: string;
    código: string;
    sede: string;
    jornada: string;
    "menciones/especialidades": Menciones;
}

export interface RamoPrograma {
    tipo: "IMPAR" | "PAR" | "AMBOS" | "ELECTIVO";
    sigla: string;
    nombre: string;
    creditos: number;
    programa: string;
}

export interface RequisitoFicha {
    sigla: string;
    tipo?: "PRE" | "CO"; // Opcional porque equivalencias podría no tenerlo o el backend variar
}

export interface RamoCarrera {
    nombre: string;
    creditos: number;
    departamento: string;
    horas: {
        teoricas: number;
        practicas: number;
        laboratorios: number;
        ayudantias: number;
    };
    requisitos: RequisitoFicha[][];
    equivalencias: RequisitoFicha[][];
}
