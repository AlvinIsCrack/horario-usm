import { Calendario } from "$lib/states/calendario.svelte";
import Color, { type ColorInstance } from "color";
import { differenceEuclidean } from "culori";

type KeywordColorEntry = {
    regex: RegExp;
    color: ColorInstance | ((match: string) => ColorInstance);
};

const KEYWORD_COLOR_MAPPINGS: KeywordColorEntry[] = [
    { regex: /\b(MAT|MATE|MATEMATICAS?)\b/i, color: Color('#1463c9') }, // Azul oscuro para Matemáticas
    { regex: /\b(LENGUAJE|LITERATURA|HUM)\b/i, color: Color('#CC0000') }, // Rojo para Lenguaje/Humanidades
    { regex: /\b(CIENCIAS? NATURALES?|BIO)\b/i, color: Color('#2E8B57') }, // Verde para Ciencias Naturales / Biología
    { regex: /\b(FIS|FISICA)\b/i, color: Color('#8A2BE2') }, // Morado para Física
    { regex: /\b(DEFIDER|EDUCACION FISICA|EFI)\b/i, color: Color('#808080') }, // Gris para Educación Física
    { regex: /\b(QUI|QUIMICA)\b/i, color: Color('#ADFF2F') }, // Verde ácido para Química
    { regex: /\b(INF|INFORMATICA|COMPUTACI(O|Ó)N)\b/i, color: Color('#FCA103') }, // Naranjo-amarillo para Informática
    { regex: /\b(ELO|ELECTRONICA)\b/i, color: Color('#17A589') }, // Verde azulado para Electrónica
    { regex: /\b(ELI|ELECTRICA)\b/i, color: Color('#2ECC71') }, // Verde brillante para Eléctrica
    { regex: /\b(MEC|MECANICA)\b/i, color: Color('#5D6D7E') }, // Gris metálico para Mecánica
    { regex: /\b(CIV|OBRAS CIVILES|CONSTRUCCION)\b/i, color: Color('#A0522D') }, // Tono tierra para Obras Civiles/Construcción
    { regex: /\b(ARQ|ARQUITECTURA)\b/i, color: Color('#D2B48C') }, // Tono arena para Arquitectura
    { regex: /\b(IND|INDUSTRIAS)\b/i, color: Color('#4682B4') }, // Azul acero para Industrias
    { regex: /\b(COMERCIAL|ICS)\b/i, color: Color('#3498DB') }, // Azul claro para Comercial
    { regex: /\b(DISEÑO|IDP)\b/i, color: Color('#AF7AC5') }, // Lavanda para Diseño de Productos
    { regex: /\b(MINAS|METALURGIA)\b/i, color: Color('#CD7F32') }, // Bronce para Minería y Metalurgia
    { regex: /\b(AERO|AERONAUTICA)\b/i, color: Color('#87CEEB') }, // Azul cielo para Aeronáutica

    {
        regex: /\b(INGLES|ENGLISH|ICM)\s*(\d+|[IVXLCDM]+)\b/i,
        color: (match: string) => {
            const baseColor = Color('#2980B9'); // Azul estándar para Inglés
            // Busca el número (arábigo o romano) al final del string
            const levelMatch = match.match(/(\d+|[IVXLCDM]+)$/i);
            if (!levelMatch) return baseColor;

            const numStr = levelMatch[0].toUpperCase();
            let level = 0;

            // Conversor simple de números romanos a arábigos
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

            // Aclara el color progresivamente según el nivel (hasta un límite)
            return baseColor.lighten(Math.min(level * 0.07, 0.7));
        }
    }
];


function getColorForString(string: string): ColorInstance | undefined {
    string = string.toUpperCase().deaccent();

    for (const entry of KEYWORD_COLOR_MAPPINGS) {
        if (entry.regex.test(string)) {
            let out = typeof entry.color === "function" ? entry.color(string) : entry.color;

            // --- Modificadores por tipo de Ramo (palabras clave) ---
            if (/\b(LABORATORIO|TALLER)\b/gi.test(string)) {
                out = out.desaturate(.2).lighten(.1); // Un color más "práctico"
            } else if (/\b(INTRODUCCION|FUNDAMENTOS)\b/gi.test(string)) {
                out = out.lighten(.15).saturate(.1); // Un color más claro para ramos introductorios
            } else if (/\b(AVANZAD(O|A)|SUPERIOR)\b/gi.test(string)) {
                out = out.darken(.25).saturate(.2); // Más oscuro e intenso para ramos avanzados
            } else if (/\b(SEMINARIO|PROYECTO DE TITULO|MEMORIA)\b/gi.test(string)) {
                out = out.rotate(-15).desaturate(0.5); // Un tono más sobrio para seminarios/títulos
            }

            if (/\b(APLICAD(A|O))\b/gi.test(string)) { // Ramos con "Aplicada/o"
                out = out.rotate(10);
            }

            return out;
        }
    }
    return undefined; // No se encontró coincidencia
}

const colorCache = new Map<string, ColorInstance>();

export function generateColorForRamo(sigla: string, nombre: string) {
    // 1. Verificar caché
    if (colorCache.has(sigla)) {
        return colorCache.get(sigla)!;
    }

    let outColor: ReturnType<typeof getColorForString>;
    outColor = getColorForString(sigla);
    outColor ||= getColorForString(nombre);

    const fn = differenceEuclidean('rgb');
    const MAX_TRIES = 10;

    if (!outColor) {
        let tries = 0;
        let uniqueColorFound = false;
        let newColor: ColorInstance | undefined;

        while (tries < MAX_TRIES && !uniqueColorFound) {
            const hue = Math.random() * 360;
            const saturation = 0.7 + Math.random() * 0.3;
            const lightness = 0.4 + Math.random() * 0.2;

            newColor = Color.hsl(hue, saturation * 100, lightness * 100);
            uniqueColorFound = true;

            for (const testColor of Calendario.ramos.map(r => r.color)) {
                if (testColor && fn(newColor.hex(), testColor.hex()) < 0.1) {
                    uniqueColorFound = false;
                    break;
                }
            }
            tries++;
        }

        // Guardar en caché antes de retornar
        const finalColor = newColor!;
        colorCache.set(sigla, finalColor);
        return finalColor;
    }

    // Si outColor ya tiene un valor, verificamos su unicidad
    for (const testColor of Calendario.ramos.map(r => r.color)) {
        if (testColor && fn(outColor.hex(), testColor.hex()) < 0.25) {
            let tries = 0;
            let uniqueColorFound = false;
            let adjustedColor: ColorInstance | undefined;

            while (tries < MAX_TRIES && !uniqueColorFound) {
                const newHue = (outColor.hue() + (Math.random() * 60 - 50)) % 360;
                const newSaturation = Math.min(1, Math.max(0, outColor.saturationl() / 100 + (Math.random() * 0.2 - 0.1)));
                const newLightness = Math.min(1, Math.max(0, outColor.lightness() / 100 + (Math.random() * 0.2 - 0.1)));

                adjustedColor = Color.hsl(newHue, newSaturation * 100, newLightness * 100);
                uniqueColorFound = true;

                for (const testColor of Calendario.ramos.map(r => r.color)) {
                    if (testColor && fn(adjustedColor.hex(), testColor.hex()) < 0.1) {
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

    // Guardar en caché el color base si no hubo colisiones
    colorCache.set(sigla, outColor);
    return outColor;
}