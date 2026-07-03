import Color, { type ColorInstance } from "color";

// Paleta de colores "segura" y distintiva (Material / Tailwind mix)
const COLOR_POOL = [
    "#ef4444", // Red 500
    "#f97316", // Orange 500
    "#f59e0b", // Amber 500
    "#84cc16", // Lime 500
    "#10b981", // Emerald 500
    "#06b6d4", // Cyan 500
    "#3b82f6", // Blue 500
    "#6366f1", // Indigo 500
    "#8b5cf6", // Violet 500
    "#d946ef", // Fuchsia 500
    "#f43f5e", // Rose 500
    "#64748b", // Slate 500
    "#14b8a6", // Teal 500
    "#a855f7", // Purple 500
];

// Estado local para recordar asignaciones durante la sesión
const assignedColors = new Map<string, string>();
let poolIndex = 0;

/**
 * Genera un color determinista.
 * 1. Si la sigla ya tiene color asignado en memoria, lo retorna.
 * 2. Si hay espacio en el pool, usa el siguiente color disponible.
 * 3. Si se acaba el pool, genera un hash basado en el string.
 */
export function generateColorForRamo(sigla: string, seedName?: string): ColorInstance {
    if (assignedColors.has(sigla))
        return Color(assignedColors.get(sigla));

    let hex: string;

    if (poolIndex < COLOR_POOL.length) {
        hex = COLOR_POOL[poolIndex];
        poolIndex++;
    } else {
        // Fallback a hash (tu lógica original o similar)
        const str = sigla + (seedName ?? "");
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        hex = "#" + "00000".substring(0, 6 - c.length) + c;
    }

    assignedColors.set(sigla, hex);
    return Color(hex);
}

export function resetColorPool() {
    poolIndex = 0;
    assignedColors.clear();
}