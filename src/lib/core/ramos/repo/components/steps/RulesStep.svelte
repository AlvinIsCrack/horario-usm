<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MingcuteHeartbeatFill from '$lib/icons/MingcuteHeartbeatFill.svelte';
	import MingcuteHeartbeatLine from '$lib/icons/MingcuteHeartbeatLine.svelte';
	import { Form } from '$lib/components/ui/form';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';
	import MingcuteUserFollow2Fill from '$lib/icons/MingcuteUserFollow2Fill.svelte';
	import MingcuteUserFollow2Line from '$lib/icons/MingcuteUserFollow2Line.svelte';
	import MingcuteEye2Fill from '$lib/icons/MingcuteEye2Fill.svelte';
	import MingcuteEye2Line from '$lib/icons/MingcuteEye2Line.svelte';
	import MingcuteUserQuestionFill from '$lib/icons/MingcuteUserQuestionFill.svelte';
	import MingcuteUserQuestionLine from '$lib/icons/MingcuteUserQuestionLine.svelte';
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
	import MingcuteEyeglassFill from '$lib/icons/MingcuteEyeglassFill.svelte';
	import MingcuteEyeglassLine from '$lib/icons/MingcuteEyeglassLine.svelte';
	import MingcuteComputerFill from '$lib/icons/MingcuteComputerFill.svelte';
	import MingcuteComputerLine from '$lib/icons/MingcuteComputerLine.svelte';
	import MingcuteToolFill from '$lib/icons/MingcuteToolFill.svelte';
	import MingcuteToolLine from '$lib/icons/MingcuteToolLine.svelte';
	import MingcuteTestTubeFill from '$lib/icons/MingcuteTestTubeFill.svelte';
	import MingcuteTestTubeLine from '$lib/icons/MingcuteTestTubeLine.svelte';
	import MingcuteBook2Fill from '$lib/icons/MingcuteBook2Fill.svelte';
	import MingcuteBook2Line from '$lib/icons/MingcuteBook2Line.svelte';
	import MingcuteUserLockFill from '$lib/icons/MingcuteUserLockFill.svelte';
	import MingcuteUserLockLine from '$lib/icons/MingcuteUserLockLine.svelte';
	import MingcuteEmojiFill from '$lib/icons/MingcuteEmojiFill.svelte';
	import MingcuteEmojiLine from '$lib/icons/MingcuteEmojiLine.svelte';
	import MingcuteSadFill from '$lib/icons/MingcuteSadFill.svelte';
	import MingcuteSadLine from '$lib/icons/MingcuteSadLine.svelte';
	import MingcuteLookUpFill from '$lib/icons/MingcuteLookUpFill.svelte';
	import MingcuteLookUpLine from '$lib/icons/MingcuteLookUpLine.svelte';
	import MingcuteRefresh4Fill from '$lib/icons/MingcuteRefresh4Fill.svelte';
	import MingcuteRefresh4Line from '$lib/icons/MingcuteRefresh4Line.svelte';
	import MingcuteArrowRightFill from '$lib/icons/MingcuteArrowRightFill.svelte';
	import MingcuteArrowRightLine from '$lib/icons/MingcuteArrowRightLine.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

