<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MingcuteHeartbeatFill from '$lib/icons/MingcuteHeartbeatFill.svelte';
	import MingcuteHeartbeatLine from '$lib/icons/MingcuteHeartbeatLine.svelte';
	import MingcuteMenuFill from '$lib/icons/MingcuteMenuFill.svelte';
	import MingcuteMenuLine from '$lib/icons/MingcuteMenuLine.svelte';
	import MingcuteWaveFill from '$lib/icons/MingcuteWaveFill.svelte';
	import MingcuteWaveLine from '$lib/icons/MingcuteWaveLine.svelte';
	import { Form } from '$lib/components/ui/form';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';
	import MingcuteUserFollow2Fill from '$lib/icons/MingcuteUserFollow2Fill.svelte';
	import MingcuteUserFollow2Line from '$lib/icons/MingcuteUserFollow2Line.svelte';
	import MingcuteEye2Fill from '$lib/icons/MingcuteEye2Fill.svelte';
	import MingcuteEye2Line from '$lib/icons/MingcuteEye2Line.svelte';
	import MingcuteUserQuestionFill from '$lib/icons/MingcuteUserQuestionFill.svelte';
	import MingcuteUserQuestionLine from '$lib/icons/MingcuteUserQuestionLine.svelte';
	import MingcuteMinusCircleFill from '$lib/icons/MingcuteMinusCircleFill.svelte';
	import MingcuteMinusCircleLine from '$lib/icons/MingcuteMinusCircleLine.svelte';
	import MingcuteAngelFill from '$lib/icons/MingcuteAngelFill.svelte';
	import MingcuteAngelLine from '$lib/icons/MingcuteAngelLine.svelte';
	import MingcuteSkullFill from '$lib/icons/MingcuteSkullFill.svelte';
	import MingcuteSkullLine from '$lib/icons/MingcuteSkullLine.svelte';
	import MingcuteForbidCircleFill from '$lib/icons/MingcuteForbidCircleFill.svelte';
	import MingcuteForbidCircleLine from '$lib/icons/MingcuteForbidCircleLine.svelte';
	import MingcuteBattery4Fill from '$lib/icons/MingcuteBattery4Fill.svelte';
	import MingcuteBattery4Line from '$lib/icons/MingcuteBattery4Line.svelte';
	import MingcuteBattery3Fill from '$lib/icons/MingcuteBattery3Fill.svelte';
	import MingcuteBattery3Line from '$lib/icons/MingcuteBattery3Line.svelte';
	import MingcuteBattery2Fill from '$lib/icons/MingcuteBattery2Fill.svelte';
	import MingcuteBattery2Line from '$lib/icons/MingcuteBattery2Line.svelte';
	import MingcuteBattery1Fill from '$lib/icons/MingcuteBattery1Fill.svelte';
	import MingcuteBattery1Line from '$lib/icons/MingcuteBattery1Line.svelte';
	import MingcuteEyeCloseFill from '$lib/icons/MingcuteEyeCloseFill.svelte';
	import MingcuteEyeCloseLine from '$lib/icons/MingcuteEyeCloseLine.svelte';
	import MingcuteUserVisibleFill from '$lib/icons/MingcuteUserVisibleFill.svelte';
	import MingcuteUserVisibleLine from '$lib/icons/MingcuteUserVisibleLine.svelte';
	import MingcuteEyeglassFill from '$lib/icons/MingcuteEyeglassFill.svelte';
	import MingcuteEyeglassLine from '$lib/icons/MingcuteEyeglassLine.svelte';
	import MingcuteTowerCraneFill from '$lib/icons/MingcuteTowerCraneFill.svelte';
	import MingcuteTowerCraneLine from '$lib/icons/MingcuteTowerCraneLine.svelte';
	import MingcuteComputerFill from '$lib/icons/MingcuteComputerFill.svelte';
	import MingcuteComputerLine from '$lib/icons/MingcuteComputerLine.svelte';
	import MingcuteToolFill from '$lib/icons/MingcuteToolFill.svelte';
	import MingcuteToolLine from '$lib/icons/MingcuteToolLine.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

