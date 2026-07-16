<script module>
	

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
</script>

<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MaterialSymbolsTimer1 from '$lib/icons/MaterialSymbolsTimer1.svelte';
	import MaterialSymbolsTimer2 from '$lib/icons/MaterialSymbolsTimer2.svelte';
	import MaterialSymbolsTimer3 from '$lib/icons/MaterialSymbolsTimer3.svelte';
	import MingcuteCheckCircleFill from '$lib/icons/MingcuteCheckCircleFill.svelte';
	import MingcuteCheckCircleLine from '$lib/icons/MingcuteCheckCircleLine.svelte';
	import MingcuteCloseCircleFill from '$lib/icons/MingcuteCloseCircleFill.svelte';
	import MingcuteCloseCircleLine from '$lib/icons/MingcuteCloseCircleLine.svelte';
	import MingcuteDiamondSquareFill from '$lib/icons/MingcuteDiamondSquareFill.svelte';
	import MingcuteDiamondSquareLine from '$lib/icons/MingcuteDiamondSquareLine.svelte';
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
	import MingcuteSkullFill from '$lib/icons/MingcuteSkullFill.svelte';
	import MingcuteSkullLine from '$lib/icons/MingcuteSkullLine.svelte';
	import MingcuteAngelFill from '$lib/icons/MingcuteAngelFill.svelte';
	import MingcuteAngelLine from '$lib/icons/MingcuteAngelLine.svelte';

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
	
	// Determine if the user has reached the final status question
	const canShowFinalStatus = $derived(
		isAttemptsSelected && (!isDroppedBeforeRequired || isDroppedBeforeSelected)
	);

	const finalStatus = $derived(form.values['final-status']);
	const isFinalStatusSelected = $derived(isFieldAnswered(form, 'final-status'));

	const isSurvivabilityRequired = $derived(isFinalStatusSelected);
	const isSurvivabilitySelected = $derived(isFieldAnswered(form, 'survivability-perception'));

	/**
	 * Dynamically evaluates and filters available grade buckets based on final course outcome.
	 */
	const filteredGradeItems = $derived.by(() => {
		const allOptions = Object.values(GRADE_OPTIONS);

		if (finalStatus === 'pass') {
			return allOptions.filter((option) => option.at >= 55).sort((a, b) => a.at - b.at);
		}

		if (finalStatus === 'fail') {
			return allOptions.filter((option) => option.at < 55).sort((a, b) => a.at - b.at);
		}

		return [];
	});

	// Dropping or freezing states resolve directly without additional branching
	const isBranchingPathResolved = $derived(isFinalStatusSelected);

	// Direct progression to subsequent questions once the main status is selected
	const canShowDropIntention = $derived(
		isFinalStatusSelected && 
		isBranchingPathResolved && 
		isSurvivabilitySelected
	);

	// Risk perception is omitted for non-completion/dropped academic scenarios
	const isDropIntentionRequired = $derived(
		isFinalStatusSelected && finalStatus !== 'dropped' && finalStatus !== 'frozen-other'
	);
	const isDropIntentionSelected = $derived(isFieldAnswered(form, 'risk-perception'));
	
	const canShowCourseGrade = $derived(
		(filteredGradeItems?.length ?? 0) > 0 &&
		canShowDropIntention &&
		(!isDropIntentionRequired || isDropIntentionSelected)
	);
</script>

<Form.Field name="temporal-context" class={styles.container()}>
	<FieldHeader
		title="Recuerdo del Ramo"
		description="¿Hace cuántos semestres/periodos terminaste de cursar este ramo?"
		htmlFor="temporal-context"
	/>
	<IconToggleField
		items={[
			{
				value: '0',
				label: '1 periodo',
				desc: 'Recién',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '1',
				label: '2 periodos',
				desc: 'Hace poco',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '2',
				label: '3 a 4 per.',
				desc: 'Hace rato',
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
			description="¿Aprobaste el ramo, después de todo?"
			htmlFor="final-status"
		/>
		<IconToggleField
			items={[
				{
					value: 'pass',
					label: 'Sí',
					desc: 'Pasé',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'fail',
					label: 'No',
					desc: 'Repetí',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'dropped',
					label: 'Retirado',
					desc: 'RAV/anulado',
					iconOn: MingcuteDeleteFill,
					iconOff: MingcuteDeleteLine
				},
				{
					value: 'frozen-other',
					label: 'Otro',
					desc: 'Fuerza mayor',
					iconOn: MingcuteSnowFill,
					iconOff: MingcuteSnowLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isFinalStatusSelected}
	<Form.Field name="survivability-perception" class={styles.container()}>
		<FieldHeader
			title="Sobrevivencia del Ramo"
			description="¿Qué tan probable de pasar es este ramo para un estudiante promedio?"
			htmlFor="survivability-perception"
		/>
		<IconToggleField
			items={[
				{
					value: '0-19',
					label: '0-19%',
					desc: 'Muy difícil',
					tooltip: 'Excepcionalmente difícil; la gran mayoría reprueba y aprobar es un logro',
					iconOn: MingcuteSkullFill,
					iconOff: MingcuteSkullLine
				},
				{
					value: '20-39',
					label: '20-39%',
					desc: 'Difícil',
					tooltip: 'Alta probabilidad de reprobación; exige dedicarle mucho tiempo para salvarse',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				},
				{
					value: '40-59',
					label: '40-59%',
					desc: 'Moderado',
					tooltip: 'Requiere esfuerzo constante y estudio regular para aprobar sin sorpresas',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: '60-79',
					label: '60-79%',
					desc: 'Fácil',
					tooltip: 'Con asistencia a clases y estudio básico es suficiente para aprobar bien',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				},
				{
					value: '80-100',
					label: '80-100%',
					desc: 'Muy fácil',
					tooltip: 'Se pasa casi sin estudiar; la reprobación es casi nula',
					iconOn: MingcuteAngelFill,
					iconOff: MingcuteAngelLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if canShowDropIntention && isDropIntentionRequired}
	<Form.Field name="risk-perception" class={styles.container()}>
		<FieldHeader
			title="Percepción de Riesgo"
			description="A lo largo de tu experiencia personal, ¿qué tan cerca te sentiste tú de reprobar este ramo?"
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
		<IconToggleField nullable required={false} items={filteredGradeItems} />
		<Form.Message />
	</Form.Field>
{/if}
