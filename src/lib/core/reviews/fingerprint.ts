// src/lib/logic/reviews/fingerprint.ts

const STORAGE_KEY = 'usm_client_did';

/**
 * Obtiene o genera un identificador único persistente para este navegador.
 */
export function getClientFingerprint(): string {
    if (typeof localStorage === 'undefined') return 'server-side';

    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
        // Generamos un UUID v4 o un fallback aleatorio robusto
        id = crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}

/**
 * Recolecta metadata técnica para análisis de abuso/spam.
 * No recolecta PII (Información Personal Identificable) directa.
 */
export function getAbuseMetadata() {
    if (typeof window === 'undefined') return {};

    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        localTime: new Date().toISOString(),
        // Platform ayuda a detectar si el OS coincide con el UserAgent
        platform: (navigator as any).userAgentData?.platform || navigator.platform
    };
}