import { fetchPDF } from "./.fetcher"

/**
 * Represents the comprehensive data structure extracted from a university course syllabus.
 */
export interface CourseSyllabus {
    courseName: string | null;
    courseCode: string | null;
    creditsUTFSM: number | null;
    creditsSCT: number | null;
    hasGlobalExam: boolean;
    prerequisites: string[];
    totalHours: number | null;
    description: string | null;
    entryRequirements: string | null;
    graduateProfileContribution: string | null;
    learningOutcomes: string | null;
    thematicContents: string | null;
    teachingMethodology: string | null;
    evaluationMethods: string | null;
}

/**
 * Dispatches a lightweight HTTP request to fetch a PDF, leveraging an idempotent 
 * local storage cache to prevent redundant network requests and expensive CPU parsing.
 * * @param targetPdfUrl The deterministic URL of the PDF to process.
 * @returns The structured metadata extracted from the PDF.
 */
export async function process(targetPdfUrl: string) {
    const CACHE_KEY_PREFIX = 'course_metadata_';
    const cacheKey = `${CACHE_KEY_PREFIX}${targetPdfUrl}`;

    // 1. Fail-fast / Defensive check: Attempt to retrieve from cache safely
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const cachedMetadata = localStorage.getItem(cacheKey);
            if (cachedMetadata) {
                return JSON.parse(cachedMetadata);
            }
        } catch (error) {
            // Log explicitly for debugging, but do not interrupt the execution flow
            console.warn('Failed to retrieve or parse cached PDF metadata:', error);
        }
    }

    // 2. Cache miss: Fetch from network and process the binary data
    const pdf = await fetchPDF(targetPdfUrl);
    const metadata = await extractPDF(await pdf.arrayBuffer());

    // 3. Persist to cache for future immediate hits
    if (typeof window !== 'undefined' && window.localStorage && metadata) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(metadata));
        } catch (error) {
            // Fails gracefully if storage quota is exceeded or user is in strict incognito mode
            console.warn('Storage constraint reached: Failed to persist PDF metadata.', error);
        }
    }

    return metadata;
}

/**
 * Dynamically loads PDF.js and extracts course features only on the client side.
 */
async function extractPDF(arrayBuffer: ArrayBuffer) {
    try {
        // Safe contextual import inside browser runtime boundaries
        //@ts-ignore
        const pdfjsLib = await import('pdfjs-dist');

        // Resolve worker leveraging Vite's native worker loader mechanism to prevent CDN evaluation failures
        //@ts-ignore
        const PDFWorker = await import('pdfjs-dist/build/pdf.worker?worker');
        pdfjsLib.GlobalWorkerOptions.workerPort = new PDFWorker.default();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return parseMetadata(fullText);
    } catch (error) {
        console.error('Runtime client-side PDF parsing failed:', error);
        throw error;
    }
}

/**
 * Extracts a block of text between a starting section header and the next known header.
 * * @param text The full raw document text.
 * @param startRegex The regular expression identifying the start of the section.
 * @param endRegex A regular expression matching any of the possible subsequent section headers.
 * @returns The cleaned block of text, or null if the section was not found.
 */
