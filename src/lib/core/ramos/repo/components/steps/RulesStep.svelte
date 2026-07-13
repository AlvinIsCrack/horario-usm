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
	import MingcutePaper2Fill from '$lib/icons/MingcutePaper2Fill.svelte';
	import MingcutePaper2Line from '$lib/icons/MingcutePaper2Line.svelte';
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
	<Form.Field name="course-dynamics" class={styles.container()}>
		<FieldHeader
			title="Dinámica de la Carga"
			description="¿Cómo se distribuye la demanda (trabajos, evaluaciones, entregas) a lo largo del semestre?"
			htmlFor="course-dynamics"
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
					value: 'intermitent',
					label: 'Por Hitos',
						desc: 'Carga períodica',
					tooltip:
						'Períodos alternados de alta carga y descanso. Típico de ramos con entregas por fases, laboratorios o proyectos medianos',
					iconOn: MingcuteRefresh4Fill,
					iconOff: MingcuteRefresh4Line
				},
				{
					value: 'concentrated',
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

{#if form.values['course-dynamics']}
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
					desc: 'Asistencia libre',
					tooltip:
						'Las clases quedan grabadas o no se controla el ingreso. Puedes pasar el ramo estudiando 100% por tu cuenta',
					iconOn: MingcuteUserQuestionFill,
					iconOff: MingcuteUserQuestionLine
				},
				{
					value: 'moderate',
					label: 'Reglamento',
					desc: 'Porcentaje min.',
					tooltip:
						'Se exige asistencia para tener derecho a rendir evaluaciones o aprobar. Se pasa lista estrictamente',
					iconOn: MingcuteUserFollow2Fill,
					iconOff: MingcuteUserFollow2Line
				},
				{
					value: 'strict',
					label: 'Necesaria',
					desc: 'Obligatoria/clave',
					tooltip:
						'Inasistencia crítica. Cada clase incluye talleres evaluados, laboratorios presenciales o discusión activa que no se pueden recuperar',
					iconOn: MingcuteUserLockFill,
					iconOff: MingcuteUserLockLine
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
					label: 'Muy flexible',
					desc: 'Varias vías',
					tooltip:
						'El ramo ofrece múltiples opciones para recuperarse: se borra la peor nota, hay certámenes recuperativos globales, tareas de bonus o segundas oportunidades directas',
					iconOn: MingcuteEmojiFill,
					iconOff: MingcuteEmojiLine
				},
				{
					value: 'moderate',
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
					value: 'unknown',
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

{#if form.values['relief-mechanics']}
	<Form.Field name="predictability" class={styles.container()}>
		<FieldHeader
			title="Reglas de Evaluación"
			description="Al rendir una prueba o entregar un trabajo, ¿sabías con exactitud qué te iban a evaluar y cómo se calcularía tu nota?"
			htmlFor="predictability"
		/>
		<IconToggleField
			items={[
				{
					value: 'transparent',
					label: 'Predecible',
					desc: 'Reglas\nfijas',
					tooltip:
						'Desde antes de dar la evaluación sabes exactamente qué puntaje tiene cada ítem y qué espera el corrector. La nota final calza perfecto con tu desempeño',
					iconOn: MingcuteEye2Fill,
					iconOff: MingcuteEye2Line
				},
				{
					value: 'flexible',
					label: 'Flexible',
					desc: 'Reglas\nadaptables',
					tooltip:
						'Las pautas básicas existen, pero los criterios específicos o el puntaje se modifican durante el semestre (por ejemplo, después de que a todo el curso le fue mal en una pregunta)',
					iconOn: MingcuteEyeglassFill,
					iconOff: MingcuteEyeglassLine
				},
				{
					value: 'unpredictable',
					label: 'Impredecible',
					desc: 'Reglas\nimprovisadas',
					tooltip:
						'Imposible saber qué van a priorizar al corregir. La nota depende del criterio del momento y los reclamos se resuelven bajo reglas que no estaban escritas en ninguna parte',
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
