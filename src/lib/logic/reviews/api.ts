import { getClientFingerprint, getAbuseMetadata } from './fingerprint';
import type { TagId } from '$lib/logic/professors/types';

// PEGAR TU URL DE GOOGLE SCRIPT AQUÍ
const API_URL = "https://script.google.com/macros/s/AKfycbwt3x_JzbcCvB1yUp77nJ-NuZHV08GBeVYazsQkrN_so90q5PLCYH1mQ1Gj8x7kdFJf/exec";

export interface ReviewPayload {
    professorId: string;
    metrics: {
        estabilidad: number;
        coherencia: number;
        accesibilidad: string;
    };
    tags: TagId[];
    comment?: string;
}

export async function submitReview(data: ReviewPayload): Promise<boolean> {
    const fullPayload: any = {
        professorId: data.professorId,
        fingerprint: getClientFingerprint(),
        meta: getAbuseMetadata(),
        clientTime: new Date().toISOString(),
        data
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(fullPayload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
        });

        // Intentamos leer la respuesta JSON
        const result = await response.json();

        if (result.status === 'error') {
            console.error('GAS Error:', result.message);
            return false;
        }
        return true;

    } catch (e) {
        console.error('Error de envío (Red/CORS):', e);
        return false;
    }
}