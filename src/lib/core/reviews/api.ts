import { getClientFingerprint, getAbuseMetadata } from './fingerprint';
import type { TagId } from '$lib/core/professors/types';

const API_URL = "https://script.google.com/macros/s/AKfycbwt3x_JzbcCvB1yUp77nJ-NuZHV08GBeVYazsQkrN_so90q5PLCYH1mQ1Gj8x7kdFJf/exec";
const LOCAL_LOG_KEY = 'usm_reviews_activity';

// Tiempo que consideramos un voto como "Pendiente" antes de asumir que ya se procesó (o falló)
// 45 minutos (dado que el script corre cada 30 min)
const PENDING_WINDOW_MS = 45 * 60 * 1000;

// Límite de velocidad para advertencia UX (ej: 3 votos en 5 minutos)
const SPAM_WINDOW_MS = 5 * 60 * 1000;
const SPAM_LIMIT_COUNT = 3;

interface ActivityLog {
    [profId: string]: number; // Timestamp del voto
}

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

// --- LÓGICA LOCAL (Feedback Loop) ---

function getLocalLog(): ActivityLog {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_LOG_KEY) || '{}');
    } catch { return {}; }
}

function saveLocalLog(log: ActivityLog) {
    localStorage.setItem(LOCAL_LOG_KEY, JSON.stringify(log));
}

/**
 * Verifica si el usuario ya votó recientemente por este profesor.
 * Retorna true si el voto está en la ventana de "procesamiento".
 */
export function hasPendingReview(profId: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    const log = getLocalLog();
    const timestamp = log[profId];
    if (!timestamp) return false;

    return (Date.now() - timestamp) < PENDING_WINDOW_MS;
}

/**
 * Analiza el comportamiento reciente del usuario.
 * Retorna advertencia si está votando muy rápido.
 */
export function checkSpamStatus(): { isSpam: boolean; message?: string } {
    if (typeof localStorage === 'undefined') return { isSpam: false };

    const log = getLocalLog();
    const now = Date.now();
    const recentVotes = Object.values(log).filter(ts => (now - ts) < SPAM_WINDOW_MS);

    if (recentVotes.length >= SPAM_LIMIT_COUNT) {
        return {
            isSpam: true,
            message: 'Estás enviando reseñas muy rápido. Por favor espera unos minutos.'
        };
    }
    return { isSpam: false };
}

// --- ENVÍO ---

export async function submitReview(data: ReviewPayload): Promise<{ success: boolean; error?: string }> {
    // 1. Chequeo preventivo de Spam
    const spamCheck = checkSpamStatus();
    if (spamCheck.isSpam) {
        return { success: false, error: spamCheck.message };
    }

    const fullPayload: any = {
        professorId: data.professorId,
        fingerprint: getClientFingerprint(),
        meta: getAbuseMetadata(),
        clientTime: new Date().toISOString(),
        data
    };

    try {
        // 2. Registro Optimista (Feedback Inmediato)
        // Guardamos antes de enviar para evitar doble click accidental y dar feedback UI instantáneo
        const log = getLocalLog();
        log[data.professorId] = Date.now();
        saveLocalLog(log);

        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(fullPayload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });

        const result = await response.json();

        if (result.status === 'error') {
            return { success: false, error: result.message || 'Error en el servidor.' };
        }

        return { success: true };

    } catch (e) {
        return { success: false, error: 'Error de conexión. Intenta más tarde.' };
    }
}