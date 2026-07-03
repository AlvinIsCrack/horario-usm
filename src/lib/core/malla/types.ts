export type RequisitoObj = { sigla: string; tipo?: 'PRE' | 'CO' };
export type Requisito = RequisitoObj[]; // Un grupo (AND) es un array de objetos

export interface RamoMalla {
    sigla: string;
    nombre: string;
    creditos: number;
    requisitos: Requisito[]; // Array de grupos (OR)
    esElectivo: boolean;
    esHumanista: boolean;
    locked?: boolean;
    checked?: boolean;
    isDependency?: boolean; // Depende del hover (pero quizás le falten otros ramos)
    isUnlock?: boolean;     // Depende del hover Y es lo único que le falta (se desbloquea ahora)
    isPreRequisite?: boolean;
    isCoRequisite?: boolean;
}

export type Semestre = RamoMalla[];
export type Malla = Semestre[];

export interface Connection {
    path: string;
    type: 'pre' | 'dep' | 'co';
    semesterDiff?: number;
}