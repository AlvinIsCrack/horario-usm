// src/lib/ai/mini-brain.ts

/**
 * Una implementación minimalista de una Red Neuronal (MLP)
 * para correr en el navegador sin dependencias pesadas.
 */
export class NeuralNetwork {
    inputNodes: number;
    hiddenNodes: number;
    outputNodes: number;
    learningRate: number;
    weightsIH: number[][]; // Input -> Hidden
    weightsHO: number[][]; // Hidden -> Output
    biasH: number[];
    biasO: number[];

    constructor(inputNodes: number, hiddenNodes: number, outputNodes: number) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;
        this.learningRate = 0.1;

        // Inicialización aleatoria de pesos (-1 a 1)
        this.weightsIH = Array(this.hiddenNodes)
            .fill(0)
            .map(() =>
                Array(this.inputNodes)
                    .fill(0)
                    .map(() => Math.random() * 2 - 1)
            );
        this.weightsHO = Array(this.outputNodes)
            .fill(0)
            .map(() =>
                Array(this.hiddenNodes)
                    .fill(0)
                    .map(() => Math.random() * 2 - 1)
            );
        this.biasH = Array(this.hiddenNodes)
            .fill(0)
            .map(() => Math.random() * 2 - 1);
        this.biasO = Array(this.outputNodes)
            .fill(0)
            .map(() => Math.random() * 2 - 1);
    }

    // Función de activación Sigmoid
    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    // Derivada de Sigmoid (para entrenamiento)
    private dsigmoid(y: number): number {
        return y * (1 - y);
    }

    predict(inputArray: number[]): number[] {
        // 1. Input -> Hidden
        let hidden = this.weightsIH.map((row, i) =>
            this.sigmoid(
                row.reduce((sum, weight, j) => sum + weight * inputArray[j], 0) + this.biasH[i]
            )
        );

        // 2. Hidden -> Output
        let output = this.weightsHO.map((row, i) =>
            this.sigmoid(
                row.reduce((sum, weight, j) => sum + weight * hidden[j], 0) + this.biasO[i]
            )
        );

        return output;
    }

    train(inputArray: number[], targetArray: number[]) {
        // --- Feedforward (igual que predict) ---
        let hidden = this.weightsIH.map((row, i) =>
            this.sigmoid(
                row.reduce((sum, weight, j) => sum + weight * inputArray[j], 0) + this.biasH[i]
            )
        );

        let outputs = this.weightsHO.map((row, i) =>
            this.sigmoid(
                row.reduce((sum, weight, j) => sum + weight * hidden[j], 0) + this.biasO[i]
            )
        );

        // --- Backpropagation ---

        // 1. Calcular errores de Salida (Target - Output)
        let outputErrors = targetArray.map((t, i) => t - outputs[i]);

        // 2. Calcular gradientes Salida
        let gradients = outputs.map((o, i) => this.dsigmoid(o) * outputErrors[i] * this.learningRate);

        // 3. Ajustar Pesos Hidden -> Output
        this.weightsHO = this.weightsHO.map((row, i) =>
            row.map((w, j) => w + gradients[i] * hidden[j])
        );
        this.biasO = this.biasO.map((b, i) => b + gradients[i]);

        // 4. Calcular errores Ocultos
        // (Transpuesta de weightsHO * outputErrors)
        let hiddenErrors = Array(this.hiddenNodes)
            .fill(0)
            .map((_, i) =>
                this.weightsHO.reduce((sum, row, j) => sum + row[i] * outputErrors[j], 0)
            );

        // 5. Calcular gradientes Ocultos
        let hiddenGradients = hidden.map(
            (h, i) => this.dsigmoid(h) * hiddenErrors[i] * this.learningRate
        );

        // 6. Ajustar Pesos Input -> Hidden
        this.weightsIH = this.weightsIH.map((row, i) =>
            row.map((w, j) => w + hiddenGradients[i] * inputArray[j])
        );
        this.biasH = this.biasH.map((b, i) => b + hiddenGradients[i]);
    }

    // Exportar/Importar cerebro (pesos)
    toJSON() {
        return {
            wIH: this.weightsIH,
            wHO: this.weightsHO,
            bH: this.biasH,
            bO: this.biasO
        };
    }

    fromJSON(data: any) {
        this.weightsIH = data.wIH;
        this.weightsHO = data.wHO;
        this.biasH = data.bH;
        this.biasO = data.bO;
    }
}