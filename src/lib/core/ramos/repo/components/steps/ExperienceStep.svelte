<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MaterialSymbolsTimer1 from '$lib/icons/MaterialSymbolsTimer1.svelte';
	import MaterialSymbolsTimer2 from '$lib/icons/MaterialSymbolsTimer2.svelte';
	import MaterialSymbolsTimer3 from '$lib/icons/MaterialSymbolsTimer3.svelte';
	import MingcuteArrowUpCircleFill from '$lib/icons/MingcuteArrowUpCircleFill.svelte';
	import MingcuteArrowUpCircleLine from '$lib/icons/MingcuteArrowUpCircleLine.svelte';
	import MingcuteCalendarMonthFill from '$lib/icons/MingcuteCalendarMonthFill.svelte';
	import MingcuteCalendarMonthLine from '$lib/icons/MingcuteCalendarMonthLine.svelte';
	import MingcuteCheckCircleFill from '$lib/icons/MingcuteCheckCircleFill.svelte';
	import MingcuteCheckCircleLine from '$lib/icons/MingcuteCheckCircleLine.svelte';
	import MingcuteCloseCircleFill from '$lib/icons/MingcuteCloseCircleFill.svelte';
	import MingcuteCloseCircleLine from '$lib/icons/MingcuteCloseCircleLine.svelte';
	import MingcuteDiamondSquareFill from '$lib/icons/MingcuteDiamondSquareFill.svelte';
	import MingcuteDiamondSquareLine from '$lib/icons/MingcuteDiamondSquareLine.svelte';
	import MingcuteForbidCircleFill from '$lib/icons/MingcuteForbidCircleFill.svelte';
	import MingcuteForbidCircleLine from '$lib/icons/MingcuteForbidCircleLine.svelte';
	import MingcuteHeartCrackFill from '$lib/icons/MingcuteHeartCrackFill.svelte';
	import MingcuteHeartCrackLine from '$lib/icons/MingcuteHeartCrackLine.svelte';
	import MingcuteHeartFill from '$lib/icons/MingcuteHeartFill.svelte';
	import MingcuteHeartLine from '$lib/icons/MingcuteHeartLine.svelte';
	import MingcuteMinusCircleFill from '$lib/icons/MingcuteMinusCircleFill.svelte';
	import MingcuteMinusCircleLine from '$lib/icons/MingcuteMinusCircleLine.svelte';
	import MingcuteThumbDown2Fill from '$lib/icons/MingcuteThumbDown2Fill.svelte';
	import MingcuteThumbDown2Line from '$lib/icons/MingcuteThumbDown2Line.svelte';
	import MingcuteThumbUp2Fill from '$lib/icons/MingcuteThumbUp2Fill.svelte';
	import MingcuteThumbUp2Line from '$lib/icons/MingcuteThumbUp2Line.svelte';
	import MingcuteUser2Fill from '$lib/icons/MingcuteUser2Fill.svelte';
	import { Form } from '$lib/components/ui/form';
	import { isFieldAnswered } from '$lib/components/ui/form/helpers';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField, { type IconToggleItem } from '../forms/IconToggleField.svelte';
	import MingcuteDeleteFill from '$lib/icons/MingcuteDeleteFill.svelte';
	import MingcuteDeleteLine from '$lib/icons/MingcuteDeleteLine.svelte';
	import MingcuteSnowFill from '$lib/icons/MingcuteSnowFill.svelte';
	import MingcuteSnowLine from '$lib/icons/MingcuteSnowLine.svelte';
	import MingcuteHeartbeat2Fill from '$lib/icons/MingcuteHeartbeat2Fill.svelte';
	import MingcuteHeartbeat2Line from '$lib/icons/MingcuteHeartbeat2Line.svelte';
	import MingcuteShieldShapeFill from '$lib/icons/MingcuteShieldShapeFill.svelte';
	import MingcuteShieldShapeLine from '$lib/icons/MingcuteShieldShapeLine.svelte';
	import MingcuteQuestionFill from '$lib/icons/MingcuteQuestionFill.svelte';
	import MingcuteQuestionLine from '$lib/icons/MingcuteQuestionLine.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();

	const isTemporalContextSelected = $derived(isFieldAnswered(form, 'temporal-context'));
	const previousAttempts = $derived(form.values['previous-attempts']);
	const isAttemptsSelected = $derived(isFieldAnswered(form, 'previous-attempts'));

	const isDroppedBeforeRequired = $derived(isAttemptsSelected && previousAttempts !== '1');
	const isDroppedBeforeSelected = $derived(isFieldAnswered(form, 'dropped-before'));
	const canShowFinalStatus = $derived(
		isAttemptsSelected && (!isDroppedBeforeRequired || isDroppedBeforeSelected)
	);

	const finalStatus = $derived(form.values['final-status']);
	const isFinalStatusSelected = $derived(isFieldAnswered(form, 'final-status'));
	const isFailureReasonRequired = $derived(isFinalStatusSelected && finalStatus === 'fail');
	const isFailureReasonSelected = $derived(isFieldAnswered(form, 'failure-reason'));

	const isPendingReasonRequired = $derived(isFinalStatusSelected && finalStatus === 'pending');
	const isPendingReasonSelected = $derived(isFieldAnswered(form, 'pending-reason'));

	const isBranchingPathResolved = $derived(
		finalStatus === 'pass' ||
			(isFailureReasonRequired && isFailureReasonSelected) ||
			(isPendingReasonRequired && isPendingReasonSelected)
	);
	
	const canShowHasGlobal = $derived(isFinalStatusSelected && isBranchingPathResolved);
	const hasGlobal = $derived(form.values['has-global']);
	const isHasGlobalSelected = $derived(isFieldAnswered(form, 'has-global'));

	const canShowUsedGlobal = $derived(canShowHasGlobal && isHasGlobalSelected && hasGlobal === 'yes');
	const usedGlobal = $derived(form.values['used-global']);
	const isUsedGlobalSelected = $derived(isFieldAnswered(form, 'used-global'));

	const isGlobalReasonRequired = $derived(isUsedGlobalSelected && (usedGlobal === 'yes' || usedGlobal === 'no'));
	const isGlobalReasonSelected = $derived(
		isFieldAnswered(form, 'global-reason-yes') || isFieldAnswered(form, 'global-reason-no')
	);

	const canShowDropIntention = $derived(
		isHasGlobalSelected && 
		(hasGlobal !== 'yes' || (isUsedGlobalSelected && (!isGlobalReasonRequired || isGlobalReasonSelected)))
	);

	const isDropIntentionRequired = $derived(isFinalStatusSelected && finalStatus !== 'drop');
	const isDropIntentionSelected = $derived(isFieldAnswered(form, 'risk-perception'));
	const canShowCourseGrade = $derived(
		canShowDropIntention &&
			(!isDropIntentionRequired || isDropIntentionSelected) &&
			finalStatus !== 'drop'
	);

	/**
	 * Evaluation matrix containing all predefined grade range thresholds.
	 */
	const GRADE_OPTIONS: Record<string, IconToggleItem & { at: number }> = {
		failedCritical: {
			value: 'failed-critical',
			label: '≤30',
			desc: 'Crítico',
			at: 30,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		failedLow: {
			value: 'failed-low',
			label: '31 a 45',
			desc: 'Bajo',
			at: 45,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		failedHigh: {
			value: 'failed-high',
			label: '46 a 49',
			desc: 'Insuficiente',
			at: 49,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		failedMarginal: {
			value: 'failed-marginal',
			label: '50 a 54',
			desc: 'Al límite',
			at: 54,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		passMarginal: {
			value: 'pass-marginal',
			label: '55 a 59',
			desc: 'Raspando',
			at: 59,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		passStandard: {
			value: 'pass-standard',
			label: '60 a 70',
			desc: 'Sólido',
			at: 70,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		passAdvanced: {
			value: 'pass-advanced',
			label: '71 a 84',
			desc: 'Destacado',
			at: 84,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		},
		passExcellent: {
			value: 'pass-excellent',
			label: '≥85',
			desc: 'Excelencia',
			at: 100,
			iconOn: MingcuteDiamondSquareFill,
			iconOff: MingcuteDiamondSquareLine
		}
	};

	/**
	 * Dynamically evaluates and filters available grade buckets.
	 */
	const filteredGradeItems = $derived(() => {
		const allOptions = Object.values(GRADE_OPTIONS);

		if (finalStatus === 'pass') {
			return allOptions.filter((option) => option.at >= 55).sort((a, b) => a.at - b.at);
		}

		if (finalStatus === 'fail-grade' || finalStatus === 'fail-inassistance') {
			return allOptions.filter((option) => option.at < 55).sort((a, b) => a.at - b.at);
		}

		return [];
	});
</script>

<Form.Field name="temporal-context" class={styles.container()}>
	<FieldHeader
		title="Recuerdo del Ramo"
		description="¿Hace cuántos semestres terminaste de cursar este ramo?"
		htmlFor="temporal-context"
	/>
	<IconToggleField
		items={[
			{
				value: '0',
				label: '1 sem.',
				desc: 'Reciente',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '1',
				label: '2 sem.',
				desc: 'Fresco',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '2',
				label: '3-4 sem.',
				desc: 'Pasado',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '3',
				label: 'Antes',
				desc: 'Hace mucho',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			}
		]}
	/>
	<Form.Message />
</Form.Field>

{#if isTemporalContextSelected}
	<Form.Field name="professor-name" class={styles.container()}>
		<FieldHeader 
			optional 
			title="Profesor del paralelo" 
			description="¿Con qué docente cursaste la asignatura? Opcional y anónimo." 
			htmlFor="professor-name" 
		/>
		<div class="w-full flex justify-end">
			<Input
				id="professor-name"
				name="professor-name"
				type="text"
				placeholder="Ej: Federico Santa María, Pepito..."
				bind:value={() => form.values['professor-name'], (v) => form.setFieldValue('professor-name', v)}
				class="md:max-w-xs"
			/>
		</div>
		<Form.Message />
	</Form.Field>
{/if}

{#if isTemporalContextSelected}
	<Form.Field name="previous-attempts" class={styles.container()}>
		<FieldHeader
			title="Intentos"
			description="¿Cuántas veces inscribiste el ramo? (Incluye semestres que hayas botado/RAV)"
			htmlFor="previous-attempts"
		/>
		<IconToggleField
			items={[
				{
					value: '1',
					label: 'Única Vez',
					desc: 'VTR1',
					iconOn: MaterialSymbolsTimer1,
					iconOff: MaterialSymbolsTimer1
				},
				{
					value: '2-rav',
					label: 'Dos Veces',
					desc: 'VTR1',
					iconOn: MaterialSymbolsTimer2,
					iconOff: MaterialSymbolsTimer2
				},
				{
					value: '3+',
					label: 'Más Veces',
					desc: 'VTR3 o más',
					iconOn: MaterialSymbolsTimer3,
					iconOff: MaterialSymbolsTimer3
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isDroppedBeforeRequired}
	<Form.Field name="dropped-before" class={styles.container()}>
		<FieldHeader
			title="Botado Previamente"
			description="¿Habías anulado o desinscrito esta asignatura en semestres anteriores? (Botón de pánico, congelar)"
			htmlFor="dropped-before"
		/>
		<IconToggleField
			items={[
				{
					value: 'no',
					label: 'No',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				},
				{ value: 'yes', label: 'Sí', iconOn: MingcuteThumbUp2Fill, iconOff: MingcuteThumbUp2Line }
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if canShowFinalStatus}
	<Form.Field name="final-status" class={styles.container()}>
		<FieldHeader
			title="Situación Final"
			description="¿Cuál fue tu último resultado en el ramo?"
			htmlFor="final-status"
		/>
		<IconToggleField
			items={[
				{
					value: 'pass',
					label: 'Aprobado',
					desc: 'Pasé',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'fail',
					label: 'Reprobado',
					desc: 'Repetí',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'pending',
					label: 'Pendiente',
					desc: 'No terminé',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isFailureReasonRequired}
	<Form.Field name="failure-reason" class={styles.container()}>
		<FieldHeader
			title="Motivo de Reprobación"
			description="¿Por qué reprobaste la asignatura?"
			htmlFor="failure-reason"
		/>
		<IconToggleField
			items={[
				{
					value: 'grade',
					label: 'Por Nota',
					desc: 'No me dió',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'attendance',
					label: 'Por Asistencia',
					desc: 'Exigía',
					iconOn: MingcuteUser2Fill,
					iconOff: MingcuteUser2Fill
				},
				{
					value: 'other',
					label: 'Otro',
					desc: 'Es complicado',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isPendingReasonRequired}
	<Form.Field name="pending-reason" class={styles.container()}>
		<FieldHeader
			title="Estado de Incompletitud"
			description="¿Por qué el ramo quedó pendiente o sin terminar?"
			htmlFor="pending-reason"
		/>
		<IconToggleField
			items={[
				{
					value: 'drop',
					label: 'Lo Boté',
					desc: 'Desinscrito/RAV',
					iconOn: MingcuteDeleteFill,
					iconOff: MingcuteDeleteLine
				},
				{
					value: 'freeze',
					label: 'Congelé',
					desc: 'Algo externo',
					iconOn: MingcuteSnowFill,
					iconOff: MingcuteSnowLine
				},
				{
					value: 'other',
					label: 'Otro',
					desc: 'Es complicado',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if canShowHasGlobal}
	<Form.Field name="has-global" class={styles.container()}>
		<FieldHeader
			title="Existencia de Global"
			description="¿Tiene este ramo una instancia de examen global final del semestre?"
			htmlFor="has-global"
		/>
		<IconToggleField
			items={[
				{
					value: 'yes',
					label: 'Sí, existe',
					desc: 'Sí planificado',
					tooltip: 'El ramo contempla formalmente un certamen global',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'no',
					label: 'No existe',
					desc: 'Sin global',
					tooltip: 'No existe esa instancia en el ramo bajo ninguna circunstancia',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'unknown',
					label: 'No sé',
					desc: 'No recuerdo',
					tooltip: 'No estoy seguro o no recuerdo si el programa de estudios contemplaba esta evaluación',
					iconOn: MingcuteQuestionFill,
					iconOff: MingcuteQuestionLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if canShowUsedGlobal}
	<Form.Field name="used-global" class={styles.container()}>
		<FieldHeader
			title="Evaluación Global"
			description="¿Rendiste el examen global?"
			htmlFor="used-global"
		/>
		<IconToggleField
			items={[
				{
					value: 'yes',
					label: 'Sí',
					desc: 'Asistí',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'no',
					label: 'No',
					desc: 'No asistí',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isGlobalReasonRequired && hasGlobal === 'yes'}
	{#if usedGlobal === 'yes'}
		<Form.Field name="global-reason-yes" class={styles.container()}>
			<FieldHeader
				title="Motivo de rendición"
				description="¿Cuál era tu objetivo principal al dar el examen?"
				htmlFor="global-reason-yes"
			/>
			<IconToggleField
				items={[
					{
						value: 'yes-pass',
						label: 'Para Aprobar',
						desc: 'Necesidad',
						iconOn: MingcuteCheckCircleFill,
						iconOff: MingcuteCheckCircleLine
					},
					{
						value: 'yes-grade',
						label: 'Para Nota',
						desc: 'Subir promedio',
						iconOn: MingcuteArrowUpCircleFill,
						iconOff: MingcuteArrowUpCircleLine
					},
					{
						value: 'yes-recover',
						label: 'Recuperar',
						desc: 'Inasistencia',
						iconOn: MingcuteCalendarMonthFill,
						iconOff: MingcuteCalendarMonthLine
					},
					{
						value: 'other',
						label: 'No aplica',
						desc: 'Otro motivo',
						iconOn: MingcuteForbidCircleFill,
						iconOff: MingcuteForbidCircleLine
					}
				]}
			/>
			<Form.Message />
		</Form.Field>
	{:else if usedGlobal === 'no'}
		<Form.Field name="global-reason-no" class={styles.container()}>
			<FieldHeader
				title="Motivo de no rendición"
				description="¿Por qué no te presentaste al examen?"
				htmlFor="global-reason-no"
			/>
			<IconToggleField
				items={[
					{
						value: 'no-exempt',
						label: 'Eximido',
						desc: 'Aprobado',
						iconOn: MingcuteCheckCircleFill,
						iconOff: MingcuteCheckCircleLine
					},
					{
						value: 'no-abandon',
						label: 'Inútil',
						desc: 'Inalcanzable',
						tooltip: 'Nota inalcanzable, no valía la pena',
						iconOn: MingcuteMinusCircleFill,
						iconOff: MingcuteMinusCircleLine
					},
					{
						value: 'no-not-possible',
						label: 'Sin Derecho',
						desc: 'Incapacidad',
						tooltip: 'No cumplía requisitos',
						iconOn: MingcuteCloseCircleFill,
						iconOff: MingcuteCloseCircleLine
					},
					{
						value: 'other',
						label: 'No Aplica',
						desc: 'Otro motivo',
						tooltip: 'Otros motivos',
						iconOn: MingcuteForbidCircleFill,
						iconOff: MingcuteForbidCircleLine
					}
				]}
			/>
			<Form.Message />
		</Form.Field>
	{/if}
{/if}

{#if canShowDropIntention && isDropIntentionRequired}
	<Form.Field name="risk-perception" class={styles.container()}>
		<FieldHeader
			title="Percepción de Riesgo"
			description="¿Qué tan cerca te sentiste de reprobar este ramo a lo largo del semestre?"
			htmlFor="risk-perception"
		/>
		<IconToggleField
			items={[
				{
					value: 'no-risk',
					label: 'Seguro',
					desc: 'Sin riesgo',
					tooltip: 'El ramo estuvo bajo control de principio a fin. Nunca representó una amenaza de reprobación',
					iconOn: MingcuteShieldShapeFill,
					iconOff: MingcuteShieldShapeLine
				},
				{
					value: 'low-risk',
					label: 'Manejable',
					desc: 'Riesgo bajo',
					tooltip: 'Requirió atención regular. Hubo dudas menores, pero la situación nunca se escapó de las manos',
					iconOn: MingcuteHeartFill,
					iconOff: MingcuteHeartLine
				},
				{
					value: 'high-risk',
					label: 'Peligroso',
					desc: 'Riesgo alto',
					tooltip: 'Periodos de alta presión y notas en la cuerda floja. Estuve muy cerca de perder el ramo',
					iconOn: MingcuteHeartbeat2Fill,
					iconOff: MingcuteHeartbeat2Line
				},
				{
					value: 'extreme-risk',
					label: 'Crítico',
					desc: 'Al límite',
					tooltip: 'Peligro real de reprobar hasta el último día. Se sintió como un escenario casi imposible de salvar',
					iconOn: MingcuteHeartCrackFill,
					iconOff: MingcuteHeartCrackLine
				}
			]}
			/>
		<Form.Message />
	</Form.Field>
{/if}

{#if canShowCourseGrade}
	<Form.Field name="final-grade" class={styles.container()}>
		<FieldHeader
			title="Nota Final"
			description="¿En qué rango se encuentra la nota con la que cerraste? Opcional y anónima, para motivo de estadísticas agregadas."
			htmlFor="final-grade"
			optional
		/>
		<IconToggleField nullable required={false} items={filteredGradeItems()} />
		<Form.Message />
	</Form.Field>
{/if}