{#if form}
	<Form.Field name="real-work-hours" class={styles.container()}>
		<FieldHeader
			title="Horas Dedicadas al Ramo"
			description="En una semana típica del ramo ¿cuántas horas a la semana le dedicaste personalmente fuera de clases (estudiar, tareas, proyectos)?"
			htmlFor="real-work-hours"
		/>
		<IconToggleField
			items={[
				{
					value: 'light',
					label: '0-3 hrs',
					desc: 'Repasos cortos',
					tooltip: 'Lo llevé al día sin mucho esfuerzo extra',
					iconOn: MingcuteBattery4Fill,
					iconOff: MingcuteBattery4Line
				},
				{
					value: 'moderate',
					label: '4-7 hrs',
					desc: 'Par de tardes',
					tooltip: 'Le dediqué el tiempo justo y necesario',
					iconOn: MingcuteBattery3Fill,
					iconOff: MingcuteBattery3Line
				},
				{
					value: 'demanding',
					label: '8-12 hrs',
					desc: 'Varias tardes',
					tooltip: 'Tuve que hacer varios sacrificios',
					iconOn: MingcuteBattery2Fill,
					iconOff: MingcuteBattery2Line
				},
				{
					value: 'intense',
					label: '13+ hrs',
					desc: 'Día y noche',
					tooltip: 'Fue el ramo que se llevó todo mi semestre',
					iconOn: MingcuteBattery1Fill,
					iconOff: MingcuteBattery1Line
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['real-work-hours']}
	<Form.Field name="demand-distribution" class={styles.container()}>
		<FieldHeader
			title="Dinámica de la Carga"
			description="¿Cómo se distribuye la demanda (trabajos, evaluaciones, entregas) a lo largo del semestre?"
			htmlFor="demand-distribution"
		/>
		<IconToggleField
			items={[
				{
					value: 'constant',
					label: 'Sostenido',
					desc: 'Carga constante',
					tooltip:
						'Esfuerzo parejo semana a semana. Tareas, controles o entregas regulares que no te permiten estar desconectado del ramo',
					iconOn: MingcuteArrowRightFill,
					iconOff: MingcuteArrowRightLine
				},
				{
					value: 'intermitent-periodic',
					label: 'Por Hitos',
						desc: 'Carga períodica',
					tooltip:
						'Períodos alternados de alta carga y descanso. Típico de ramos con entregas por fases, laboratorios o proyectos medianos',
					iconOn: MingcuteRefresh4Fill,
					iconOff: MingcuteRefresh4Line
				},
				{
					value: 'concentrated-peaks',
					label: 'Picos Críticos',
					desc: 'Carga puntual',
					tooltip:
						'Carga acumulada exclusivamente en fechas críticas. El semestre es relajado, pero colapsa en la semana de certámenes',
					iconOn: MingcuteHeartbeatFill,
					iconOff: MingcuteHeartbeatLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['demand-distribution']}
	<Form.Field name="assistance-exigence" class={styles.container()}>
		<FieldHeader
			title="Asistencia Necesaria"
			description="¿Qué tan obligatoria es la presencialidad para las clases en sí? Ignora lo ocasional: exposiciones, laboratorios, o similares."
			htmlFor="assistance-exigence"
		/>
		<IconToggleField
			items={[
				{
					value: 'flexible',
					label: 'Libre',
					desc: 'Sin control',
					tooltip:
						'Las clases no tienen control de asistencia ni evaluaciones sorpresa. Puedes pasar el ramo estudiando por tu cuenta.',
					iconOn: MingcuteUserQuestionFill,
					iconOff: MingcuteUserQuestionLine
				},
				{
					value: 'regulated',
					label: 'Por Norma',
					desc: 'Porcentaje mín.',
					tooltip:
						'Se pasa lista estrictamente. Se exige un porcentaje de asistencia por reglamento para tener derecho a aprobar.',
					iconOn: MingcuteUserFollow2Fill,
					iconOff: MingcuteUserFollow2Line
				},
				{
					value: 'critical',
					label: 'Crítica',
					desc: 'Eval. en clases',
					tooltip:
						'Inasistencia penalizada en notas. Cada clase incluye talleres evaluados, controles o discusión activa que no se pueden recuperar.',
					iconOn: MingcuteUserLockFill,
					iconOff: MingcuteUserLockLine
				},
				{
					value: 'not-applicable',
					label: 'No Aplica',
					desc: 'Casos especiales',
					tooltip:
						'Ramos 100% online asíncronos, trabajos de título, prácticas u otros formatos donde el concepto de asistencia a clases no aplica.',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['assistance-exigence']}
	<Form.Field name="relief-mechanics-life-guards" class={styles.container()}>
		<FieldHeader
			title="Mecánicas de Alivio"
			description="¿Cuánta flexibilidad o segundas oportunidades ofrece el ramo si te va mal?"
			htmlFor="relief-mechanics-life-guards"
		/>
		<IconToggleField
			items={[
				{
					value: 'high',
					label: 'Muy flexible',
					desc: 'Varias vías',
					tooltip:
						'El ramo ofrece múltiples opciones para recuperarse: se borra la peor nota, hay certámenes recuperativos globales, tareas de bonus o segundas oportunidades directas',
					iconOn: MingcuteEmojiFill,
					iconOff: MingcuteEmojiLine
				},
				{
					value: 'standard',
					label: 'Estándar',
					desc: 'Opciones básicas',
					tooltip:
						'Existen los mecanismos tradicionales de la universidad (como un certamen recuperativo al final del semestre), pero no hay ayudas extras ni tareas salvavidas en el camino',
					iconOn: MingcuteLookUpFill,
					iconOff: MingcuteLookUpLine
				},
				{
					value: 'none',
					label: 'Cero tolerancia',
					desc: 'Sin otras vías',
					tooltip:
						'Si te va mal en una evaluación, la nota queda congelada. No hay repechajes, trabajos extra ni flexibilidad alguna ante imprevistos',
					iconOn: MingcuteSadFill,
					iconOff: MingcuteSadLine
				},
				{
					value: 'unknown-other',
					label: 'No aplica',
					desc: 'Otro motivo',
					tooltip:
						'Ramos que por su naturaleza no tienen este formato de notas, que dependen del profesor, u otros motivos',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['relief-mechanics-life-guards']}
	<Form.Field name="predictability" class={styles.container()}>
		<FieldHeader
			title="Reglas de Evaluación"
			description="¿Qué tan claras, constantes y respetadas eran las reglas de corrección al momento de evaluar tus pruebas o trabajos?"
			htmlFor="predictability"
		/>
		<IconToggleField
			items={[
				{
					value: 'transparent',
					label: 'Justo',
					desc: 'Sin sorpresas',
					tooltip:
						'Todo se sabe de antes. Conoces el puntaje exacto de cada ítem, qué espera el corrector y la nota calza con tu desempeño',
					iconOn: MingcuteEye2Fill,
					iconOff: MingcuteEye2Line
				},
				{
					value: 'flexible-rules',
					label: 'Inconsistente',
					desc: 'Depende del caso',
					tooltip:
						'Existen pautas básicas, pero los criterios específicos se ajustan o improvisan sobre la marcha (por ejemplo, según cómo le vaya al curso)',
					iconOn: MingcuteEyeglassFill,
					iconOff: MingcuteEyeglassLine
				},
				{
					value: 'unpredictable',
					label: 'Injusto',
					desc: 'Una lotería',
					tooltip:
						'Imposible saber qué van a priorizar al corregir. La nota depende del humor del corrector y los reclamos no tienen reglas escritas',
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
					desc: 'Útiles básicos',
					tooltip:
						'No exige nada especial. Se cursa perfectamente con cuaderno, lápiz y materiales comunes de escritorio',
					iconOn: MingcuteBook2Fill,
					iconOff: MingcuteBook2Line
				},
				{
					value: 'low',
					label: 'Baja',
					desc: 'Acceso digital',
					tooltip:
						'Requiere el uso regular de un computador con internet para correr software básico, simuladores web o redactar informes',
					iconOn: MingcuteComputerFill,
					iconOff: MingcuteComputerLine
				},
				{
					value: 'medium',
					label: 'Media',
					desc: 'Insumos propios',
					tooltip:
						'Exige adquirir materiales adicionales por tu cuenta: componentes electrónicos, herramientas manuales, licencias o libros específicos',
					iconOn: MingcuteToolFill,
					iconOff: MingcuteToolLine
				},
				{
					value: 'high',
					label: 'Alta',
					desc: 'Infraestructura física',
					tooltip:
						'Dependencia crítica de hardware especializado del campus, laboratorios de computación avanzados, talleres mecánicos o reactivos químicos',
					iconOn: MingcuteTestTubeFill,
					iconOff: MingcuteTestTubeLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}
