// src/lib/logic/optimizador/engine.ts
import { NODE_REGISTRY } from './nodes';
import type { ExecutionLog, Graph, NodeId, RuntimeContext, ValueType } from './types';

export class Engine {
    private graph: Graph;
    private cache: Map<NodeId, Record<string, ValueType>> = new Map();
    private logs: ExecutionLog[] = [];

    constructor(graph: Graph) {
        this.graph = graph;
    }

    /**
     * Limpia la memoria caché. Debe llamarse antes de una nueva evaluación
     * si los inputs han cambiado.
     */
    public reset() {
        this.cache.clear();
        this.logs = []; // CORRECCIÓN: Limpiar logs antiguos para evitar acumulación
    }

    // Getter para obtener los logs después de evaluar
    public getLogs(): ExecutionLog[] {
        return this.logs;
    }

    public getNodeState(nodeId: NodeId): Record<string, ValueType> | undefined {
        return this.cache.get(nodeId);
    }

    /**
     * Obtiene el valor de un puerto específico de un nodo.
     * Si el nodo no está calculado, desencadena su cálculo (y el de sus dependencias).
     */
    public async getNodeValue(nodeId: NodeId, port: string = 'value'): Promise<ValueType> {
        // 1. Revisar Caché (Memoización)
        if (this.cache.has(nodeId)) {
            return this.cache.get(nodeId)?.[port] ?? null;
        }

        // 2. Si no está en caché, calculamos el nodo completo.
        // Llamamos a computeNodeInternal. Al ser público, el Visualizador puede
        // interceptar esta llamada para inyectar retardos (Slow Motion).
        const outputs = await this.computeNodeInternal(nodeId);

        // 3. Retornar el valor del puerto solicitado
        return outputs[port] ?? null;
    }

    /**
     * Calcula los outputs de un nodo específico.
     * IMPORTANTE: Este método es PÚBLICO para permitir "Monkey Patching"
     * (ser envuelto) por herramientas de visualización/debug.
     */
    public async computeNodeInternal(nodeId: NodeId): Promise<Record<string, ValueType>> {
        // Doble check de caché por si se resolvió durante la recursión paralela
        if (this.cache.has(nodeId)) {
            return this.cache.get(nodeId)!;
        }

        const node = this.graph.nodes.find((n) => n.id === nodeId);
        if (!node) return {};

        const def = NODE_REGISTRY[node.type];
        if (!def) {
            console.warn(`Tipo de nodo desconocido: ${node.type}`);
            return {};
        }

        // --- A. Resolver Inputs (Recursión) ---
        const inputs: Record<string, ValueType> = {};
        const incomingEdges = this.graph.connections.filter((c) => c.toNode === nodeId);
        const inputsByPort: Record<string, ValueType[]> = {};

        // Guardamos metadatos de origen para rastrear índices
        // sourceMap[port][index] = nodeId_de_origen
        const sourceMap: Record<string, NodeId[]> = {};

        for (const edge of incomingEdges) {
            // Solicitamos recursivamente el valor al nodo anterior
            const val = await this.getNodeValue(edge.fromNode, edge.fromPort);

            if (!inputsByPort[edge.toPort]) {
                inputsByPort[edge.toPort] = [];
                sourceMap[edge.toPort] = [];
            }
            inputsByPort[edge.toPort].push(val);
            sourceMap[edge.toPort].push(edge.fromNode);
        }

        // 3. Asignar los valores finales según la definición del nodo
        for (const [portKey, portDef] of Object.entries(def.inputs)) {
            const vals = inputsByPort[portKey];

            if (portDef.type === 'array') {
                // Si el puerto acepta arrays, pasamos todos los valores conectados
                //@ts-ignore
                inputs[portKey] = vals ?? [];
            } else {
                // Si es valor único, tomamos el primero (o null si está desconectado)
                inputs[portKey] = vals && vals.length > 0 ? vals[0] : null;
            }
        }

        // --- B. Computar ---
        const context: RuntimeContext = {
            log: (entry) => {
                // Intentamos resolver el targetNodeId si nos dieron un index y un port
                // (Por defecto asumimos que el array principal se llama 'notes' o 'values' o 'in')
                let resolvedTarget = entry.targetNodeId;

                // Magia: Si el nodo dice "afecté al índice 2", buscamos quién estaba conectado ahí.
                // Esto asume que el nodo opera sobre el puerto 'notes' o 'in' principalmente.
                if (!resolvedTarget && entry.targetIndex !== undefined) {
                    // Buscamos en los puertos comunes de arrays
                    const arrayPort = inputs['notes'] ? 'notes' : (inputs['values'] ? 'values' : 'in');
                    if (sourceMap[arrayPort] && sourceMap[arrayPort][entry.targetIndex]) {
                        resolvedTarget = sourceMap[arrayPort][entry.targetIndex];
                    }
                }

                this.logs.push({
                    sourceNodeId: nodeId,
                    targetNodeId: resolvedTarget,
                    ...entry
                });
            }
        };

        const outputs = def.compute(inputs, node.data, context);
        this.cache.set(nodeId, outputs);
        return outputs;
    }

    /**
     * Método helper para iniciar la evaluación completa solicitando el nodo final.
     * Busca automáticamente un puerto de salida común ('value', 'result', etc).
     */
    public async evaluate(targetNodeId: NodeId): Promise<ValueType> {
        this.reset();

        // Intentamos obtener el valor de los puertos de salida más comunes
        const val = await this.getNodeValue(targetNodeId, 'value') ??
            await this.getNodeValue(targetNodeId, 'result') ??
            await this.getNodeValue(targetNodeId, 'final') ??
            await this.getNodeValue(targetNodeId, 'out');

        return val;
    }
}