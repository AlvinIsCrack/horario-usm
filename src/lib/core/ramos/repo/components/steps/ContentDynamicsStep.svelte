<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MingcuteDiamondSquareFill from '$lib/icons/MingcuteDiamondSquareFill.svelte';
	import MingcuteDiamondSquareLine from '$lib/icons/MingcuteDiamondSquareLine.svelte';
	import MingcuteForbidCircleFill from '$lib/icons/MingcuteForbidCircleFill.svelte';
	import MingcuteForbidCircleLine from '$lib/icons/MingcuteForbidCircleLine.svelte';
	import MingcuteGroup2Fill from '$lib/icons/MingcuteGroup2Fill.svelte';
	import MingcuteGroup2Line from '$lib/icons/MingcuteGroup2Line.svelte';
	import MingcuteGroup3Fill from '$lib/icons/MingcuteGroup3Fill.svelte';
	import MingcuteGroup3Line from '$lib/icons/MingcuteGroup3Line.svelte';
	import MingcuteListOrderedFill from '$lib/icons/MingcuteListOrderedFill.svelte';
	import MingcuteListOrderedLine from '$lib/icons/MingcuteListOrderedLine.svelte';
	import MingcuteListSearchFill from '$lib/icons/MingcuteListSearchFill.svelte';
	import MingcuteListSearchLine from '$lib/icons/MingcuteListSearchLine.svelte';
	import MingcuteSearch3Fill from '$lib/icons/MingcuteSearch3Fill.svelte';
	import MingcuteSearch3Line from '$lib/icons/MingcuteSearch3Line.svelte';
	import MingcuteUser3Fill from '$lib/icons/MingcuteUser3Fill.svelte';
	import MingcuteUser3Line from '$lib/icons/MingcuteUser3Line.svelte';
	import { Form } from '$lib/components/ui/form';
	import { isFieldAnswered, areFieldsAnswered } from '$lib/components/ui/form/helpers';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';
	import StraightCurve from '../icons/ConstantCurve.svelte';
	import ExpoCurve from '../icons/ExpoCurve.svelte';
	import LinearCurve from '../icons/LinearCurve.svelte';
	import WallCurve from '../icons/WallCurve.svelte';
	import MingcuteThoughtFill from '$lib/icons/MingcuteThoughtFill.svelte';
	import MingcuteThoughtLine from '$lib/icons/MingcuteThoughtLine.svelte';
	import MaterialSymbolsChatBubble from '$lib/icons/MaterialSymbolsChatBubble.svelte';
	import MaterialSymbolsChatBubbleOutline from '$lib/icons/MaterialSymbolsChatBubbleOutline.svelte';
	import MingcuteStarTopperFill from '$lib/icons/MingcuteStarTopperFill.svelte';
	import MingcuteStarTopperLine from '$lib/icons/MingcuteStarTopperLine.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();

	// Target evaluation identifiers for the multi-dimensional taxonomy segment
	const TAXONOMY_KEYS = [
		'logic-math',
		'memory-concepts',
		'procedure-technique',
		'creative-synthetic',
		'collaborative-interpersonal',
		'motor-execution'
	];

	const isAffinitySelected = $derived(isFieldAnswered(form, 'affinity'));
	const isProfileComplete = $derived(areFieldsAnswered(form, TAXONOMY_KEYS));
	const isAutonomySelected = $derived(isFieldAnswered(form, 'needed-autonomy'));
	const isGroupFactorSelected = $derived(isFieldAnswered(form, 'group-factor'));
</script>

