// Dimensiones constantes para el modo simple (exportadas para usarlas en el Svelte)
export const SIMPLE_NODE_WIDTH = 140;
export const SIMPLE_NODE_HEIGHT = 64;
export const SIMPLE_CIRCLE_SIZE = 40;

export function generateWirePath(
    x1: number, y1: number,
    x2: number, y2: number,
    tension: number = 0.5
): string {
    const dist = Math.abs(x2 - x1);
    const smoothTension = Math.min(dist * tension, 150);

    const cp1x = x1 + smoothTension;
    const cp1y = y1;
    const cp2x = x2 - smoothTension;
    const cp2y = y2;

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Calcula la posición del puerto o punto de conexión.
 * Soporta modo 'advanced' (puertos específicos) y 'simple' (lados del nodo).
 */
export function getNodePortPosition(
    nodeX: number,
    nodeY: number,
    isInput: boolean,
    index: number,
    totalInputsInNode: number = 0,
    viewMode: 'simple' | 'advanced' = 'advanced', // NUEVO PARAMETRO
    isCompactNode: boolean = false // Para saber si es un círculo en modo simple
): { x: number; y: number } {

    // --- MODO SIMPLE (Minimalista) ---
    if (viewMode === 'simple') {
        const height = isCompactNode ? SIMPLE_CIRCLE_SIZE : SIMPLE_NODE_HEIGHT;
        const width = isCompactNode ? SIMPLE_CIRCLE_SIZE : SIMPLE_NODE_WIDTH;

        // Conexión verticalmente centrada
        const cy = nodeY + (height / 2);

        // Input a la izquierda, Output a la derecha
        const x = isInput ? nodeX : nodeX + width;

        return { x, y: cy };
    }

    // --- MODO AVANZADO (Legacy) ---
    // CONSTANTES CSS (Sincronizadas con styles.ts)
    const HEADER_HEIGHT = 32;
    const BODY_PADDING_TOP = 12;
    const ROW_HEIGHT = 32;
    const NODE_WIDTH = 260;

    let offsetY = HEADER_HEIGHT + BODY_PADDING_TOP;

    if (isInput) {
        offsetY += (index * ROW_HEIGHT);
    } else {
        const SEPARATOR_SPACE = 4;
        offsetY += (totalInputsInNode * ROW_HEIGHT) + SEPARATOR_SPACE + (index * ROW_HEIGHT);
    }
    offsetY += (ROW_HEIGHT / 2);

    const y = nodeY + offsetY;
    const x = isInput ? nodeX : nodeX + NODE_WIDTH;

    return { x, y };
}