/**
 * Una implementación de Red Neuronal Profunda (Deep MLP)
 * Soporta N capas ocultas dinámicas.
 */
export class NeuralNetwork {
    layerSizes: number[]; // Ej: [5, 8, 8, 6] (Input, Hidden1, Hidden2, Output)
    learningRate: number;
    weights: number[][][]; // Array de matrices de pesos entre capas
    biases: number[][];    // Array de arrays de sesgos para cada capa (excepto input)

    /**
     * @param layerSizes Array con el tamaño de cada capa. Ej: [5, 10, 10, 3]
     */
    constructor(layerSizes: number[]) {
        this.layerSizes = layerSizes;
        this.learningRate = 0.1;
        this.weights = [];
        this.biases = [];

        // Inicializar Pesos y Bias para cada conexión entre capas
        for (let i = 0; i < layerSizes.length - 1; i++) {
            const currentSize = layerSizes[i];     // Nodos capa actual (Inputs hacia la siguiente)
            const nextSize = layerSizes[i + 1];    // Nodos capa siguiente (Outputs de la actual)

            // Weights: [nextSize][currentSize]
            const layerWeights = Array(nextSize).fill(0).map(() =>
                Array(currentSize).fill(0).map(() => Math.random() * 2 - 1)
            );
            this.weights.push(layerWeights);

            // Biases: [nextSize]
            const layerBias = Array(nextSize).fill(0).map(() => Math.random() * 2 - 1);
            this.biases.push(layerBias);
        }
    }

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private dsigmoid(y: number): number {
        return y * (1 - y);
    }

    predict(inputArray: number[]): number[] {
        let currentOutput = inputArray;

        // Feedforward a través de todas las capas
        for (let i = 0; i < this.weights.length; i++) {
            currentOutput = this.weights[i].map((row, j) => {
                const sum = row.reduce((acc, weight, k) => acc + weight * currentOutput[k], 0);
                return this.sigmoid(sum + this.biases[i][j]);
            });
        }
        return currentOutput;
    }

    train(inputArray: number[], targetArray: number[]) {
        // 1. Feedforward (Guardando los outputs de cada capa para el backprop)
        let outputs: number[][] = [inputArray];

        for (let i = 0; i < this.weights.length; i++) {
            const prevLayer = outputs[i];
            const layerOutput = this.weights[i].map((row, j) => {
                const sum = row.reduce((acc, weight, k) => acc + weight * prevLayer[k], 0);
                return this.sigmoid(sum + this.biases[i][j]);
            });
            outputs.push(layerOutput);
        }

        // 2. Backpropagation
        // Calculamos el error inicial (Target - Output Final)
        let currentError = targetArray.map((t, i) => t - outputs[outputs.length - 1][i]);

        // Recorremos las capas desde la última hacia atrás
        for (let i = this.weights.length - 1; i >= 0; i--) {
            const layerOutput = outputs[i + 1]; // Salida de la capa actual
            const prevOutput = outputs[i];      // Salida de la capa anterior (Input para esta)

            // Calcular gradientes para esta capa
            const gradients = layerOutput.map((val, j) =>
                val * (1 - val) * currentError[j] * this.learningRate // dsigmoid(val) * error * lr
            );

            // Calcular los errores para la capa ANTERIOR (antes de modificar pesos actuales)
            // ErrorPrevio = Transpuesta(Pesos) * ErrorActual
            const prevError = Array(prevOutput.length).fill(0).map((_, k) =>
                this.weights[i].reduce((sum, row, j) => sum + row[k] * currentError[j], 0)
            );

            // Ajustar Pesos (Deltas) y Biases
            this.weights[i] = this.weights[i].map((row, j) =>
                row.map((w, k) => w + gradients[j] * prevOutput[k])
            );
            this.biases[i] = this.biases[i].map((b, j) => b + gradients[j]);

            // Pasar el error hacia atrás
            currentError = prevError;
        }
    }

    // Exportar pesos (Formato nuevo compatible con JSON simple)
    toJSON() {
        return {
            weights: this.weights,
            biases: this.biases
        };
    }

    fromJSON(data: any) {
        this.weights = data.weights;
        this.biases = data.biases;
        // Inferir layerSizes basado en los pesos cargados podría ser necesario si se requiere reiniciar,
        // pero para predecir solo necesitamos weights/biases.
    }
}