function extractSectionBlock(text: string, startRegex: RegExp, endRegex: RegExp): string | null {
    const startMatch = text.match(startRegex);
    if (!startMatch) return null;

    const startIndex = startMatch.index! + startMatch[0].length;
    const remainingText = text.substring(startIndex);

    const endMatch = remainingText.match(endRegex);
    const endIndex = endMatch ? endMatch.index! : remainingText.length;

    const extractedText = remainingText.substring(0, endIndex);

    // Normalize chaotic PDF line breaks into readable paragraphs
    return extractedText
        .replace(/([^\n])\n([^\n])/g, '$1 $2')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

/**
 * Preprocesa el texto crudo para eliminar encabezados y pies de página 
 * que rompen la continuidad lógica de los párrafos.
 */
function sanitizePDFText(text: string): string {
    return text
        .replace(/UNIVERSIDAD TECNICA\s+FEDERICO SANTA MARIA/gi, ' ')
        .replace(/de licencia[l]?/gi, ' ')
        .replace(/Página \d+ de \d+/gi, ' ')
        .replace(/\r\n/g, '\n')
        .trim();
}

function cleanExtractedField(text: string | null): string | null {
    if (!text) return null;
    return text
        .replace(/Página \d de \d/gi, '') // Elimina los números de página
        .replace(/\s{2,}/g, ' ')          // Reduce múltiples espacios
        .trim();
}

/**
 * Tokenizes and analyzes raw text sheets to build comprehensive course definitions.
 * Employs look-ahead regex boundaries to robustly parse unstructured PDF text outputs.
 * @param rawText The raw string content extracted from the PDF.
 * @returns The structured CourseSyllabus object.
 */
export function parseMetadata(rawText: string): CourseSyllabus | null {
    if (!rawText || rawText.trim().length === 0) {
        throw new Error("Invalid input: rawText cannot be empty.");
    }

    // 1. Limpiamos la basura de paginación
    const normalizedText = sanitizePDFText(rawText);

    // 2. Agregamos el límite final del documento para evitar desbordes
    const blockBoundaryRegex = /(?:Descripción de la Asignatura|Requisitos de entrada|Contribución al perfil de egreso|Resultados de Aprendizaje|Contenidos temáticos|Metodología de enseñanza|Evaluación y calificación|Recursos para el aprendizaje|Bibliografía|CÁLCULO DE CANTIDAD DE HORAS)\.?/i;

    // Field-level extractions
    const courseNameMatch = normalizedText.match(/Asignatura:\s*([\s\S]*?)(?=Sigla:|Fecha de aprobación)/i);
    const courseCodeMatch = normalizedText.match(/Sigla:\s*([A-Z]{3}\s*-?\s*\d{3})/i);
    const creditsUtsfmMatch = normalizedText.match(/Créditos UTFSM:\s*(\d+)/i);
    const creditsSctMatch = normalizedText.match(/Créditos SCT\s*:\s*(\d+)/i);
    const hoursMatch = normalizedText.match(/Tiempo total de dedicación[^\d]*(\d+)/i);

    const prerequisitesMatch = normalizedText.match(/Prerrequisitos:\s*([\s\S]*?)(?=Examen:|Unidad Académica)/i);
    const rawPrerequisites = prerequisitesMatch ? prerequisitesMatch[1].replace(/\s+/g, '') : "";
    const prerequisites = rawPrerequisites.length > 0 && rawPrerequisites.toUpperCase() !== "NOTIENE"
        ? rawPrerequisites.split(/[+y,]/).filter(Boolean)
        : [];

    return {
        courseName: courseNameMatch ? courseNameMatch[1].replace(/\n/g, ' ').trim() : null,
        courseCode: courseCodeMatch ? courseCodeMatch[1].replace(/\s+/g, '') : null,
        creditsUTFSM: creditsUtsfmMatch ? parseInt(creditsUtsfmMatch[1], 10) : null,
        creditsSCT: creditsSctMatch ? parseInt(creditsSctMatch[1], 10) : null,
        hasGlobalExam: !/Examen:\s*No tiene/i.test(normalizedText),
        prerequisites,
        totalHours: hoursMatch ? parseInt(hoursMatch[1], 10) : null,

        description: extractSectionBlock(
            normalizedText,
            /Descripción de la Asignatura\.?/i,
            blockBoundaryRegex
        ),
        entryRequirements: extractSectionBlock(
            normalizedText,
            /Requisitos de entrada\.?/i,
            blockBoundaryRegex
        ),
        graduateProfileContribution: extractSectionBlock(
            normalizedText,
            /Contribución al perfil de egreso\.?/i,
            blockBoundaryRegex
        ),
        learningOutcomes: extractSectionBlock(
            normalizedText,
            /Resultados de Aprendizaje[\s\S]*?asignatura\.?/i,
            blockBoundaryRegex
        ),
        thematicContents: extractSectionBlock(
            normalizedText,
            /Contenidos temáticos\.?/i,
            blockBoundaryRegex
        ),
        teachingMethodology: extractSectionBlock(
            normalizedText,
            /Metodología de enseñanza y aprendizaje\.?/i,
            blockBoundaryRegex
        ),
        evaluationMethods: cleanExtractedField(extractSectionBlock(
            normalizedText,
            /Requisitos\s+de\s+aprobación\s+y\s+calificación/i,
            /(?=Recursos para el aprendizaje|Bibliografía)/i
        ))
    };
}