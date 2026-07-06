/**
 * Pure function to format relative time vectors based on a static pivot context.
 */
export function formatRelativeTime(isoDate?: string, currentTimestamp: number = Date.now()): string {
    if (!isoDate) return '';

    const diff = currentTimestamp - new Date(isoDate).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Reciente'; // Prevents negative time shifts due to local desync
    if (days < 7) return 'Reciente';
    if (days < 30) return `Hace ${days}d`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;

    return '+1 año';
}