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
	import { cn } from '$lib/utils';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();

	const TOTAL_BUDGET = 12;
	const TAXONOMY_KEYS = [
		'logic-math',
		'memory-concepts',
		'procedure-technique',
		'creative-synthetic',
		'collaborative-interpersonal',
		'motor-execution'
	];

	const inputs = {
		'Lógico-Matemática': {
			description: 'Análisis, cálculo, deducción, resolución lógica.',
			id: 'logic-math'
		},
		'Memoria-Conceptual': {
			description: 'Memoria, conceptos, reglas, normativas.',
			id: 'memory-concepts'
		},
		'Práctica y Métodos': {
			description: 'Metodologías, herramientas, protocolos.',
			id: 'procedure-technique'
		},
		'Creativa-Sintética': {
			description: 'Crear, innovar, diseño, soluciones originales.',
			id: 'creative-synthetic'
		},
		'Trabajo en Equipo': {
			description: 'Trabajo grupal, liderazgo, comunicación asertiva.',
			id: 'collaborative-interpersonal'
		},
		'Esfuerzo Físico/Taller': {
			description: 'Destreza motriz, uso de herramientas, esfuerzo físico.',
			id: 'motor-execution'
		}
	};

	const currentPoints = $derived(
		TAXONOMY_KEYS.reduce((acc, key) => acc + (Number(form.values?.[key]) || 0), 0)
	);

	const pointsLeft = $derived(TOTAL_BUDGET - currentPoints);

	const isProfileComplete = $derived(currentPoints === TOTAL_BUDGET);
	const isAffinitySelected = $derived(isFieldAnswered(form, 'affinity'));
	const isAutonomySelected = $derived(isFieldAnswered(form, 'needed-autonomy'));
	const isGroupFactorSelected = $derived(isFieldAnswered(form, 'group-factor'));

	function handlePointChange(id: string, nextValue: number) {
		const currentVal = Number(form.values?.[id]) || 0;
		const diff = nextValue - currentVal;

		if (pointsLeft - diff >= 0 && nextValue >= 0) {
			form.setFieldValue(id, nextValue);
		}
	}
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
	<!-- Campo 2: Perfil del Ramo mediante Distribución de Puntos[cite: 2] -->
	<Form.Field name="skill-taxonomy" class={styles.container()}>
		<FieldHeader title="Perfil del Ramo" htmlFor="skill-taxonomy">
			{#snippet description()}
				<p>
					Distribuye {TOTAL_BUDGET} puntos entre los siguientes bloques según el nivel de exigencia real
					que sentiste en cada uno.
				</p>
				<div class="text-foreground mt-2 text-sm">
					<span class="text-muted-foreground">Puntos distribuidos:</span>
					{currentPoints} / {TOTAL_BUDGET}
				</div>
			{/snippet}
		</FieldHeader>

		<div class="flex w-full flex-col gap-1">
			{#each Object.entries(inputs) as [title, input] (input.id)}
				{@const value = Number(form.values?.[input.id]) || 0}

				<div
					class="flex w-full flex-row items-center justify-between gap-4 rounded bg-linear-to-r from-transparent to-transparent px-1 transition-colors odd:to-black/60"
				>
					<div class="flex-1">
						<label for={input.id} class="text-sm font-medium">{title}</label>
						<p class={styles.description({ class: 'text-muted-foreground text-xs' })}>
							{input.description}
						</p>
					</div>

					<div
						class={cn(
							'bg-background flex flex-row items-center overflow-hidden rounded shadow-md/20',
							value && 'bg-primary/40'
						)}
					>
						<button
							type="button"
							class="bg-muted hover:bg-muted/80 flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-30"
							disabled={value <= 0}
							onclick={() => handlePointChange(input.id, value - 1)}
						>
							-
						</button>

						<span
							class={cn(
								'h-full w-7 text-center text-sm font-medium tabular-nums select-none',
								value && 'font-bold'
							)}
						>
							{value}
						</span>

						<button
							type="button"
							class="bg-muted hover:bg-muted/80 flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-30"
							disabled={pointsLeft <= 0}
							onclick={() => handlePointChange(input.id, value + 1)}
						>
							+
						</button>
					</div>
				</div>
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
