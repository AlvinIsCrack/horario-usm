import { STAT_LABELS, type AnalyzerContext, type StatItem } from "../types";

// 7. CONFLICTOS (Topes)
export function analyzeConflicts(ctx: AnalyzerContext, icons: any): StatItem[] {
    const bloquesUnicos = new Set<string>();
    ctx.ramos.forEach(r => r.horario.forEach(b => bloquesUnicos.add(`${b.dia}-${b.bloque}`)));
    const totalInscripciones = ctx.ramos.reduce((sum, r) => sum + r.horario.length, 0);
    const topes = Math.ceil((totalInscripciones - bloquesUnicos.size) / 2);

    if (topes > 0) {
        return [{
            icon: icons.Warning,
            label: STAT_LABELS.CONFLICTOS,
            value: `${topes} topes`,
            tooltip: `Conflicto Crítico: Tienes que estar en dos lugares a la vez.`,
            status: 'danger'
        }];
    }
    return [];
}