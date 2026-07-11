<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { Data } from '$lib/data/data.svelte';
	import MaterialSymbolsTimer1 from '$lib/icons/MaterialSymbolsTimer1.svelte';
	import MaterialSymbolsTimer2 from '$lib/icons/MaterialSymbolsTimer2.svelte';
	import MaterialSymbolsTimer3 from '$lib/icons/MaterialSymbolsTimer3.svelte';
	import MingcuteBrainFill from '$lib/icons/MingcuteBrainFill.svelte';
	import MingcuteBrainLine from '$lib/icons/MingcuteBrainLine.svelte';
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
	import MingcuteHome4Fill from '$lib/icons/MingcuteHome4Fill.svelte';
	import MingcuteHome4Line from '$lib/icons/MingcuteHome4Line.svelte';
	import MingcuteMinusCircleFill from '$lib/icons/MingcuteMinusCircleFill.svelte';
	import MingcuteMinusCircleLine from '$lib/icons/MingcuteMinusCircleLine.svelte';
	import MingcuteNotebookFill from '$lib/icons/MingcuteNotebookFill.svelte';
	import MingcuteNotebookLine from '$lib/icons/MingcuteNotebookLine.svelte';
	import MingcuteRulerFill from '$lib/icons/MingcuteRulerFill.svelte';
	import MingcuteRulerLine from '$lib/icons/MingcuteRulerLine.svelte';
	import MingcuteThumbDown2Fill from '$lib/icons/MingcuteThumbDown2Fill.svelte';
	import MingcuteThumbDown2Line from '$lib/icons/MingcuteThumbDown2Line.svelte';
	import MingcuteThumbUp2Fill from '$lib/icons/MingcuteThumbUp2Fill.svelte';
	import MingcuteThumbUp2Line from '$lib/icons/MingcuteThumbUp2Line.svelte';
	import { slide } from 'svelte/transition';
	import FieldContainer from '../forms/FieldContainer.svelte';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();

	/**
	 * Reactive evaluation strategies for sequential step resolution.
	 * Ensures clean rendering boundaries for multi-branch wizard progression.
	 */
	const isTemporalContextSelected = $derived(!!form.values['temporal-context']);
	const previousAttempts = $derived(form.values['previous-attempts']);
	const isAttemptsSelected = $derived(!!previousAttempts);

	const isDroppedBeforeRequired = $derived(isAttemptsSelected && previousAttempts !== '1');
	const isDroppedBeforeSelected = $derived(!!form.values['dropped-before']);

	const canShowFinalStatus = $derived(
		isAttemptsSelected && (!isDroppedBeforeRequired || isDroppedBeforeSelected)
	);

	const finalStatus = $derived(form.values['final-status']);
	const isFinalStatusSelected = $derived(!!finalStatus);

	const isDropIntentionRequired = $derived(isFinalStatusSelected && finalStatus !== 'drop');
	const isDropIntentionSelected = $derived(!!form.values['drop-intention']);

	const canShowUsedGlobal = $derived(
		isFinalStatusSelected && (!isDropIntentionRequired || isDropIntentionSelected)
	);

	const usedGlobal = $derived(form.values['used-global']);
	const isUsedGlobalSelected = $derived(!!usedGlobal);

	const isGlobalReasonRequired = $derived(isUsedGlobalSelected && usedGlobal !== 'inexistent');
	const isGlobalReasonSelected = $derived(
		!!form.values['global-reason-yes'] || !!form.values['global-reason-no']
	);

	const canShowCourseFrustration = $derived(
		isUsedGlobalSelected && (!isGlobalReasonRequired || isGlobalReasonSelected)
	);

	const isCourseFrustrationSelected = $derived(!!form.values['course-effort-balance']);
</script>

<FieldContainer {styles} id="temporal-context">
	<FieldHeader
		title="Recuerdo del Ramo"
		description="¿Hace cuántos semestres terminaste de cursar este ramo?"
		htmlFor="temporal-context"
		{styles}
	/>
	<IconToggleField
		id="temporal-context"
		{form}
		items={[
			{
				value: '0',
				label: 'El semestre pasado',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '1',
				label: 'Hace 2 semestres',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '2',
				label: 'Hace 3 o 4 semestres',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			},
			{
				value: '3',
				label: 'Hace mucho',
				iconOn: MingcuteDiamondSquareFill,
				iconOff: MingcuteDiamondSquareLine
			}
		]}
	/>
</FieldContainer>

