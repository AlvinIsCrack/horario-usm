export type NodeId = string;
export type PortId = string;

export type LogType = 'info' | 'warning' | 'success' | 'drop' | 'replace' | 'error';

export interface ExecutionLog {
    sourceNodeId: NodeId; // El nodo lógico que genera el aviso (ej: "logic_recup")
    targetNodeId?: NodeId; // El nodo afectado (ej: "c1"), si se puede determinar
    targetIndex?: number;  // Si es un array, qué índice fue afectado
    type: LogType;
    message: string;
}

// Contexto que se pasa a cada función compute()
export interface RuntimeContext {
    log: (entry: Omit<ExecutionLog, 'sourceNodeId'>) => void;
    // Podríamos agregar más cosas aquí en el futuro (ej: acceso a grafo global readonly)
}

// Tipos de datos que fluyen por el grafo
export type ValueType = number | boolean | number[] | null;

export interface Group {
    nodes: NodeId[];
    label: string;
    category: NodeCategory;
}

export interface Connection {
    fromNode: NodeId;
    fromPort: string; // 'output' generalmente, pero permite múltiples salidas
    toNode: NodeId;
    toPort: PortId;
}

export interface NodeConfig {
    id: NodeId;
    type: string; // 'input', 'weighted_avg', 'logic_switch', etc.
    label?: string;
    optional?: boolean;
    data: Record<string, any>;
}

export interface Graph {
    nodes: NodeConfig[];
    connections: Connection[];
    groups: Group[];
}

export type NodeCategory = 'input' | 'math' | 'flow' | 'logic' | 'usm';

// Interfaz para la definición de un Tipo de Nodo (La "Clase")
export interface NodeDefinition {
    type: string;
    label: string;
    category: NodeCategory;
    inputs: Record<PortId, { label: string; type: 'number' | 'boolean' | 'array' | 'any' }>;
    outputs: Record<string, { label: string; type: 'number' | 'boolean' | 'array' | 'any' }>;
    // Función pura: Recibe inputs calculados y su propia config data, retorna outputs
    compute: (
        inputs: Record<PortId, ValueType>,
        config: Record<string, any>,
        context: RuntimeContext
    ) => Record<string, ValueType>;
}