// src/lib/logic/ramos/colors.ts
import Color, { type ColorInstance } from 'color';
import { differenceEuclidean } from 'culori';

type KeywordColorEntry = {
    regex: RegExp;
    color: ColorInstance | ((match: string) => ColorInstance);
};

// ... (Mantenemos tu constante KEYWORD_COLOR_MAPPINGS intacta para no perder tu paleta) ...
const KEYWORD_COLOR_MAPPINGS: KeywordColorEntry[] = [
    { regex: /\b(MAT|MATE|MATEMATICAS?)\b/i, color: Color('#1463c9') },
    { regex: /\b(LENGUAJE|LITERATURA|HUM)\b/i, color: Color('#CC0000') },
    { regex: /\b(CIENCIAS? NATURALES?|BIO)\b/i, color: Color('#2E8B57') },
    { regex: /\b(FIS|FISICA)\b/i, color: Color('#8A2BE2') },
    { regex: /\b(DEFIDER|EDUCACION FISICA|EFI)\b/i, color: Color('#808080') },
    { regex: /\b(QUI|QUIMICA)\b/i, color: Color('#ADFF2F') },
    { regex: /\b(INF|INFORMATICA|COMPUTACI(O|Ó)N)\b/i, color: Color('#FCA103') },
    { regex: /\b(ELO|ELECTRONICA)\b/i, color: Color('#17A589') },
    { regex: /\b(ELI|ELECTRICA)\b/i, color: Color('#2ECC71') },
    { regex: /\b(MEC|MECANICA)\b/i, color: Color('#5D6D7E') },
    { regex: /\b(CIV|OBRAS CIVILES|CONSTRUCCION)\b/i, color: Color('#A0522D') },
    { regex: /\b(ARQ|ARQUITECTURA)\b/i, color: Color('#D2B48C') },
    { regex: /\b(IND|INDUSTRIAS)\b/i, color: Color('#4682B4') },
    { regex: /\b(COMERCIAL|ICS)\b/i, color: Color('#3498DB') },
    { regex: /\b(DISEÑO|IDP)\b/i, color: Color('#AF7AC5') },
    { regex: /\b(MINAS|METALURGIA)\b/i, color: Color('#CD7F32') },
    { regex: /\b(AERO|AERONAUTICA)\b/i, color: Color('#87CEEB') },
    {
        regex: /\b(INGLES|ENGLISH|ICM)\s*(\d+|[IVXLCDM]+)\b/i,
        color: (match: string) => {
            const baseColor = Color('#2980B9');
            const levelMatch = match.match(/(\d+|[IVXLCDM]+)$/i);
            if (!levelMatch) return baseColor;
            // ... (Tu lógica de romanos/niveles se mantiene igual)
            const numStr = levelMatch[0].toUpperCase();
            let level = 0;
            const romanMap: { [key: string]: number } = { I: 1, V: 5, X: 10, L: 50 };
            if (isNaN(parseInt(numStr, 10))) {
                level = numStr.split('').reduce((acc, char, i) => {
                    const currentVal = romanMap[char];
                    const nextVal = romanMap[numStr[i + 1]];
                    return acc + (nextVal > currentVal ? -currentVal : currentVal);
                }, 0);
            } else {
                level = parseInt(numStr, 10);
            }
            return baseColor.lighten(Math.min(level * 0.07, 0.7));
        }
    }
];

function getColorForString(string: string): ColorInstance | undefined {
    const cleanString = string.deaccent().toUpperCase();

    for (const entry of KEYWORD_COLOR_MAPPINGS) {
        if (entry.regex.test(cleanString)) {
            let out = typeof entry.color === "function" ? entry.color(string) : entry.color;

            // --- Modificadores (Tu lógica original) ---
            if (/\b(LABORATORIO|TALLER)\b/gi.test(cleanString)) {
                out = out.desaturate(.2).lighten(.1);
            } else if (/\b(INTRODUCCION|FUNDAMENTOS)\b/gi.test(cleanString)) {
                out = out.lighten(.15).saturate(.1);
            } else if (/\b(AVANZAD(O|A)|SUPERIOR)\b/gi.test(cleanString)) {
                out = out.darken(.25).saturate(.2);
            } else if (/\b(SEMINARIO|PROYECTO DE TITULO|MEMORIA)\b/gi.test(cleanString)) {
                out = out.rotate(-15).desaturate(0.5);
            }
            if (/\b(APLICAD(A|O))\b/gi.test(cleanString)) {
                out = out.rotate(10);
            }
            return out;
        }
    }
    return undefined;
}

const colorCache = new Map<string, ColorInstance>();

// MEJORA: `usedColors` es opcional. Si se pasa, intentará evitar colisiones.
export function generateColorForRamo(sigla: string, nombre: string, usedColors: ColorInstance[] = []) {
    if (colorCache.has(sigla)) return colorCache.get(sigla)!;

    let outColor = getColorForString(sigla) || getColorForString(nombre);
    const fn = differenceEuclidean('rgb');
    const MAX_TRIES = 10;

    // Caso 1: Color aleatorio si no hay match semántico
    if (!outColor) {
        let tries = 0;
        let uniqueColorFound = false;
        let newColor: ColorInstance | undefined;

        while (tries < MAX_TRIES && !uniqueColorFound) {
            newColor = Color.hsl(Math.random() * 360, 70 + Math.random() * 30, 40 + Math.random() * 20);
            uniqueColorFound = true;

            for (const testColor of usedColors) {
                if (fn(newColor.hex(), testColor.hex()) < 0.1) {
                    uniqueColorFound = false;
                    break;
                }
            }
            tries++;
        }
        const final = newColor!;
        colorCache.set(sigla, final);
        return final;
    }

    // Caso 2: Color semántico encontrado -> Verificar colisiones
    for (const testColor of usedColors) {
        if (fn(outColor.hex(), testColor.hex()) < 0.25) {
            let tries = 0;
            let uniqueColorFound = false;
            let adjustedColor: ColorInstance | undefined;

            while (tries < MAX_TRIES && !uniqueColorFound) {
                const newHue = (outColor.hue() + (Math.random() * 60 - 50)) % 360;
                adjustedColor = Color.hsl(newHue, outColor.saturationl(), outColor.lightness());
                uniqueColorFound = true;

                for (const existing of usedColors) {
                    if (fn(adjustedColor.hex(), existing.hex()) < 0.1) {
                        uniqueColorFound = false;
                        break;
                    }
                }
                tries++;
            }
            const finalAdjusted = adjustedColor || outColor;
            colorCache.set(sigla, finalAdjusted);
            return finalAdjusted;
        }
    }

    colorCache.set(sigla, outColor);
    return outColor;
}