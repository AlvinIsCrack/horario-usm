<script module>
	import { tv } from 'tailwind-variants';

	const mallaStatsVariants = tv({
		slots: {
			card: ['bg-card space-y-2 overflow-hidden rounded border p-3'],
			bigNumber: 'text-5xl font-black tabular-nums',
			bigAddon: '-ml-1 text-base font-normal text-muted-foreground',
			separator: 'bg-border -mx-4 h-px w-auto'
		}
	});

	const styles = mallaStatsVariants();
</script>

<script lang="ts">
	import type { MallaState } from '../malla.svelte';

	const {
		malla
	}: {
		malla: MallaState;
	} = $props();

	const { base, progress, electives, projections } = $derived.by(() => {
		let totalCredits = 0;
		let approvedCredits = 0;
		let totalCourses = 0;
		let approvedCourses = 0;
		let unlockableCourses = 0;
		let maxSemesters = 0;
		let totalElectiveCredits = 0;
		let approvedElectiveCredits = 0;
		let totalElectiveCourses = 0;
		let approvedElectiveCourses = 0;

		if (malla.rawMalla) {
			malla.rawMalla.forEach((semestre, i) => {
				if (semestre.length > 0) {
					maxSemesters = Math.max(maxSemesters, i + 1);
				}

				semestre.forEach((ramo) => {
					totalCredits += ramo.creditos;
					totalCourses++;

					const isApproved = malla.approvedSigs.has(ramo.sigla);

					if (ramo.esElectivo) {
						totalElectiveCredits += ramo.creditos;
						totalElectiveCourses++;

						if (isApproved) {
							approvedElectiveCredits += ramo.creditos;
							approvedElectiveCourses++;
						}
					}

					if (isApproved) {
						approvedCredits += ramo.creditos;
						approvedCourses++;

						if (ramo.esElectivo) {
							approvedElectiveCredits += ramo.creditos;
						}
					} else {
						// Evaluates if all groups of prerequisites have at least one approved requirement (OR logic)
						const requirementsMet = ramo.requisitos.every((reqGroup) =>
							reqGroup.some((req) => malla.approvedSigs.has(req.sigla))
						);

						if (requirementsMet || ramo.requisitos.length === 0) {
							unlockableCourses++;
						}
					}
				});
			});
		}

		// Progress percentages
		const progressCourses = totalCourses > 0 ? (approvedCourses / totalCourses) * 100 : 0;
		const progressCredits = totalCredits > 0 ? (approvedCredits / totalCredits) * 100 : 0;

		// Remaining academic load
		const remainingCourses = totalCourses - approvedCourses;
		const remainingCredits = totalCredits - approvedCredits;

		// Time estimators
		// Assumes the student will take an average academic load matching the curriculum's design
		const avgCreditsPerSemester = maxSemesters > 0 ? totalCredits / maxSemesters : 0;
		const estimatedSemestersLeft =
			avgCreditsPerSemester > 0 ? Math.ceil(remainingCredits / avgCreditsPerSemester) : 0;

		return {
			base: {
				totalCredits,
				approvedCredits,
				totalCourses,
				approvedCourses,
				maxSemesters,
				unlockableCourses
			},
			progress: {
				coursesPercent: progressCourses,
				creditsPercent: progressCredits
			},
			electives: {
				totalCourses: totalElectiveCourses,
				approvedCourses: approvedElectiveCourses,
				totalCredits: totalElectiveCredits,
				approvedCredits: approvedElectiveCredits
			},
			projections: {
				remainingCourses,
				remainingCredits,
				estimatedSemestersLeft
			}
		};
	});
</script>

{#snippet totalProgress()}
	{@const totalCourseProgress = base.approvedCourses / base.totalCourses}
	<div class={styles.card()}>
		<h2 class="label">Progreso</h2>

		<div class={styles.separator()}></div>

		<div class="text-muted-foreground tabular-nums">
			<div class="flex justify-between gap-4">
				<div class="text-foreground">Ramos</div>
				<div class="text-right">
					{base.approvedCourses} de {base.totalCourses}
				</div>
			</div>
			<div class="flex justify-between gap-4">
				<div class="text-foreground">Créditos SCT</div>
				<div class="text-right">
					{base.approvedCredits} de {base.totalCredits}
				</div>
			</div>

			<div class="flex justify-between gap-4">
				<div class="text-foreground">SCT/semestre</div>
				<div class="text-right">
					~{Math.round(base.totalCredits / base.maxSemesters)}
				</div>
			</div>
		</div>

		<div class={styles.separator()}></div>

		<div class="flex w-full flex-row items-end">
			<h1 class={styles.bigNumber({})}>
				{Math.round(totalCourseProgress * 100)}
				<span class={styles.bigAddon({ class: '-ml-2' })}>% a partir de ramos</span>
			</h1>
		</div>

		<div class="bg-primary/20 -mx-4 -mb-4 h-8 w-auto border-t">
			<span
				class="bg-primary block h-full origin-right scale-x-115 -skew-x-8 border-r"
				style="width: {totalCourseProgress * 100}%"
			></span>
		</div>
	</div>
{/snippet}

{#snippet estimateTime()}
	<div class={styles.card()}>
		<h2 class="label">Estimación de tiempo</h2>

		<div class={styles.separator()}></div>

		<div class="text-muted-foreground tabular-nums">
			<div class="flex justify-between gap-4">
				<div class="text-foreground">SCT restantes</div>
				<div class="text-right">
					{projections.remainingCredits}
				</div>
			</div>
			<div class="flex justify-between gap-4">
				<div class="text-foreground">Ramos restantes</div>
				<div class="text-right">
					{projections.remainingCourses}
				</div>
			</div>
			<div class="flex justify-between gap-4">
				<div class="text-foreground">Ramos no electivos</div>
				<div class="text-right">
					{projections.remainingCourses - (electives.totalCourses - electives.approvedCourses)}
				</div>
			</div>
		</div>

		<div class={styles.separator()}></div>

		<div class={styles.bigNumber({})}>
			{projections.estimatedSemestersLeft}
			<span class={styles.bigAddon({})}>semestres aprox.</span>
		</div>
	</div>
{/snippet}

{#snippet electivesInfo()}
	{@const remainingElectives = electives.totalCourses - electives.approvedCourses}
	{@const progressElectives =
		electives.totalCourses > 0 ? (electives.approvedCourses / electives.totalCourses) * 100 : 0}

	<div class={styles.card()}>
		<div class="flex items-center justify-between">
			<h2 class="label">Electivos</h2>
			<span class="text-muted-foreground text-xs font-medium">
				<b>{electives.approvedCourses}</b> de <b>{electives.totalCourses}</b> aprobados
			</span>
		</div>

		<div class={styles.separator()}></div>

		<div class="flex items-end gap-2">
			<div class={styles.bigNumber({})}>
				{remainingElectives}
			</div>
			<div class={styles.bigAddon({ class: 'ml-0' })}>electivos pendientes</div>
		</div>

		<div class="-mx-4 mt-4 -mb-4 h-8 w-auto border-t bg-amber-500/20">
			<span
				class="block h-full origin-right scale-x-115 -skew-x-8 border-r bg-amber-500"
				style="width: {progressElectives}%"
			></span>
		</div>
	</div>
{/snippet}

<div class="space-y-2">
	{@render totalProgress()}
	{@render estimateTime()}
	{@render electivesInfo()}
</div>
