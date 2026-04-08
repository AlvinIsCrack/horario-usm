import { Engine } from './engine';
import type { Graph, NodeId } from './types';

export class Solver {
    private engine: Engine;
    private graph: Graph;

    private opsCount = 0;
    private lastYieldTime = 0;

    constructor(graph: Graph) {
        // Clonamos el grafo para no afectar el estado visual de la UI
        this.graph = JSON.parse(JSON.stringify(graph));
        this.engine = new Engine(this.graph);
    }

    private isSuccess(val: any, target: number): boolean {
        if (typeof val !== 'number') return false;
        // AQUÍ ESTÁ LA CLAVE: El solver valida contra el redondeo, 
        // aunque el nodo devuelva decimales.
        return Math.round(val) >= target;
    }

    /**
     * Calcula los requisitos mínimos utilizando una estrategia optimizada
     * de Búsqueda Binaria + Descenso Greedy (Hill Climbing Inverso).
     */
    public async calculateRequirementsForAllMissing(
        targetNodeId: NodeId,
        targetValue: number = 55
    ): Promise<Record<NodeId, number | null> | null> { // CAMBIO: Tipo de retorno puede ser null

        this.opsCount = 0;
        this.lastYieldTime = performance.now();

        // 1. Identificar Inputs faltantes
        const missingInputs = this.graph.nodes.filter(
            (n) => n.type === 'input_grade' && (n.data.value === null || n.data.value === undefined)
        );

        if (missingInputs.length === 0) return {};

        // ... (Lógica de separación regular/recovery se mantiene igual) ...
        const recoveryInputIds = new Set<string>();
        // ...
        const regularNodes = missingInputs.filter(n => !recoveryInputIds.has(n.id));
        const recoveryNodes = missingInputs.filter(n => recoveryInputIds.has(n.id));

        // --- FASE 1: Intentar resolver solo con notas regulares ---
        this.setNodesValue(recoveryNodes, null);

        this.setNodesValue(regularNodes, 100);
        this.engine.reset();
        const bestCase = await this.engine.evaluate(targetNodeId);

        if (typeof bestCase === 'number' && bestCase >= targetValue) {
            const solution = await this.solveOptimized(regularNodes, targetNodeId, targetValue);
            return this.buildResult(regularNodes, solution, recoveryNodes, null);
        }

        // --- FASE 2: Modo Pánico (Usar recuperativos) ---
        const allNodes = [...regularNodes, ...recoveryNodes];

        this.setNodesValue(allNodes, 100);
        this.engine.reset();
        const panicCase = await this.engine.evaluate(targetNodeId);

        if (typeof panicCase === 'number' && panicCase >= targetValue) {
            const solution = await this.solveOptimized(allNodes, targetNodeId, targetValue);
            return this.buildResult(allNodes, solution, [], null);
        }

        // CAMBIO: Si es imposible, devolvemos null explícitamente en lugar de un objeto con nulls.
        return null;
    }

    /**
     * Algoritmo de resolución optimizado (Reemplaza al Backtracking)
     */
    private async solveOptimized(
        nodes: any[],
        targetId: string,
        targetVal: number
    ): Promise<number[]> {
        // PASO A: Encontrar el "Piso Uniforme".
        // Buscamos qué nota necesitan TODOS si tuvieran la misma nota (ej: todos un 58).
        // Esto reduce el espacio de búsqueda drásticamente.
        const uniformVal = await this.findUniformBound(nodes, targetId, targetVal);

        if (uniformVal === null) return new Array(nodes.length).fill(100); // Fallback

        // Configuración inicial: Todos con la nota uniforme mínima
        const currentSolution = new Array(nodes.length).fill(uniformVal);

        // PASO B: Refinamiento Greedy (Afeitado).
        // Intentamos bajar las notas individualmente tanto como sea posible
        // manteniendo la aprobación.

        // 1. Intentamos bajar notas que no impactan (ej: notas borradas por "drop_worst")
        // Probamos ponerlas a 0 una por una.
        for (let i = 0; i < nodes.length; i++) {
            await this.checkYield();
            const originalVal = currentSolution[i];

            currentSolution[i] = 0; // Intento agresivo
            this.setNodesValueByArray(nodes, currentSolution);
            this.engine.reset();
            const res = await this.engine.evaluate(targetId);

            if (this.isSuccess(res, targetVal)) {
                continue;
            } else {
                currentSolution[i] = originalVal;
            }
        }

        // 2. Ajuste Fino (Fine Tuning)
        // Intentamos bajar punto por punto las notas restantes
        let improved = true;
        while (improved) {
            improved = false;
            for (let i = 0; i < nodes.length; i++) {
                await this.checkYield();
                if (currentSolution[i] > 0) {
                    currentSolution[i]--; // Bajar 1 punto

                    this.setNodesValueByArray(nodes, currentSolution);
                    this.engine.reset();
                    const res = await this.engine.evaluate(targetId);

                    if (this.isSuccess(res, targetVal)) {
                        improved = true;
                    } else {
                        currentSolution[i]++; // Revertir
                    }
                }
            }
        }

        return currentSolution;
    }

    /**
     * Búsqueda Binaria para encontrar el valor uniforme mínimo.
     * Es extremadamente rápido O(log 100).
     */
    private async findUniformBound(nodes: any[], targetId: string, targetVal: number): Promise<number | null> {
        let low = 0, high = 100;
        let ans: number | null = null;

        while (low <= high) {
            await this.checkYield();
            const mid = Math.floor((low + high) / 2);
            this.setNodesValue(nodes, mid);
            this.engine.reset();
            const res = await this.engine.evaluate(targetId);

            if (this.isSuccess(res, targetVal)) {
                ans = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return ans;
    }

    private buildResult(nodesA: any[], valuesA: number[] | null, nodesB: any[], valB: number | null) {
        const result: Record<string, number | null> = {};
        if (valuesA) {
            nodesA.forEach((n, i) => result[n.id] = valuesA[i]);
        } else {
            nodesA.forEach(n => result[n.id] = null);
        }
        nodesB.forEach(n => result[n.id] = valB);
        return result;
    }

    private setNodesValue(nodes: any[], value: number | null) {
        nodes.forEach(n => {
            const nodeRef = this.graph.nodes.find(x => x.id === n.id);
            if (nodeRef) nodeRef.data.value = value;
        });
    }

    private setNodesValueByArray(nodes: any[], values: number[]) {
        nodes.forEach((n, i) => {
            const nodeRef = this.graph.nodes.find(x => x.id === n.id);
            if (nodeRef) nodeRef.data.value = values[i];
        });
    }

    private async checkYield() {
        this.opsCount++;
        if (this.opsCount % 50 === 0) { // Check más frecuente
            const now = performance.now();
            if (now - this.lastYieldTime > 8) { // Yield más agresivo (8ms vs 12ms)
                await new Promise(resolve => setTimeout(resolve, 0));
                this.lastYieldTime = performance.now();
            }
        }
    }
}