{#if isTemporalContextSelected}
	<FieldContainer {styles} id="previous-attempts">
		<FieldHeader
			title="Intentos"
			description="¿Cuántas veces inscribiste el ramo antes de este resultado? (Incluye semestres que hayas botado/RAV)"
			htmlFor="previous-attempts"
			{styles}
		/>
		<IconToggleField
			id="previous-attempts"
			{form}
			items={[
				{
					value: '1',
					label: '1ra vez',
					iconOn: MaterialSymbolsTimer1,
					iconOff: MaterialSymbolsTimer1
				},
				{
					value: '2-rav',
					label: '2da vez',
					iconOn: MaterialSymbolsTimer2,
					iconOff: MaterialSymbolsTimer2
				},
				{
					value: '3+',
					label: '3ra vez o más',
					iconOn: MaterialSymbolsTimer3,
					iconOff: MaterialSymbolsTimer3
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if isDroppedBeforeRequired}
	<FieldContainer {styles} id="dropped-before">
		<FieldHeader
			title="Botado Previamente"
			description="¿Habías anulado o desinscrito esta asignatura en semestres anteriores? (Botón de pánico, congelar)"
			htmlFor="dropped-before"
			{styles}
		/>
		<IconToggleField
			id="dropped-before"
			{form}
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
	</FieldContainer>
{/if}

{#if canShowFinalStatus}
	<FieldContainer {styles} id="final-status">
		<FieldHeader
			title="Situación Final"
			description="¿Cuál fue tu último resultado en el ramo?"
			htmlFor="final-status"
			{styles}
		/>
		<IconToggleField
			id="final-status"
			{form}
			items={[
				{
					value: 'pass',
					label: 'Aprobado',
					desc: 'Pasé',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'fail-grade',
					label: 'Reprobado',
					desc: 'Por nota',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'fail-inassistance',
					label: 'Reprobado',
					desc: 'Por inasistencia',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'drop',
					label: 'Retirado',
					desc: 'Botado/RAV',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if isDropIntentionRequired}
	<FieldContainer {styles} id="drop-intention">
		<FieldHeader
			title="Intención de Botar"
			description="¿Con qué frecuencia o seriedad pensaste en abandonar o desinscribir el ramo?"
			htmlFor="drop-intention"
			{styles}
		/>
		<IconToggleField
			id="drop-intention"
			{form}
			items={[
				{
					value: 'never',
					label: 'Nunca',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				},
				{
					value: 'rarely',
					label: 'Ocasionalmente',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'frequently',
					label: 'Frecuentemente',
					iconOn: MingcuteBrainFill,
					iconOff: MingcuteBrainLine
				},
				{
					value: 'critical',
					label: 'Casi lo hago',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if canShowUsedGlobal}
	<FieldContainer {styles} id="used-global">
		<FieldHeader
			title="Evaluación Global/Recuperativa"
			description="¿Rendiste el examen global o recuperativo?"
			htmlFor="used-global"
			{styles}
		/>
		<IconToggleField
			id="used-global"
			{form}
			items={[
				{
					value: 'yes',
					label: 'Sí',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'no',
					label: 'No',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'inexistent',
					label: 'No aplica',
					desc: 'El ramo no contempla',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if isGlobalReasonRequired}
	{#if usedGlobal === 'yes'}
		<FieldContainer {styles} id="global-reason-yes">
			<FieldHeader
				title="Motivo de rendición"
				description="¿Cuál era tu objetivo principal al dar el examen?"
				htmlFor="global-reason-yes"
				{styles}
			/>
			<IconToggleField
				id="global-reason-yes"
				{form}
				items={[
					{
						value: 'yes-pass',
						label: 'Para aprobar',
						desc: 'En riesgo, necesario',
						iconOn: MingcuteCheckCircleFill,
						iconOff: MingcuteCheckCircleLine
					},
					{
						value: 'yes-grade',
						label: 'Para subir nota',
						desc: 'Mejorar promedio',
						iconOn: MingcuteCheckCircleFill,
						iconOff: MingcuteCheckCircleLine
					},
					{
						value: 'yes-recover',
						label: 'Para recuperar',
						desc: 'Inasistencia previa',
						iconOn: MingcuteCalendarMonthFill,
						iconOff: MingcuteCalendarMonthLine
					}
				]}
			/>
		</FieldContainer>
	{:else if usedGlobal === 'no'}
		<FieldContainer {styles} id="global-reason-no">
			<FieldHeader
				title="Motivo de no rendición"
				description="¿Por qué no te presentaste al examen?"
				htmlFor="global-reason-no"
				{styles}
			/>
			<IconToggleField
				id="global-reason-no"
				{form}
				items={[
					{
						value: 'no-exempt',
						label: 'Eximido',
						desc: 'Aprobé antes',
						iconOn: MingcuteMinusCircleFill,
						iconOff: MingcuteMinusCircleLine
					},
					{
						value: 'no-abandon',
						label: 'Inútil',
						desc: 'Nota inalcanzable',
						iconOn: MingcuteMinusCircleFill,
						iconOff: MingcuteMinusCircleLine
					},
					{
						value: 'no-not-possible',
						label: 'Sin derecho',
						desc: 'Sin nota mínima',
						iconOn: MingcuteCloseCircleFill,
						iconOff: MingcuteCloseCircleLine
					}
				]}
			/>
		</FieldContainer>
	{/if}
{/if}

{#if canShowCourseFrustration}
	{@const id = 'course-effort-balance'}
	<FieldContainer {styles} {id}>
		<FieldHeader
			title="Relación Esfuerzo vs. Aprendizaje"
			description="¿Cuánta recompensa sientes que hubo para tu esfuerzo con el nivel de aprendizaje que te dejó el ramo?"
			htmlFor={id}
			{styles}
		/>
		<IconToggleField
			{id}
			{form}
			items={[
				{
					value: 'high',
					label: 'Mucha',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				},
				{
					value: 'neutral',
					label: 'Equilibrada',
					desc: 'Esfuerzo justificado',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'low',
					label: 'Poca',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if isCourseFrustrationSelected}
	<FieldContainer {styles} id="final-grade">
		<FieldHeader
			title="Nota Final"
			description="¿En qué rango se encuentra la nota con la que cerraste? Opcional y anónima, para motivo de estadísticas agregadas."
			htmlFor="final-grade"
			optional
			{styles}
		/>
		<IconToggleField
			id="final-grade"
			nullable
			required={false}
			{form}
			items={[
				{
					value: 'failed-low',
					label: '≤39',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'failed-high',
					label: '40 a 54',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'pass-low',
					label: '55 a 65',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'pass-medium',
					label: '66 a 79',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'pass-high',
					label: '≥80',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				}
			]}
		/>
	</FieldContainer>
{/if}