{#if form}
	<Form.Field name="real-work-hours" class={styles.container()}>
		<FieldHeader
			title="Horas de estudio real"
			description="En una semana típica del ramo ¿cuántas horas a la semana le dedicaste fuera de clases (estudiar, tareas, proyectos)?"
			htmlFor="real-work-hours"
		/>
		<IconToggleField
			items={[
				{
					value: 'light',
					label: '0-3 hrs',
					desc: 'Ligero',
					tooltip: 'Repasos cortos',
					iconOn: MingcuteBattery4Fill,
					iconOff: MingcuteBattery4Line
				},
				{
					value: 'moderate',
					label: '4-7 hrs',
					desc: 'Estándar',
					tooltip: 'Un par de tardes',
					iconOn: MingcuteBattery3Fill,
					iconOff: MingcuteBattery3Line
				},
				{
					value: 'demanding',
					label: '8-12 hrs',
					desc: 'Exigente',
					tooltip: 'Casi todas las tardes',
					iconOn: MingcuteBattery2Fill,
					iconOff: MingcuteBattery2Line
				},
				{
					value: 'intense',
					label: '13+ hrs',
					desc: 'Saturado',
					tooltip: 'Prioridad absoluta',
					iconOn: MingcuteBattery1Fill,
					iconOff: MingcuteBattery1Line
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['real-work-hours']}
	<Form.Field name="effort-distribution" class={styles.container()}>
		<FieldHeader
			title="Distribución de Esfuerzo"
			description="¿Es un trabajo constante semana a semana, o se concentra todo a final de mes para las pruebas?"
			htmlFor="effort-distribution"
		/>
		<IconToggleField
			items={[
				{
					value: 'constant',
					label: 'Constante',
					desc: 'Ritmo diario',
					tooltip: 'Algo que hacer casi todas las semanas: tareas, investigaciones...',
					iconOn: MingcuteMenuFill,
					iconOff: MingcuteMenuLine
				},
				{
					value: 'intermitent',
					label: 'Cíclico',
					desc: 'Alternante',
					tooltip: 'Períodos de trabajo continuo y descanso: laboratorios, proyectos...',
					iconOn: MingcuteWaveFill,
					iconOff: MingcuteWaveLine
				},
				{
					value: 'concentrated',
					label: 'Concentrado',
					desc: 'Peaks intensos',
					tooltip: 'Acumulado en pocas fechas: pocas evaluaciones, solo certamenes o controles...',
					iconOn: MingcuteHeartbeatFill,
					iconOff: MingcuteHeartbeatLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['effort-distribution']}
	<Form.Field name="assistance-exigence" class={styles.container()}>
		<FieldHeader
			title="Exigencia de Asistencia"
			description="¿Qué tan estricta o necesaria es la presencialidad en el ramo?"
			htmlFor="assistance-exigence"
		/>
		<IconToggleField
			items={[
				{
					value: 'flexible',
					label: 'Opcional',
					desc: 'Puntual',
					tooltip: 'Para laboratorios, presentaciones',
					iconOn: MingcuteUserQuestionFill,
					iconOff: MingcuteUserQuestionLine
				},
				{
					value: 'moderate',
					label: 'Reglamento',
					desc: 'Exigido',
					tooltip: 'Porcentaje mínimo de asistencia',
					iconOn: MingcuteUserFollow2Fill,
					iconOff: MingcuteUserFollow2Line
				},
				{
					value: 'strict',
					label: 'Crucial',
					desc: 'Necesario',
					tooltip: 'Cada clase aporta o evalúa',
					iconOn: MingcuteEye2Fill,
					iconOff: MingcuteEye2Line
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['assistance-exigence']}
	<Form.Field name="relief-mechanics" class={styles.container()}>
		<FieldHeader
			title="Mecánicas de Alivio"
			description="¿Cuánta flexibilidad o segundas oportunidades ofrece el ramo si te va mal?"
			htmlFor="relief-mechanics"
		/>
		<IconToggleField
			items={[
				{
					value: 'high',
					label: 'Alta',
					desc: 'Varias vías',
					tooltip: 'Actividades adicionales, preguntas extra, bonuses, etc...',
					iconOn: MingcuteAngelFill,
					iconOff: MingcuteAngelLine
				},
				{
					value: 'moderate',
					label: 'Moderada',
					desc: 'Lo necesario',
					tooltip: 'Evaluación global o instancia especial única',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'none',
					label: 'Nula',
					desc: 'Sin piedad',
					tooltip: 'Ausencia total de recuperación',
					iconOn: MingcuteSkullFill,
					iconOff: MingcuteSkullLine
				},
				{
					value: 'unknown',
					label: 'No aplica',
					desc: 'Depende',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['relief-mechanics']}
	<Form.Field name="predictability" class={styles.container()}>
		<FieldHeader
			title="Predictabilidad y Transparencia"
			description="¿Las pautas de evaluación son fijas y conocidas, o cambian y se definen sobre la marcha?"
			htmlFor="predictability"
		/>
		<IconToggleField
			items={[
				{
					value: 'transparent',
					label: 'Fijas',
					desc: 'Explícitas y definitivas',
					iconOn: MingcuteEye2Fill,
					iconOff: MingcuteEye2Line
				},
				{
					value: 'predictable',
					label: 'Estables',
					desc: 'Claras, ajustes menores',
					iconOn: MingcuteUserVisibleFill,
					iconOff: MingcuteUserVisibleLine
				},
				{
					value: 'improvised',
					label: 'Variables',
					desc: 'Reglas dinámicas',
					iconOn: MingcuteEyeglassFill,
					iconOff: MingcuteEyeglassLine
				},
				{
					value: 'unpredictable',
					label: 'Inciertas',
					desc: 'Se definen al evaluar',
					tooltip: 'Sin pautas previas',
					iconOn: MingcuteEyeCloseFill,
					iconOff: MingcuteEyeCloseLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['predictability']}
	<Form.Field name="tool-dependency" class={styles.container()}>
		<FieldHeader
			title="Dependencia de Recursos"
			description="¿El ramo se puede cursar con materiales comunes o exige obligatoriamente insumos o herramientas específicas?"
			htmlFor="tool-dependency"
		/>
		<IconToggleField
			items={[
				{
					value: 'none',
					label: 'Nula',
					desc: 'Material común',
					tooltip:
						'Solo requiere lecturas, apuntes o útiles de escritorio. Se puede estudiar en cualquier lugar.',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'low',
					label: 'Baja',
					desc: 'PC e Internet básico',
					tooltip:
						'Requiere PC estándar y conexión web para navegación, Office, herramientas en la nube o videollamadas.',
					iconOn: MingcuteComputerFill,
					iconOff: MingcuteComputerLine
				},
				{
					value: 'medium',
					label: 'Media',
					desc: 'Software o insumos',
					tooltip:
						'Exige instalar programas pesados, usar licencias universitarias o adquirir herramientas e insumos propios de la profesión.',
					iconOn: MingcuteToolFill,
					iconOff: MingcuteToolLine
				},
				{
					value: 'high',
					label: 'Alta',
					desc: 'Equipamiento o laboratorios',
					tooltip:
						'Depende del uso presencial de equipamiento pesado, laboratorios de ciencias, talleres mecánicos, instrumental médico avanzado o servidores físicos.',
					iconOn: MingcuteTowerCraneFill,
					iconOff: MingcuteTowerCraneLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}
