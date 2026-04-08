import type { NodeDefinition, ValueType } from './types';

// Helper para seguridad de tipos
const asNumber = (v: ValueType): number => (typeof v === 'number' ? v : 0);
const asArray = (v: ValueType): any[] => (Array.isArray(v) ? v : [v]);

export const NODE_REGISTRY: Record<string, NodeDefinition> = {
    // --- INPUTS ---
    'input_grade': {
        type: 'input_grade',
        label: 'Nota Individual',
        category: 'input',
        inputs: {},
        outputs: { value: { label: 'Nota', type: 'number' } },
        compute: (_, config) => ({ value: config.value ?? null })
    },
    'const_number': {
        type: 'const_number',
        label: 'Constante Numérica',
        category: 'input',
        inputs: {},
        outputs: { value: { label: 'Valor', type: 'number' } },
        compute: (_, config) => ({ value: config.value ?? 0 })
    },

    // --- MATEMÁTICAS BÁSICAS ---
    'avg_simple': {
        type: 'avg_simple',
        label: 'Promedio Simple',
        category: 'math',
        inputs: { in: { label: 'Notas', type: 'array' } },
        outputs: { value: { label: 'Promedio', type: 'number' } },
        compute: (inputs) => {
            // Obtenemos todos los valores crudos (sin filtrar nulls aún)
            const rawVals = Object.values(inputs).flat(Infinity);

            // MODO ESTRICTO: Si falta alguna nota (null), el promedio está pendiente.
            if (rawVals.some(v => v === null || v === undefined)) return { value: null };

            const vals = rawVals.filter(v => typeof v === 'number') as number[];
            if (vals.length === 0) return { value: null };

            const sum = vals.reduce((a, b) => a + b, 0);
            return { value: sum / vals.length };
        }
    },
    'avg_geometric': {
        type: 'avg_geometric',
        label: 'Promedio Geométrico',
        category: 'math',
        inputs: { in: { label: 'Valores', type: 'array' } },
        outputs: { value: { label: 'Resultado', type: 'number' } },
        compute: (inputs) => {
            const rawVals = Object.values(inputs).flat(Infinity);

            // MODO ESTRICTO: Si falta algún componente, no se puede calcular.
            if (rawVals.some(v => v === null || v === undefined)) return { value: null };

            const vals = rawVals.filter(v => typeof v === 'number') as number[];
            if (vals.length === 0) return { value: null };

            const product = vals.reduce((a, b) => a * b, 1);
            return { value: Math.pow(product, 1 / vals.length) };
        }
    },
    'avg_weighted': {
        type: 'avg_weighted',
        label: 'Promedio Ponderado',
        category: 'math',
        inputs: { values: { label: 'Notas', type: 'array' } },
        outputs: { value: { label: 'Ponderado', type: 'number' } },
        compute: (inputs, config) => {
            const vals = asArray(inputs.values);
            const weights = (config.weights as number[]) || [];

            // MODO ESTRICTO: Verificar consistencia
            // 1. Si hay valores nulos en la entrada -> Pendiente
            if (vals.some(v => v === null || v === undefined)) return { value: null };

            // 2. Si faltan entradas respecto a los pesos definidos (ej: weights tiene 2, vals tiene 1) -> Pendiente
            // Esto asume que el motor entrega un array del tamaño de las conexiones, 
            // pero si una conexión falta, a veces el array es más corto.
            // Para seguridad, si hay menos valores que pesos significativos, asumimos falta de datos.
            if (vals.length < weights.length) return { value: null };

            let sum = 0;
            let weightSum = 0;

            vals.forEach((v, i) => {
                if (typeof v === 'number') {
                    const w = weights[i] ?? 0;
                    sum += v * w;
                    weightSum += w;
                }
            });

            if (weightSum === 0) return { value: 0 };
            return { value: sum / weightSum };
        }
    },
    'min': {
        type: 'min',
        label: 'Mínimo',
        category: 'math',
        inputs: { a: { label: 'A', type: 'number' }, b: { label: 'B', type: 'number' } },
        outputs: { value: { label: 'Min', type: 'number' } },
        compute: (inputs) => {
            const a = inputs.a;
            const b = inputs.b;
            if (a === null || b === null || typeof a !== 'number' || typeof b !== 'number') return { value: null };
            return { value: Math.min(a, b) };
        }
    },
    'max': {
        type: 'max',
        label: 'Máximo',
        category: 'math',
        inputs: { a: { label: 'A', type: 'number' }, b: { label: 'B', type: 'number' } },
        outputs: { value: { label: 'Max', type: 'number' } },
        compute: (inputs) => {
            const a = inputs.a;
            const b = inputs.b;
            if (a === null || b === null || typeof a !== 'number' || typeof b !== 'number') return { value: null };
            return { value: Math.max(a, b) };
        }
    },

    'scaler': {
        type: 'scaler',
        label: 'Escalar (Multiplicar)',
        category: 'math',
        inputs: { value: { label: 'Valor', type: 'number' } },
        outputs: { result: { label: 'Escalado', type: 'number' } },
        compute: (inputs, config) => {
            const val = inputs.value;
            if (val === null || typeof val !== 'number') return { result: null };
            const factor = config.factor ?? 1.0;
            return { result: val * factor };
        }
    },
    'switch': {
        type: 'switch',
        label: 'Conmutador',
        category: 'flow',
        inputs: {
            condition: { label: 'Condición', type: 'boolean' },
            trueVal: { label: 'Si Verdadero', type: 'any' },
            falseVal: { label: 'Si Falso', type: 'any' }
        },
        outputs: { out: { label: 'Salida', type: 'any' } },
        compute: (inputs) => ({ out: inputs.condition ? inputs.trueVal : inputs.falseVal })
    },

    // --- USM SPECIFIC ---
    'replacer_worst': {
        type: 'replacer_worst',
        label: 'Reemplazar Peor Nota',
        category: 'usm',
        inputs: {
            notes: { label: 'Notas Originales', type: 'array' },
            replacement: { label: 'Recuperativo', type: 'number' }
        },
        outputs: { result: { label: 'Notas Finales', type: 'array' } },
        compute: (inputs, config, context) => {
            const notes = asArray(inputs.notes);
            const rep = inputs.replacement;

            // Si no hay recup, no pasa nada
            if (rep === null || typeof rep !== 'number') return { result: notes };

            // Notas válidas para reemplazar
            const numericNotes = notes.map((n, i) => ({ val: n, idx: i })).filter(n => n.val !== null && typeof n.val === 'number');

            if (numericNotes.length === 0) return { result: notes };

            let minIdx = -1;
            let minVal = 101;

            numericNotes.forEach((item) => {
                if (item.val < minVal) {
                    minVal = item.val;
                    minIdx = item.idx;
                }
            });

            context.log({
                type: 'replace',
                targetIndex: minIdx,
                message: `Nota (${minVal}) reemplazada por Recuperativo (${rep})`
            });

            const newNotes = [...notes];
            newNotes[minIdx] = rep;
            return { result: newNotes };
        }
    },
    'replacer_worst_if_greater': {
        type: 'replacer_worst',
        label: 'Reemplazar Peor Nota si es Mejor',
        category: 'usm',
        inputs: {
            notes: { label: 'Notas Originales', type: 'array' },
            replacement: { label: 'Recuperativo', type: 'number' }
        },
        outputs: { result: { label: 'Notas Finales', type: 'array' } },
        compute: (inputs, config, context) => {
            const notes = asArray(inputs.notes);
            const rep = inputs.replacement;

            // Si no hay recup, no pasa nada
            if (rep === null || typeof rep !== 'number') return { result: notes };

            // Notas válidas para reemplazar
            const numericNotes = notes.map((n, i) => ({ val: n, idx: i })).filter(n => n.val !== null && typeof n.val === 'number');

            if (numericNotes.length === 0) return { result: notes };

            let minIdx = -1;
            let minVal = 101;

            numericNotes.forEach((item) => {
                if (item.val < minVal) {
                    minVal = item.val;
                    minIdx = item.idx;
                }
            });

            // LÓGICA DE AVISO:
            if (minIdx !== -1 && rep > minVal) {
                // Notificar al sistema que hubo un reemplazo
                context.log({
                    type: 'replace',
                    targetIndex: minIdx, // El Engine traducirá esto al ID del nodo de entrada (ej: 'c2')
                    message: `Nota (${minVal}) reemplazada por Recuperativo (${rep})`
                });

                const newNotes = [...notes];
                newNotes[minIdx] = rep;
                return { result: newNotes };
            } else if (minIdx !== -1 && rep <= minVal) {
                context.log({
                    type: 'info',
                    message: `Recuperativo (${rep}) descartado (es menor que la peor nota: ${minVal})`
                });
            }

            return { result: notes };
        }
    },
    'replacer_worst_capped': {
        type: 'replacer_worst_capped',
        label: 'Reemplazo con Tope',
        category: 'usm',
        inputs: {
            notes: { label: 'Notas Originales', type: 'array' },
            replacement: { label: 'Recuperativo', type: 'number' }
        },
        outputs: { result: { label: 'Notas Finales', type: 'array' } },
        compute: (inputs, config) => {
            const notes = [...asArray(inputs.notes)];
            const rep = inputs.replacement;
            const cap = config.cap ?? 55;

            if (rep !== null && typeof rep === 'number') {
                let minIdx = -1;
                let minVal = 9999;
                notes.forEach((n, i) => {
                    if (typeof n === 'number' && n < minVal) {
                        minVal = n;
                        minIdx = i;
                    }
                });
                if (minIdx !== -1 && rep > minVal) {
                    notes[minIdx] = Math.min(rep, cap);
                }
            }
            return { result: notes };
        }
    },
    'global_recalculation': {
        type: 'global_recalculation',
        label: 'Recálculo Global',
        category: 'usm',
        inputs: {
            semestral: { label: 'Nota Semestral', type: 'number' },
            global: { label: 'Nota Global', type: 'number' }
        },
        outputs: { final: { label: 'Nota Final', type: 'number' } },
        compute: (inputs, config) => {
            const sem = inputs.semestral;
            if (sem === null || typeof sem !== 'number') return { final: null }; // Semestral es obligatorio

            const glo = inputs.global;
            if (glo === null || typeof glo !== 'number') return { final: sem }; // Global es opcional

            const wGlobal = config.weightGlobal ?? 0.5;
            const wSemestral = 1 - wGlobal;
            return { final: sem * wSemestral + glo * wGlobal };
        }
    },
    'drop_worst_n': {
        type: 'drop_worst_n',
        label: 'Borrar N Peores',
        category: 'usm',
        inputs: {
            notes: { label: 'Notas', type: 'array' }
        },
        outputs: { result: { label: 'Notas Válidas', type: 'array' } },
        compute: (inputs, config) => {
            const rawNotes = asArray(inputs.notes);

            // Si falta alguna nota, no podemos saber cuál es la peor con certeza -> Pendiente
            if (rawNotes.some(n => n === null || n === undefined)) return { result: [] }; // Retornar vacío o null causará null en el promedio siguiente

            const notes = rawNotes.filter(n => typeof n === 'number').sort((a, b) => a - b);
            const count = config.count ?? 1;

            if (notes.length <= count) return { result: [] };
            return { result: notes.slice(count) };
        }
    },
    'notifier': {
        type: 'notifier',
        label: 'Notificador',
        category: 'flow',
        inputs: {
            value: { label: 'Valor', type: 'any' },
            trigger: { label: 'Activar', type: 'boolean' }
        },
        outputs: { out: { label: 'Salida', type: 'any' } },
        compute: (inputs, config, context) => {
            const val = inputs.value;

            // REGLA ANTI-SPAM: Si el valor es null (pendiente), no notificamos nada.
            if (val === null || val === undefined) return { out: null };

            // Si el trigger está conectado y es false, no mostramos el mensaje.
            // Si trigger es null (desconectado), asumimos true (comportamiento default).
            // Pero si viene de un logic_not que devuelve null, tratamos como false.
            const shouldNotify = inputs.trigger === true || (inputs.trigger === null && config.alwaysNotify);

            if (shouldNotify) {
                context.log({
                    type: config.type ?? 'info',
                    message: config.message ?? 'Aviso del sistema',
                });
            }

            return { out: val };
        }
    },

    // --- NUEVO: Inversor Lógico ---
    'logic_not': {
        type: 'logic_not',
        label: 'NO Lógico (Inverter)',
        category: 'logic',
        inputs: { in: { label: 'Entrada', type: 'boolean' } },
        outputs: { out: { label: 'Salida', type: 'boolean' } },
        compute: (inputs) => {
            const val = inputs.in;
            // Si la entrada es nula/pendiente, la salida también.
            if (val === null || val === undefined) return { out: null };
            return { out: !val };
        }
    },

    // --- MEJORA: Threshold Gate con soporte Null ---
    'threshold_gate': {
        type: 'threshold_gate',
        label: 'Umbral (Pass/Fail)',
        category: 'logic',
        inputs: { value: { label: 'Valor', type: 'number' } },
        outputs: {
            pass: { label: 'Pasa', type: 'boolean' },
            val: { label: 'Valor', type: 'number' }
        },
        compute: (inputs, config) => {
            const rawVal = inputs.value;

            // Si es null, propagamos el estado "pendiente" en el booleano también
            if (rawVal === null || rawVal === undefined) {
                return { pass: null, val: null };
            }

            const v = asNumber(rawVal);
            const limit = config.limit ?? 55;
            return { pass: v >= limit, val: v };
        }
    },

    // --- 2. NODO NCR (Hard Fail / Vetado) ---
    'ncr_gate': {
        type: 'ncr_gate',
        label: 'Regla de Reprobación (NCR)',
        category: 'logic',
        inputs: {
            grade: { label: 'Nota Entrada', type: 'number' },
            condition: { label: 'Condición de Fallo', type: 'boolean' } // Ej: Asistencia < 70
        },
        outputs: {
            final_grade: { label: 'Nota Salida', type: 'number' },
            is_ncr: { label: 'Es NCR', type: 'boolean' }
        },
        compute: (inputs, config, context) => {
            const grade = asNumber(inputs.grade);
            let isTriggered = inputs.condition === true;

            // NUEVO: Permitir invertir la lógica (Fallar si la condición NO se cumple)
            // Útil para conectar directamente a un Threshold Gate (true = aprobado)
            if (config.failOnFalse) {
                isTriggered = !isTriggered;
            }

            if (isTriggered) {
                const penaltyGrade = config.penaltyValue ?? 0;
                context.log({
                    type: 'error',
                    message: config.message ?? 'Reprobado por requisitos (NCR)'
                });
                return { final_grade: penaltyGrade, is_ncr: true };
            }

            return { final_grade: grade, is_ncr: false };
        }
    },

    // --- 4. NODO CLAMPER (Tope) ---
    'clamp': {
        type: 'clamp',
        label: 'Tope (Min/Max)',
        category: 'math',
        inputs: { value: { label: 'Valor', type: 'number' } },
        outputs: { result: { label: 'Ajustado', type: 'number' } },
        compute: (inputs, config, context) => {
            const v = inputs.value;
            if (v === null || typeof v !== 'number') return { result: null };

            let res = v;
            const min = config.min;
            const max = config.max;

            if (min !== undefined && res < min) {
                res = min;
                context.log({ type: 'info', message: `Nota ajustada al mínimo (${min})` });
            }
            if (max !== undefined && res > max) {
                if (res !== max) { // Solo loggear si hubo cambio real
                    context.log({
                        type: 'warning',
                        message: `Nota (${v}) excede el máximo permitido. Ajustada a ${max}.`
                    });
                }
                res = max;
            }

            return { result: res };
        }
    },

    'round': {
        type: 'round',
        label: 'Redondear',
        category: 'math',
        inputs: { value: { label: 'Valor', type: 'number' } },
        outputs: { result: { label: 'Entero', type: 'number' } },
        compute: (inputs) => {
            const v = inputs.value;
            if (v === null || typeof v !== 'number') return { result: null };
            return { result: Math.round(v) };
        }
    },
};