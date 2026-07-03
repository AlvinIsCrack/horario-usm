// src/lib/helpers/readStatus.ts

interface TrackerOptions {
    storageKey: string;
    thresholdHours?: number;
    expirationDays?: number;
    nightStartHour?: number;
    nightEndHour?: number;
}

export class SmartReadTracker {
    private key: string;
    private thresholdMs: number;
    private expirationMs: number;
    private nightStart: number;
    private nightEnd: number;

    constructor(options: TrackerOptions) {
        this.key = options.storageKey;
        this.thresholdMs = (options.thresholdHours ?? 8) * 60 * 60 * 1000;
        this.expirationMs = (options.expirationDays ?? 30 * 4) * 24 * 60 * 60 * 1000;
        this.nightStart = options.nightStartHour ?? 0;
        this.nightEnd = options.nightEndHour ?? 8;
    }

    /**
     * Procesa una lista de IDs (strings o números) y determina cuáles son "nuevos".
     * Gestiona automáticamente la persistencia y limpieza en localStorage.
     */
    public process(itemIds: (string | number)[]): Set<string | number> {
        if (typeof localStorage === 'undefined') return new Set();

        const now = Date.now();
        const raw = localStorage.getItem(this.key);
        let seenData: Record<string, number> = raw ? JSON.parse(raw) : {};
        let hasChanges = false;
        const newItems = new Set<string | number>();

        // 1. Garbage Collection: Eliminar entradas muy viejas
        for (const [id, timestamp] of Object.entries(seenData)) {
            if (now - timestamp > this.expirationMs) {
                delete seenData[id];
                hasChanges = true;
            }
        }

        // 2. Evaluación de items actuales
        for (const id of itemIds) {
            const strId = String(id);
            const firstSeen = seenData[strId];

            if (!firstSeen) {
                // CASO A: Nunca visto. Es nuevo.
                newItems.add(id);
                seenData[strId] = now;
                hasChanges = true;
            } else {
                // CASO B: Visto anteriormente. Calculamos si sigue siendo "nuevo".
                // Usamos tiempo efectivo (descontando noche)
                const effectiveElapsed = this.calculateEffectiveElapsed(firstSeen, now);

                if (effectiveElapsed < this.thresholdMs) {
                    newItems.add(id);
                }
            }
        }

        if (hasChanges) {
            localStorage.setItem(this.key, JSON.stringify(seenData));
        }

        return newItems;
    }

    /**
     * Calcula el tiempo transcurrido excluyendo el rango nocturno.
     * Ejemplo: Si el rango es 00:00 - 06:00.
     * Visto a las 23:00, Ahora son las 07:00 (Día siguiente).
     * Real: 8 horas.
     * Noche: 6 horas.
     * Efectivo: 2 horas.
     */
    private calculateEffectiveElapsed(startMs: number, endMs: number): number {
        let totalElapsed = endMs - startMs;
        if (totalElapsed <= 0) return 0;

        // Iteramos día por día para restar las intersecciones con la "noche"
        let cursor = new Date(startMs);
        const endDate = new Date(endMs);
        let deductedMs = 0;

        // Clonamos para no mutar cursor en el loop de forma insegura
        const currentCheck = new Date(cursor);

        // Retrocedemos al inicio del día del 'start' para iterar días completos si es necesario
        currentCheck.setHours(0, 0, 0, 0);

        while (currentCheck.getTime() <= endMs) {
            // Definir ventana de noche para "este día" del bucle
            const nightStart = new Date(currentCheck);
            nightStart.setHours(this.nightStart, 0, 0, 0);

            const nightEnd = new Date(currentCheck);
            nightEnd.setHours(this.nightEnd, 0, 0, 0);

            // Calcular intersección entre [startMs, endMs] y [nightStart, nightEnd]
            const overlapStart = Math.max(startMs, nightStart.getTime());
            const overlapEnd = Math.min(endMs, nightEnd.getTime());

            if (overlapEnd > overlapStart) {
                deductedMs += (overlapEnd - overlapStart);
            }

            // Avanzar al siguiente día
            currentCheck.setDate(currentCheck.getDate() + 1);
        }

        return totalElapsed - deductedMs;
    }
}