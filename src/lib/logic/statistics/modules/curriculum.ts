import { STAT_LABELS, type AnalyzerContext, type StatItem } from "../types";
import { getDatosCurriculares } from "./utils";

// 6. CURRICULAR (Malla)
export function analyzeCurriculum(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];
    const datosRamos = ctx.ramos
        .map(r => ({ sigla: r.sigla, ...getDatosCurriculares(r.sigla) }))
        .filter((d): d is NonNullable<typeof d> & { sigla: string } => !!d.nivel);

    // A. Trayectoria (Dispersión)
    if (datosRamos.length > 1) {
        const niveles = datosRamos.map(d => d.nivel ?? 0);
        const max = Math.max(...niveles);
        const min = Math.min(...niveles);
        const dispersion = max - min;

        // Detectar carrera
        const conteo = {} as Record<string, number>;
        datosRamos.forEach(d => { if (d.carrera) conteo[d.carrera] = (conteo[d.carrera] || 0) + 1; });
        const carrera = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b, 'Tu Carrera');

        if (dispersion >= 4) {
            out.push({
                icon: icons.Timeline,
                label: STAT_LABELS.TRAYECTORIA,
                value: 'Dispersa',
                tooltip: `Cursas ramos de niveles distantes (Semestre ${min} y ${max}).<br/><span class="opacity-70 text-xs">Contrastado con plan de <b>${carrera}</b>. Esta dispersión fragmenta tu cohorte generacional.</span>`,
                status: 'warning'
            });
        }
    }

    // B. Dependencias
    const siglasTomadas = new Set(ctx.ramos.map(r => r.sigla));
    const cadenas: string[] = [];
    datosRamos.forEach(d => {
        if (d.info && d.info.requisitos) {
            const reqs = d.info.requisitos.flat();
            const conflicto = reqs.find(req => siglasTomadas.has(req));
            if (conflicto) cadenas.push(`${conflicto} ➔ ${d.sigla}`);
        }
    });

    if (cadenas.length > 0) {
        out.push({
            icon: icons.Link, // Icono Link
            label: STAT_LABELS.DEPENDENCIAS,
            value: 'Tope Académico',
            tooltip: `Tomas asignaturas junto a sus requisitos: <b>${cadenas.join(', ')}</b>.<br/><span class="opacity-70 text-xs">Riesgoso: si fallas en la base, comprometes la avanzada.</span>`,
            status: 'danger'
        });
    }

    // C. Temática (Monotemático)
    const deptos: Record<string, number> = {};
    let totalCred = 0;
    datosRamos.forEach(d => {
        if (d.info && d.info.departamento) {
            const c = d.info.creditos || 3;
            deptos[d.info.departamento] = (deptos[d.info.departamento] || 0) + c;
            totalCred += c;
        }
    });

    for (const [depto, cred] of Object.entries(deptos)) {
        if (totalCred > 0 && (cred / totalCred) > 0.65 && ctx.ramos.length >= 3) {
            out.push({
                icon: icons.Category, // Icono Category
                label: STAT_LABELS.TEMÁTICA,
                value: 'Monotemático',
                tooltip: `El <b>${(cred / totalCred * 100).toFixed(0)}%</b> de tu carga es de <b>${depto.replace('Departamento de ', '')}</b>.<br/><span class="opacity-70 text-xs">Alta saturación en un área específica.</span>`,
                status: 'warning'
            });
        }
    }

    return out;
}