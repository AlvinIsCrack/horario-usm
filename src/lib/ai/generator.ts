// src/lib/ai/generator.ts
import { DISTRIBUTION_LABELS, RHYTHM_LABELS, STRUCTURE_LABELS } from './types';

// Función auxiliar de ruido
const noise = (val: number, intensity = 0.15) => {
    const n = (Math.random() - 0.5) * intensity;
    return Math.max(0, Math.min(1, val + n));
};

const createTarget = (index: number, total: number) => {
    const t = new Array(total).fill(0);
    t[index] = 1;
    return t;
};

export function generateTrainingData(samples = 2000) {
    const trainingSetDist: { in: number[], out: number[] }[] = [];
    const trainingSetRhythm: { in: number[], out: number[] }[] = [];
    const trainingSetStructure: { in: number[], out: number[] }[] = [];

    const targetDist = (idx: number) => createTarget(idx, DISTRIBUTION_LABELS.length);
    const targetRhythm = (idx: number) => createTarget(idx, RHYTHM_LABELS.length);
    const targetStruct = (idx: number) => createTarget(idx, STRUCTURE_LABELS.length);

    for (let i = 0; i < samples; i++) {
        // ---------------------------------------------------------
        // 1. TOPOLOGÍA (Distribución de Carga L-V)
        // ---------------------------------------------------------
        // Uniforme [0.5, 0.5, 0.5, 0.5, 0.5]
        trainingSetDist.push({ in: [0.5, 0.5, 0.5, 0.5, 0.5].map(v => noise(v)), out: targetDist(0) });

        // Decreciente [1.0, 0.8, 0.5, 0.2, 0.0]
        trainingSetDist.push({ in: [1.0, 0.8, 0.5, 0.2, 0.1].map(v => noise(v)), out: targetDist(1) });

        // Creciente [0.1, 0.2, 0.5, 0.8, 1.0]
        trainingSetDist.push({ in: [0.1, 0.2, 0.5, 0.8, 1.0].map(v => noise(v)), out: targetDist(2) });

        // Campana [0.2, 0.6, 1.0, 0.6, 0.2]
        trainingSetDist.push({ in: [0.2, 0.6, 1.0, 0.6, 0.2].map(v => noise(v)), out: targetDist(3) });

        // Valle [1.0, 0.3, 0.1, 0.3, 1.0]
        trainingSetDist.push({ in: [1.0, 0.3, 0.1, 0.3, 1.0].map(v => noise(v)), out: targetDist(4) });

        // Irregular (Aleatorio fuerte)
        trainingSetDist.push({
            in: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
            out: targetDist(5)
        });

        // ---------------------------------------------------------
        // 2. RITMO (Centros de Gravedad Diarios)
        // Input: 5 valores (0.0 = 8am, 1.0 = 8pm)
        // ---------------------------------------------------------

        // Alondra: Centros bajos (< 0.35)
        trainingSetRhythm.push({
            in: Array(5).fill(0).map(() => noise(0.25, 0.2)),
            out: targetRhythm(0)
        });

        // Vespertino: Centros altos (> 0.65)
        trainingSetRhythm.push({
            in: Array(5).fill(0).map(() => noise(0.75, 0.2)),
            out: targetRhythm(1)
        });

        // Jornada Completa: Centros dispersos, pero promedio general ~0.5 con alta varianza simulada
        // (Nota: El centro de gravedad de 8am y 8pm es 2pm, igual que alguien que solo va a las 2pm.
        //  Para diferenciar, necesitaríamos input de "Spread" (dispersión), pero por ahora simplificamos a "Oficinista" vs "Full").
        //  Simularemos Jornada Completa como valores medios muy estables (estás todo el día).
        trainingSetRhythm.push({
            in: [0.5, 0.5, 0.5, 0.5, 0.5].map(v => noise(v, 0.05)), // Muy centrado, sin sesgo AM/PM fuerte
            out: targetRhythm(2)
        });

        // Oficinista: Rango medio estricto (0.4 - 0.6)
        trainingSetRhythm.push({
            in: Array(5).fill(0).map(() => 0.4 + Math.random() * 0.2),
            out: targetRhythm(3)
        });

        // Noctámbulo: Muy alto (> 0.8)
        trainingSetRhythm.push({
            in: Array(5).fill(0).map(() => noise(0.9, 0.1)),
            out: targetRhythm(4)
        });

        // ---------------------------------------------------------
        // 3. ESTRUCTURA (Entropía y Fragmentación)
        // Inputs: [GapRatio, Efficiency, StreakNorm]
        // ---------------------------------------------------------

        // Bloque Sólido: 0 Gaps, Alta Eficiencia
        trainingSetStructure.push({
            in: [noise(0.0), noise(1.0), noise(0.4)], // Pocos gaps, alta eficiencia, streak medio
            out: targetStruct(0)
        });
        // Sólido extremo (Maratón)
        trainingSetStructure.push({
            in: [0, 1.0, 1.0], // Streak máximo
            out: targetStruct(0)
        });

        // Queso Suizo: Muchos Gaps, Baja Eficiencia, Streaks cortos
        trainingSetStructure.push({
            in: [noise(0.5), noise(0.5), noise(0.1)], // 50% del tiempo es hueco
            out: targetStruct(1)
        });

        // Archipiélago: Gaps medios/altos, pero Streaks medios (Bloques grandes separados)
        trainingSetStructure.push({
            in: [noise(0.4), noise(0.6), noise(0.5)],
            out: targetStruct(2)
        });

        // Equilibrado: Gaps bajos/medios, Eficiencia buena
        trainingSetStructure.push({
            in: [noise(0.2), noise(0.8), noise(0.3)],
            out: targetStruct(3)
        });
    }

    return { trainingSetDist, trainingSetRhythm, trainingSetStructure };
}