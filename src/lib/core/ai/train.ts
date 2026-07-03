// src/lib/ai/train.ts
import { NeuralNetwork } from './mini-brain';
import { generateTrainingData } from './generator';
import { AI_CONFIG } from './types';

// Opcional: Si lo corres con node/bun fuera del navegador, necesitarás polyfills o quitar referencias a 'window'.
// Como es parte del build web, asumiremos que se invoca bajo demanda o en build time.

export function trainModels() {
    console.log('🧠 [AI Trainer] Iniciando entrenamiento...');
    const data = generateTrainingData(3000); // Generamos 3000 muestras

    // Inicializar Redes
    const distNN = new NeuralNetwork(AI_CONFIG.dist.layers);
    const rhythmNN = new NeuralNetwork(AI_CONFIG.rhythm.layers);
    const structureNN = new NeuralNetwork(AI_CONFIG.structure.layers);

    const EPOCHS = 5000;
    const LEARNING_RATE = 0.1;

    // Ajustar LR
    distNN.learningRate = LEARNING_RATE;
    rhythmNN.learningRate = LEARNING_RATE;
    structureNN.learningRate = LEARNING_RATE;

    // Loop de entrenamiento
    for (let i = 0; i < EPOCHS; i++) {
        // Random Sampling
        const sDist = data.trainingSetDist[Math.floor(Math.random() * data.trainingSetDist.length)];
        const sRhythm = data.trainingSetRhythm[Math.floor(Math.random() * data.trainingSetRhythm.length)];
        const sStruct = data.trainingSetStructure[Math.floor(Math.random() * data.trainingSetStructure.length)];

        distNN.train(sDist.in, sDist.out);
        rhythmNN.train(sRhythm.in, sRhythm.out);
        structureNN.train(sStruct.in, sStruct.out);

        if (i % 1000 === 0) console.log(`🧠 [AI Trainer] Epoch ${i}/${EPOCHS}`);
    }

    console.log('🧠 [AI Trainer] Entrenamiento completado.');

    // Preparamos el objeto con las claves exactas que el classifier espera leer (dist, rhythm, structure)
    const trainedData = {
        dist: distNN.toJSON(),
        rhythm: rhythmNN.toJSON(),
        structure: structureNN.toJSON(),
        timestamp: Date.now()
    };

    // --- NUEVO: Salida JSON para copiar en consola (Solo DEV) ---
    if (import.meta.env.DEV) {
        console.log('%c📋 [AI GENERATOR] JSON LISTO PARA COPIAR:', 'color: #10b981; font-weight: bold; font-size: 12px;');
        console.log(JSON.stringify(trainedData));
    }

    return trainedData;
}