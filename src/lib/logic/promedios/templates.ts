import type { Graph } from '$lib/logic/promedios/types';

export const GRAFOS_TEMPLATES: Record<string, Graph> = {
    'MAT023': {
        nodes: [
            // Requeridos (Por defecto)
            { id: 'c1', type: 'input_grade', data: { value: null }, label: 'Certamen 1' },
            { id: 'c2', type: 'input_grade', data: { value: null }, label: 'Certamen 2' },
            { id: 'c3', type: 'input_grade', data: { value: null }, label: 'Certamen 3' },

            // Opcionales
            { id: 'glob', type: 'input_grade', optional: true, data: { value: null }, label: 'Global Recuperativo' },

            { id: 'logic_recup', type: 'replacer_worst', data: {}, label: 'Recuperativo' },
            { id: 'prom_c', type: 'avg_simple', data: {}, label: 'Promedio C' },

            // Controles
            { id: 'q1', type: 'input_grade', data: { value: null }, label: 'Control 1' },
            { id: 'q2', type: 'input_grade', data: { value: null }, label: 'Control 2' },
            { id: 'q3', type: 'input_grade', data: { value: null }, label: 'Control 3' },
            { id: 'prom_q', type: 'avg_simple', data: {}, label: 'Promedio Q' },

            { id: 'nf', type: 'avg_weighted', data: { weights: [0.8, 0.2] }, label: 'Nota Final' }
        ],
        connections: [
            { fromNode: 'c1', fromPort: 'value', toNode: 'logic_recup', toPort: 'notes' },
            { fromNode: 'c2', fromPort: 'value', toNode: 'logic_recup', toPort: 'notes' },
            { fromNode: 'c3', fromPort: 'value', toNode: 'logic_recup', toPort: 'notes' },
            { fromNode: 'glob', fromPort: 'value', toNode: 'logic_recup', toPort: 'replacement' },
            { fromNode: 'logic_recup', fromPort: 'result', toNode: 'prom_c', toPort: 'in' },

            { fromNode: 'q1', fromPort: 'value', toNode: 'prom_q', toPort: 'in' },
            { fromNode: 'q2', fromPort: 'value', toNode: 'prom_q', toPort: 'in' },
            { fromNode: 'q3', fromPort: 'value', toNode: 'prom_q', toPort: 'in' },

            { fromNode: 'prom_c', fromPort: 'value', toNode: 'nf', toPort: 'values' },
            { fromNode: 'prom_q', fromPort: 'value', toNode: 'nf', toPort: 'values' }
        ],
        groups: [
            {
                label: 'Certamenes',
                nodes: ['c1', 'c2', 'c3'],
                category: 'input'
            },
            {
                label: 'Controles',
                nodes: ['q1', 'q2', 'q3'],
                category: 'input'
            },
            {
                label: 'Procesamiento Certámenes',
                nodes: ['logic_recup', 'prom_c'],
                category: 'math'
            },
            {
                label: 'Procesamiento Controles',
                nodes: ['prom_q'],
                category: 'math'
            }
        ]
    },
    'INF246': {
        nodes: [
            // --- LABORATORIOS (L1-L4) ---
            { id: 'l1', type: 'input_grade', data: { value: null }, label: 'Laboratorio 1' },
            { id: 'l2', type: 'input_grade', data: { value: null }, label: 'Laboratorio 2' },
            { id: 'l3', type: 'input_grade', data: { value: null }, label: 'Laboratorio 3' },
            { id: 'l4', type: 'input_grade', data: { value: null }, label: 'Laboratorio 4' },

            { id: 'pl', type: 'avg_simple', data: {}, label: 'Promedio Lab (PL)' },

            // Chequeo de Barrera
            { id: 'check_labs', type: 'threshold_gate', data: { limit: 55 }, label: '¿PL Aprobado?' },

            // NUEVO: Inversor para detectar FALLO
            { id: 'not_labs', type: 'logic_not', data: {}, label: 'Negación (Fallo)' },

            // Notificador: Conectaremos el trigger para que solo suene si FALLA
            {
                id: 'notify_lab_fail',
                type: 'notifier',
                data: { type: 'error', message: 'Reprobado: PL insuficiente (< 55). NF = PL' },
                label: 'Aviso Fallo PL'
            },

            // --- CERTÁMENES ---
            { id: 'c1', type: 'input_grade', data: { value: null }, label: 'Certamen 1' },
            { id: 'c2', type: 'input_grade', data: { value: null }, label: 'Certamen 2' },
            { id: 'c3', type: 'input_grade', data: { value: null }, label: 'Certamen 3' },
            { id: 'recup', type: 'input_grade', optional: true, data: { value: null }, label: 'Recuperativo' },
            { id: 'logic_certs', type: 'replacer_worst', data: {}, label: 'Certámenes Finales' },

            // --- SEMESTRAL ---
            { id: 'ns', type: 'avg_geometric', data: {}, label: 'Nota Semestral (NS)' },

            // --- GLOBAL ---
            { id: 'global', type: 'input_grade', optional: true, data: { value: null }, label: 'Examen Global' },
            { id: 'check_ns_pass', type: 'threshold_gate', data: { limit: 55 }, label: '¿NS Aprobado?' },
            { id: 'calc_global', type: 'global_recalculation', data: { weightGlobal: 0.5 }, label: 'NS con Global' },
            { id: 'sw_global', type: 'switch', data: {}, label: 'Decisión Global' },

            // --- BARRERA PL ---
            { id: 'sw_barrier', type: 'switch', data: {}, label: 'Aplicar Barrera PL' },

            // --- FINAL & BONUS ---
            { id: 'check_final_pass', type: 'threshold_gate', data: { limit: 55 }, label: '¿Aprobado Final?' },
            { id: 'apply_bonus', type: 'scaler', data: { factor: 1.2 }, label: 'Bonus 1.2x' },

            // Notificador Bonus: Conectaremos trigger
            {
                id: 'notify_bonus',
                type: 'notifier',
                data: { type: 'success', message: '¡Felicidades! Bonificación x1.2 aplicada.' },
                label: 'Aviso Bonus'
            },

            { id: 'nf', type: 'switch', data: {}, label: 'Nota Final (NF)' }
        ],
        connections: [
            // Labs
            { fromNode: 'l1', fromPort: 'value', toNode: 'pl', toPort: 'in' },
            { fromNode: 'l2', fromPort: 'value', toNode: 'pl', toPort: 'in' },
            { fromNode: 'l3', fromPort: 'value', toNode: 'pl', toPort: 'in' },
            { fromNode: 'l4', fromPort: 'value', toNode: 'pl', toPort: 'in' },

            // Certs
            { fromNode: 'c1', fromPort: 'value', toNode: 'logic_certs', toPort: 'notes' },
            { fromNode: 'c2', fromPort: 'value', toNode: 'logic_certs', toPort: 'notes' },
            { fromNode: 'c3', fromPort: 'value', toNode: 'logic_certs', toPort: 'notes' },
            { fromNode: 'recup', fromPort: 'value', toNode: 'logic_certs', toPort: 'replacement' },

            // NS
            { fromNode: 'logic_certs', fromPort: 'result', toNode: 'ns', toPort: 'in' },
            { fromNode: 'pl', fromPort: 'value', toNode: 'ns', toPort: 'in' },

            // Global Logic
            { fromNode: 'ns', fromPort: 'value', toNode: 'check_ns_pass', toPort: 'value' },
            { fromNode: 'ns', fromPort: 'value', toNode: 'calc_global', toPort: 'semestral' },
            { fromNode: 'global', fromPort: 'value', toNode: 'calc_global', toPort: 'global' },
            { fromNode: 'check_ns_pass', fromPort: 'pass', toNode: 'sw_global', toPort: 'condition' },
            { fromNode: 'ns', fromPort: 'value', toNode: 'sw_global', toPort: 'trueVal' },
            { fromNode: 'calc_global', fromPort: 'final', toNode: 'sw_global', toPort: 'falseVal' },

            // Barrera PL (CORREGIDA CON TRIGGER)
            { fromNode: 'pl', fromPort: 'value', toNode: 'check_labs', toPort: 'value' },

            // 1. Invertir la señal de aprobación (True -> False)
            { fromNode: 'check_labs', fromPort: 'pass', toNode: 'not_labs', toPort: 'in' },

            // 2. Conectar señal invertida al trigger del notificador de fallo
            // Si PL < 55 -> check=False -> not=True -> Trigger=True -> SUENA
            { fromNode: 'not_labs', fromPort: 'out', toNode: 'notify_lab_fail', toPort: 'trigger' },

            // 3. Pasar el valor PL por el notificador
            { fromNode: 'pl', fromPort: 'value', toNode: 'notify_lab_fail', toPort: 'value' },

            // Switch Barrera
            { fromNode: 'check_labs', fromPort: 'pass', toNode: 'sw_barrier', toPort: 'condition' },
            { fromNode: 'sw_global', fromPort: 'out', toNode: 'sw_barrier', toPort: 'trueVal' },
            { fromNode: 'notify_lab_fail', fromPort: 'out', toNode: 'sw_barrier', toPort: 'falseVal' },

            // Bonus (CORREGIDA CON TRIGGER)
            { fromNode: 'sw_barrier', fromPort: 'out', toNode: 'check_final_pass', toPort: 'value' },

            // Ruta Bonus
            { fromNode: 'sw_barrier', fromPort: 'out', toNode: 'apply_bonus', toPort: 'value' },

            // Trigger: Solo si check_final_pass es TRUE
            { fromNode: 'check_final_pass', fromPort: 'pass', toNode: 'notify_bonus', toPort: 'trigger' },
            { fromNode: 'apply_bonus', fromPort: 'result', toNode: 'notify_bonus', toPort: 'value' },

            // NF
            { fromNode: 'check_final_pass', fromPort: 'pass', toNode: 'nf', toPort: 'condition' },
            { fromNode: 'notify_bonus', fromPort: 'out', toNode: 'nf', toPort: 'trueVal' },
            { fromNode: 'sw_barrier', fromPort: 'out', toNode: 'nf', toPort: 'falseVal' }
        ],
        groups: [
            {
                label: 'Certamenes',
                nodes: ['c1', 'c2', 'c3'],
                category: 'input'
            },
            {
                label: 'Laboratorio',
                nodes: ['l1', 'l2', 'l3', 'l4'],
                category: 'input'
            },
            {
                label: 'Requerimiento Promedio Lab',
                nodes: ['pl', 'check_labs', 'not_labs', 'notify_lab_fail'],
                category: 'usm'
            },
            {
                label: 'Cálculo Semestral, Global',
                nodes: ['logic_certs', 'ns', 'check_ns_pass', 'calc_global', 'sw_global'],
                category: 'math'
            },
            {
                label: 'Cálculo Final, Bonificación',
                nodes: ['sw_barrier', 'check_final_pass', 'apply_bonus', 'notify_bonus', 'nf'],
                category: 'math'
            }
        ]
    }
};