export function checkTextQuality(text: string): { isLowQuality: boolean; score: number } {
    const rawText = text.trim();
    // 0. Limpieza: Ignoramos puntuación para el análisis de palabras y longitud real
    const cleanText = rawText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);

    if (rawText.length < 20 || words.length < 3) return { isLowQuality: true, score: 0 };

    // 1. Diversidad: Basada en palabras limpias
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversity = uniqueWords.size / words.length;

    // 2. Longitud promedio: El español real usa entre 4 y 6 caracteres (sin contar puntuación)
    const totalCharsWithoutSpaces = words.join("").length;
    const avgWordLength = totalCharsWithoutSpaces / words.length;
    const isGibberish = avgWordLength > 12 || avgWordLength < 2.8;

    // 3. Patrones repetitivos: Ahora buscamos en el rawText para detectar "....." o "asdasd"
    // Pero buscamos repeticiones de caracteres no puntuación (letras)
    const hasRepetitions = /(.)\1{4,}/.test(cleanText) || /(..+)\1{2,}/.test(cleanText);

    // 4. Ratio de "ruido": Si el 40% o más del texto es solo puntuación, es baja calidad
    const noiseRatio = (rawText.length - cleanText.length) / rawText.length;

    let score = diversity;
    if (isGibberish) score -= 0.5;
    if (hasRepetitions) score -= 0.5;
    if (noiseRatio > 0.4) score -= 0.4;
    if (words.length < 5) score -= 0.2;

    return {
        isLowQuality: score < 0.45,
        score: Math.max(0, score)
    };
}