{#if form}
	<Form.Field name="affinity" class={styles.container()}>
		<FieldHeader
			title="Familiaridad Previa"
			description="¿Qué tan cercano, intuitivo o familiar te resultaba el entorno conceptual, técnico o práctico de este ramo antes de cursarlo?"
			htmlFor="affinity"
		/>
		<IconToggleField
			items={[
				{
					value: 'null',
					label: 'Nula',
					desc: 'Todo nuevo',
					tooltip:
						'Entorno completamente ajeno. Sin bases teóricas, nociones previas ni experiencia práctica con la materia.',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'low',
					label: 'Baja',
					desc: 'Conceptual',
					tooltip:
						'Reconoce términos, conceptos básicos o cultura general del tema, pero carece de práctica o capacidad de aplicación.',
					iconOn: MingcuteThoughtFill,
					iconOff: MingcuteThoughtLine
				},
				{
					value: 'medium',
					label: 'Media',
					desc: 'Base funcional',
					tooltip:
						'Comprende la lógica elemental y puede realizar tareas simples, construir maquetas básicas o escribir código inicial.',
					iconOn: MaterialSymbolsChatBubble,
					iconOff: MaterialSymbolsChatBubbleOutline
				},
				{
					value: 'high',
					label: 'Alta',
					desc: 'Dominio previo',
					tooltip:
						'Experiencia técnica avanzada, técnica previa o manejo fluido de las herramientas antes de cursar la materia.',
					iconOn: MingcuteStarTopperFill,
					iconOff: MingcuteStarTopperLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isAffinitySelected}
	{@const levels = ['Nulo', 'Bajo', 'Medio', 'Alto']}
	{@const inputs = {
		'Lógico-Matemática': {
			description: 'Análisis, cálculo, deducción, resolución lógica.',
			id: 'logic-math',
			icon: null,
			tooltips: [
				'Sin análisis numérico ni estructuras lógicas.',
				'Operaciones básicas o deducciones directas.',
				'Análisis cuantitativo y resolución de problemas.',
				'Abstracción compleja o razonamiento lógico avanzado.'
			]
		},
		'Memoria-Conceptual': {
			description: 'Memoria, conceptos, reglas, normativas.',
			id: 'memory-concepts',
			icon: null,
			tooltips: [
				'Sin carga teórica ni retención de datos.',
				'Conceptos esenciales y términos elementales.',
				'Asimilación de marcos teóricos y normativas.',
				'Dominio de extensos volúmenes de información.'
			]
		},
		'Procedimental-Técnica': {
			description: 'Metodologías, herramientas, protocolos.',
			id: 'procedure-technique',
			icon: null,
			tooltips: [
				'Sin uso de métodos ni herramientas guiadas',
				'Aplicación de guías y tareas estructuradas',
				'Ejecución activa de procesos y metodologías',
				'Dominio experto de entornos y protocolos técnicos'
			]
		},
		'Creativa-Sintética': {
			description: 'Crear, innovar, diseño, soluciones originales.',
			id: 'creative-synthetic',
			icon: null,
			tooltips: [
				'Tareas mecánicas con soluciones predefinidas',
				'Adaptaciones o decisiones de diseño simples',
				'Desarrollo de propuestas e ideas originales',
				'Creación desde cero de soluciones inéditas'
			]
		},
		'Colaborativa-Interpersonal': {
			description: 'Trabajo en equipo, liderazgo, comunicación asertiva.',
			id: 'collaborative-interpersonal',
			icon: null,
			tooltips: [
				'Desempeño y evaluaciones 100% individuales',
				'Coordinación básica para entregas conjuntas',
				'Cooperación activa y debates estructurados',
				'Liderazgo, negociación y exposición continua'
			]
		},
		'Psicomotora-Ejecutiva': {
			description: 'Destreza motriz, uso de herramientas, esfuerzo físico.',
			id: 'motor-execution',
			icon: null,
			tooltips: [
				'Actividad netamente cognitiva o de escritorio',
				'Manipulación básica de instrumentos o equipos',
				'Uso preciso de herramientas o destreza manual',
				'Alta exigencia física o coordinación técnica motriz'
			]
		}
	}}

	<Form.Field name="skill-taxonomy" class={styles.container()}>
		<FieldHeader
			title="Perfil del Ramo"
			description="¿Qué tipo de esfuerzo o razonamiento te exigió más este ramo?"
			htmlFor="skill-taxonomy"
		/>
		<div class="flex w-fit min-w-2/3 flex-col items-end">
			<div class="text-muted-foreground mr-2 -mb-2 flex flex-row gap-4 px-1 text-xs">
				{#each levels as level (level)}
					<div class="relative h-4 w-8">
						<p class="absolute left-1/2 -translate-x-1/2">{level}</p>
					</div>
				{/each}
			</div>
			{#each Object.entries(inputs) as [title, input] (input.id)}
				<Form.Field
					name={input.id}
					class="odd:to-card flex w-full flex-row justify-between gap-8 rounded bg-linear-to-r pr-2"
				>
					<div class="w-full">
						<label for={input.id} class="text-sm">{title}</label>
						<p class={styles.description({ class: 'text-xs' })}>{input.description}</p>
					</div>
					<div class="flex items-center justify-center">
						<IconToggleField
							size="sm"
							class="justify-end"
							items={levels.map((l, i) => ({
								value: i.toString(),
								tooltip: input.tooltips[i],
								containerClass: 'w-8',
								iconOn: MingcuteDiamondSquareFill,
								iconOff: MingcuteDiamondSquareLine
							}))}
						/>
					</div>
				</Form.Field>
			{/each}
		</div>
		<Form.Message />
	</Form.Field>
{/if}

{#if isAffinitySelected && isProfileComplete}
	<Form.Field name="needed-autonomy" class={styles.container()}>
		<FieldHeader
			title="Autonomía Requerida"
			description="¿Cuánta investigación y aprendizaje tenías obligatoriamente que hacer por tu cuenta?"
			htmlFor="needed-autonomy"
		/>
		<IconToggleField
			items={[
				{
					value: 'low',
					label: 'Baja',
					desc: 'Guiado',
					tooltip:
						'El ramo entregó guías paso a paso, plantillas y ejemplos claros para cada tarea compleja',
					iconOn: MingcuteListOrderedFill,
					iconOff: MingcuteListOrderedLine
				},
				{
					value: 'medium',
					label: 'Media',
					desc: 'Semi-guiado',
					tooltip:
						'Hubo pautas y ejemplos al principio, pero luego tuve que resolver los problemas de forma independiente',
					iconOn: MingcuteListSearchFill,
					iconOff: MingcuteListSearchLine
				},
				{
					value: 'high',
					label: 'Alta',
					desc: 'Independiente',
					tooltip:
						'Tuve que investigar y aprender casi todo por mi cuenta, sin modelos ni instrucciones detalladas',
					iconOn: MingcuteSearch3Fill,
					iconOff: MingcuteSearch3Line
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isAffinitySelected && isProfileComplete && isAutonomySelected}
	<Form.Field name="group-factor" class={styles.container()}>
		<FieldHeader
			title="Factor de Grupo"
			description="¿Qué tanto dependes de otros al cursar el ramo?"
			htmlFor="group-factor"
		/>
		<IconToggleField
			items={[
				{
					value: 'none',
					label: 'Nula',
					desc: 'Individual',
					tooltip:
						'El ramo se aprueba mediante el esfuerzo puramente personal; no hay trabajos en equipo.',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'low',
					label: 'Baja',
					desc: 'Apoyo grupal',
					tooltip:
						'El trabajo es individual, pero incluye tareas o talleres breves en equipo que suman puntaje.',
					iconOn: MingcuteUser3Fill,
					iconOff: MingcuteUser3Line
				},
				{
					value: 'medium',
					label: 'Media',
					desc: 'Híbrido',
					tooltip:
						'La teoría se evalúa de forma individual, pero hay un proyecto o laboratorio grupal obligatorio y pesado.',
					iconOn: MingcuteGroup2Fill,
					iconOff: MingcuteGroup2Line
				},
				{
					value: 'high',
					label: 'Alta',
					desc: 'Colectivo',
					tooltip:
						'La mayor parte del ramo y la nota final dependen críticamente del desempeño y coordinación del grupo.',
					iconOn: MingcuteGroup3Fill,
					iconOff: MingcuteGroup3Line
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if isAffinitySelected && isProfileComplete && isAutonomySelected && isGroupFactorSelected}
	<Form.Field name="learning-curve" class={styles.container()}>
		<FieldHeader
			title="Curva de Aprendizaje"
			description="¿Qué tan rápido se asimila la lógica, reglas o herramientas iniciales del ramo?"
			htmlFor="learning-curve"
		/>
		<IconToggleField
			items={[
				{
					value: 'flat',
					label: 'Fluida',
					desc: 'Ya traigo las bases',
					tooltip:
						'Usa conocimientos que ya traes de ramos anteriores. No hay conceptos drásticamente nuevos, es asociar y recordar.',
					iconOn: StraightCurve,
					iconOff: StraightCurve
				},
				{
					value: 'linear',
					label: 'Constante',
					desc: 'Esfuerzo parejo semanal',
					tooltip:
						'Dificultad constante. Requiere aprender procedimientos prácticos nuevos, pero el esfuerzo necesario es el mismo de principio a fin.',
					iconOn: LinearCurve,
					iconOff: LinearCurve
				},
				{
					value: 'exponential',
					label: 'Exponencial',
					desc: 'Dificultad creciente',
					tooltip:
						'Parte muy amigable y simple, pero a mitad de semestre la complejidad de las materias se dispara drásticamente.',
					iconOn: ExpoCurve,
					iconOff: ExpoCurve
				},
				{
					value: 'wall',
					label: 'Muro',
					desc: 'Duro desde el inicio',
					tooltip:
						'Complejidad crítica desde el primer día. Entorno totalmente nuevo que exige un esfuerzo masivo para no quedar atrás de entrada.',
					iconOn: WallCurve,
					iconOff: WallCurve
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}
