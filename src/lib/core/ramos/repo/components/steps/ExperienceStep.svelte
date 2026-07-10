<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MingcuteTimeFill from '$lib/helpers/MingcuteTimeFill.svelte';
	import MaterialSymbolsTimer1 from '$lib/icons/MaterialSymbolsTimer1.svelte';
	import MaterialSymbolsTimer2 from '$lib/icons/MaterialSymbolsTimer2.svelte';
	import MaterialSymbolsTimer3 from '$lib/icons/MaterialSymbolsTimer3.svelte';
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
	import MingcuteTimeLine from '$lib/icons/MingcuteTimeLine.svelte';
	import FieldContainer from '../forms/FieldContainer.svelte';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

<FieldContainer {styles} id="temporal-context">
	<FieldHeader
		title="Contexto Temporal"
		description="¿Hace cuánto lo cursaste, aproximadamente?"
		htmlFor="temporal-context"
		{styles}
	/>
	<IconToggleField
		id="temporal-context"
		{form}
		items={[
			{
				value: 'recent',
				label: 'Reciente',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			},
			{
				value: 'one-year',
				label: '~1 año',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			},
			{
				value: 'two-years',
				label: '~2 años',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			},
			{
				value: 'older',
				label: '~3+ años',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			}
		]}
	/>
</FieldContainer>

{#if form.values['temporal-context']}
	<FieldContainer {styles} id="final-status">
		<FieldHeader
			title="Situación Final"
			description="¿Cuál fue tu resultado en el ramo al cierre de ese semestre?"
			htmlFor="final-status"
			{styles}
		/>
		<IconToggleField
			id="final-status"
			{form}
			items={[
				{
					value: 'pass',
					label: 'Pasé',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'fail',
					label: 'Repetí',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['final-status']}
	<FieldContainer {styles} id="used-global">
		<FieldHeader
			title="Evaluación Global/Recuperativa"
			description="¿Llegaste a usar el examen global/recuperativo?"
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
					label: 'No había',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['used-global']}
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
					label: '3ra+ vez',
					iconOn: MaterialSymbolsTimer3,
					iconOff: MaterialSymbolsTimer3
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['previous-attempts'] !== '1' && form.values['previous-attempts']}
	<FieldContainer {styles} id="dropped-before">
		<FieldHeader
			title="Historial de Retiro"
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
				{
					value: 'yes',
					label: 'Sí',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['previous-attempts']}
	<FieldContainer {styles} id="dropout-intention">
		<FieldHeader
			title="Intención de Abandono"
			description={form.values['dropped-before'] === 'yes'
				? 'Durante el último semestre cursado, ¿llegaste a pensar seriamente en botar el ramo?'
				: '¿En algún momento del semestre pensaste seriamente en botar el ramo?'}
			htmlFor="dropout-intention"
			{styles}
		/>
		<IconToggleField
			id="dropout-intention"
			{form}
			items={[
				{
					value: 'never',
					label: 'Nunca',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				},
				{
					value: 'sometimes',
					label: 'A Veces',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'often',
					label: 'Demasiado',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['dropout-intention'] !== 'never' && form.values['dropout-intention']}
	<FieldContainer {styles} id="dropout-cause">
		<FieldHeader
			title="Causa de Abandono"
			description="¿Cuál fue el motivo principal de querer botar el ramo?"
			htmlFor="dropout-cause"
			{styles}
		/>
		<IconToggleField
			id="dropout-cause"
			{form}
			items={[
				{
					value: 'stress-workload',
					label: 'Estrés',
					desc: 'Carga',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteBrainLine
				},
				{
					value: 'difficulty',
					label: 'Dificultad',
					iconOn: MingcuteNotebookFill,
					iconOff: MingcuteNotebookLine
				},
				{
					value: 'professor',
					label: 'Docencia',
					iconOn: MingcuteRulerFill,
					iconOff: MingcuteRulerLine
				},
				{
					value: 'schedule-time',
					label: 'Horario',
					desc: 'Tiempo',
					iconOn: MingcuteCalendarMonthFill,
					iconOff: MingcuteCalendarMonthLine
				},
				{
					value: 'personal-reasons',
					label: 'Personal',
					desc: 'Otro motivo',
					iconOn: MingcuteHome4Fill,
					iconOff: MingcuteHome4Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['dropout-intention']}
	<FieldContainer {styles} id="reward-ratio">
		<FieldHeader
			title="Esfuerzo y Recompensa"
			description="¿Qué tanta recompensa (notas/aprendizaje) sientes que obtienes en relación al esfuerzo que inviertes?"
			htmlFor="reward-ratio"
			{styles}
		/>
		<IconToggleField
			id="reward-ratio"
			{form}
			items={[
				{
					value: 'bad',
					label: 'Poco',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				},
				{
					value: 'neutral',
					label: 'Justo',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'good',
					label: 'Mucho',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['reward-ratio']}
	<FieldContainer {styles} id="final-grade">
		<FieldHeader
			title="Nota Final"
			description="¿Con qué nota cerraste? Pregunta opcional/anulable, 100% anónima, para motivo de estadísticas agregadas."
			htmlFor="final-grade"
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
					label: '0-39',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'failed-high',
					label: '40-54',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'pass-low',
					label: '55-69',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'pass-medium',
					label: '70-84',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'pass-high',
					label: '85-100',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				}
			]}
		/>
	</FieldContainer>
{/if}
