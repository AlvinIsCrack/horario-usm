import { STAT_LABELS, type AnalyzerContext, type StatItem } from "../types";
import { getDatosCurriculares } from "./utils";

/**
 * Analyzes the curriculum structure to identify trajectory dispersion,
 * critical academic dependencies (prerequisite violations), and thematic saturation.
 */
export function analyzeCurriculum(ctx: AnalyzerContext, icons: any): StatItem[] {
    const out: StatItem[] = [];

    const courseData = ctx.ramos
        .map(r => ({ sigla: r.sigla, ...getDatosCurriculares(r.sigla) }))
        .filter((d): d is NonNullable<typeof d> & { sigla: string } => !!d.nivel);

    // Fail-fast: If no valid curriculum data is found, return empty early.
    if (courseData.length === 0) return out;

    // Extracted globally to be reused across different curriculum checks.
    const levels = courseData.map(d => d.nivel ?? 0);
    const maxLevel = Math.max(...levels);
    const minLevel = Math.min(...levels);

    // A. Trajectory (Dispersion)
    if (courseData.length > 1) {
        const levelDispersion = maxLevel - minLevel;

        // Determine the predominant career path based on the enrolled subjects
        const careerCount: Record<string, number> = {};
        courseData.forEach(d => {
            if (d.carrera) careerCount[d.carrera] = (careerCount[d.carrera] || 0) + 1;
        });

        const detectedCareer = Object.keys(careerCount).reduce(
            (a, b) => careerCount[a] > careerCount[b] ? a : b,
            'Tu Carrera'
        );

        // Emit warning if taking courses spread across multiple years (e.g., repeating freshmen courses while taking senior courses)
        if (levelDispersion >= 4) {
            out.push({
                icon: icons.Timeline,
                label: STAT_LABELS.TRAYECTORIA,
                value: 'Dispersa',
                tooltip: `Cursas ramos de niveles distantes (Semestre ${minLevel} y ${maxLevel}).<br/><span class="opacity-70 text-xs">Contrastado con plan de <b>${detectedCareer}</b>. Esta dispersión fragmenta tu cohorte generacional.</span>`,
                status: 'warning'
            });
        }
    }

    // B. Dependencies (Pre-requisite violation risk)
    const enrolledSubjects = new Set(ctx.ramos.map(r => r.sigla));
    const dependencyChains: string[] = [];

    courseData.forEach(d => {
        if (d.info?.requisitos) {
            const requirements = d.info.requisitos.flat();
            // Checks if any requisite of the current course is also being taken simultaneously
            const conflict = requirements.find(req => enrolledSubjects.has(req.sigla));

            if (conflict) {
                dependencyChains.push(`${conflict.sigla} ➔ ${d.sigla}`);
            }
        }
    });

    if (dependencyChains.length > 0) {
        out.push({
            icon: icons.Link,
            label: STAT_LABELS.DEPENDENCIAS,
            value: 'Tope Académico',
            tooltip: `Tomas asignaturas junto a sus requisitos: <b>${dependencyChains.join(', ')}</b>.<br/><span class="opacity-70 text-xs">Riesgoso: si fallas en la base, comprometes la avanzada.</span>`,
            status: 'danger'
        });
    }

    // C. Thematic Saturation (Monothematic)
    const departmentWeights: Record<string, number> = {};
    let totalCredits = 0;

    courseData.forEach(d => {
        if (d.info?.departamento) {
            const credits = d.info.creditos || 3;
            departmentWeights[d.info.departamento] = (departmentWeights[d.info.departamento] || 0) + credits;
            totalCredits += credits;
        }
    });

    for (const [department, credits] of Object.entries(departmentWeights)) {
        // Requires minLevel > 2 to prevent triggering warnings during mandatory early math/physics years (Plan Común)
        if (totalCredits > 0 && (credits / totalCredits) > 0.8 && ctx.ramos.length >= 4 && minLevel > 2) {
            out.push({
                icon: icons.Category,
                label: STAT_LABELS.TEMÁTICA,
                value: 'Monotemático',
                tooltip: `El <b>${(credits / totalCredits * 100).toFixed(0)}%</b> de tu carga es de <b>${department.replace('Departamento de ', '')}</b>.<br/><span class="opacity-70 text-xs">Alta saturación en un área específica.</span>`,
                status: 'warning'
            });
        }
    }

    return out;
}