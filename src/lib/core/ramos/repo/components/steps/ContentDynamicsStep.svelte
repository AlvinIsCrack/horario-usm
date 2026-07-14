<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
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
	import MingcutePaletteFill from '$lib/icons/MingcutePaletteFill.svelte';
	import MingcuteToolFill from '$lib/icons/MingcuteToolFill.svelte';
	import MaterialSymbolsDirectionsRunRounded from '$lib/icons/MaterialSymbolsDirectionsRunRounded.svelte';
	import MaterialSymbolsAbcRounded from '$lib/icons/MaterialSymbolsAbcRounded.svelte';
	import MingcuteBrainFill from '$lib/icons/MingcuteBrainFill.svelte';
	import TablerAbc from '$lib/icons/TablerAbc.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();

	const TOTAL_BUDGET = 100;
	const STEP = 10;

	const INPUTS = {
    'logic-math': {
        label: 'Lógico-Matemática',
        description: 'Análisis, cálculo, deducción, resolución lógica.',
        icon: MingcuteBrainFill
    },
    'memory-concepts': {
        label: 'Memoria-Conceptual',
        description: 'Memoria, conceptos, reglas, normativas.',
        icon: TablerAbc
    },
    'procedure-technique': {
        label: 'Práctica y Métodos',
        description: 'Metodologías, herramientas, protocolos.',
        icon: MingcuteToolFill
    },
    'creative-synthetic': {
        label: 'Creativa-Sintética',
        description: 'Crear, innovar, diseño, soluciones originales.',
        icon: MingcutePaletteFill
    },
    'collaborative-interpersonal': {
        label: 'Trabajo en Equipo',
        description: 'Trabajo grupal, liderazgo, comunicación asertiva.',
        icon: MingcuteGroup3Fill
    },
    'motor-execution': {
        label: 'Esfuerzo Físico/Taller',
        description: 'Destreza motriz, uso de herramientas, esfuerzo físico.',
        icon: MaterialSymbolsDirectionsRunRounded
    }
} as const;
	const TAXONOMY_KEYS = Object.keys(INPUTS);

	const colorScale: Record<string, { stroke: string; text: string }> = {
		'logic-math': { stroke: 'stroke-sky-700', text: 'text-sky-600' },
		'memory-concepts': {
			stroke: 'stroke-red-400',
			text: 'text-red-400'
		},
		'procedure-technique': {
			stroke: 'stroke-lime-500',
			text: 'text-lime-400'
		},
		'creative-synthetic': {
			stroke: 'stroke-amber-500',
			text: 'text-amber-500'
		},
		'collaborative-interpersonal': {
			stroke: 'stroke-purple-500',
			text: 'text-purple-500'
		},
		'motor-execution': { stroke: 'stroke-gray-300', text: 'text-gray-300' }
	} as const;

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
	<Form.Field name="familiarity_level" class={styles.container()}>
		<FieldHeader
			title="Familiaridad Previa"
			description="¿Qué tan cercano, intuitivo o familiar te resultaba el entorno conceptual, técnico o práctico de este ramo antes de cursarlo?"
			htmlFor="familiarity_level"
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
	<Form.Field name="skill-taxonomy" class={styles.container()}>
		<FieldHeader title="Perfil del Ramo" htmlFor="skill-taxonomy">
			{#snippet description()}
				{@const pieSlices = (() => {
					let accumulatedPercentage = 0;
					const entries = TAXONOMY_KEYS.map((key) => [key, Number(form.values?.[key]) || 0]);
					return entries.map(([key, value]) => {
						const percentage = TOTAL_BUDGET > 0 ? (+value / TOTAL_BUDGET) * 100 : 0;
						const strokeDasharray = `${percentage} ${100 - percentage}`;
						const strokeDashoffset = 100 - accumulatedPercentage + 25;
						accumulatedPercentage += percentage;

						const colors = colorScale[key] ?? {
							bg: 'bg-muted',
							stroke: 'stroke-white',
							text: 'text-foreground'
						};

						const midAngle = (accumulatedPercentage - percentage / 2) * (2 * Math.PI / 100) - (Math.PI / 2);
						const radius = 15.915; 
						const iconX = 21 + radius * Math.cos(midAngle);
						const iconY = 21 + radius * Math.sin(midAngle);

						return {
							key,
							value,
							strokeDasharray,
							strokeDashoffset,
							colors,
							iconX,
    						iconY
						};
					});
				})()}
				<p>
					¿Cómo distribuirías {TOTAL_BUDGET} puntos según el nivel de exigencia real de cada bloque?
					Prioriza los más fuertes sin preocuparte por una exactitud milimétrica
				</p>
				{#if currentPoints}
				<div transition:fade={{duration: 200}} class="relative mx-auto my-auto aspect-square size-50 pt-2">
					<svg viewBox="0 0 42 42" class="h-full w-full -scale-x-100 transform">
						<circle
							cx="21"
							cy="21"
							r="15.915"
							fill="transparent"
							stroke-width="8"
							class="stroke-accent"
						/>

						{#each pieSlices as slice}
								<circle
									cx="21"
									cy="21"
									r="15.915"
									fill="transparent"
									stroke-width="8"
									stroke-dasharray={slice.strokeDasharray}
									stroke-dashoffset={slice.strokeDashoffset}
									class={cn('transition-all duration-300 ease-in-out', slice.colors.stroke)}
								/>
								{#if +slice.value > 0}
									{@const IconComponent = INPUTS[slice.key as keyof typeof INPUTS].icon}
									<g 
										transform="translate({slice.iconX}, {slice.iconY})"
										class="origin-center starting:opacity-0 opacity-100 pointer-events-none text-white transition-all"
									>
										<IconComponent
										width="6"
										height="6"
										x="-3"
										y="-3"
										class="-scale-x-100 drop-shadow-md/60"
										/>
									</g>
								{/if}
						{/each}

						<text
							x="21"
							y="21"
							dominant-baseline="central"
							text-anchor="middle"
							class={cn(
								'fill-muted-foreground origin-center -scale-x-100 transform text-[4px] font-medium',
								currentPoints >= TOTAL_BUDGET && 'fill-card-foreground font-bold'
							)}
						>
							{currentPoints}/{TOTAL_BUDGET}
						</text>
					</svg>
				</div>
				{/if}
			{/snippet}
		</FieldHeader>

		<div class="flex w-full flex-col gap-1">
			{#each Object.entries(INPUTS) as [id, input] (id)}
				{@const value = Number(form.values?.[id]) || 0}
				{@const color = colorScale[id] ?? {
					bg: 'bg-muted',
					stroke: 'stroke-white',
					text: 'text-foreground'
				}}

				<div
					class="flex w-full flex-row items-center justify-between gap-4 rounded bg-linear-to-r from-transparent to-transparent px-1 transition-colors odd:to-black/60"
				>
					<div class="flex-1">
						<label for={id} class="text-sm font-medium {color.text}">
							<input.icon class="size-5 inline"/>
							{input.label}
						</label>
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
							onclick={() => handlePointChange(id, value - STEP)}
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
							onclick={() => handlePointChange(id, value + STEP)}
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
					value: 'guided',
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
					value: 'independent',
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
					value: 'group-support',
					label: 'Baja',
					desc: 'Apoyo grupal',
					tooltip:
						'El trabajo es individual, pero incluye tareas o talleres breves en equipo que suman puntaje.',
					iconOn: MingcuteUser3Fill,
					iconOff: MingcuteUser3Line
				},
				{
					value: 'hybrid',
					label: 'Media',
					desc: 'Híbrido',
					tooltip:
						'La teoría se evalúa de forma individual, pero hay un proyecto o laboratorio grupal obligatorio y pesado.',
					iconOn: MingcuteGroup2Fill,
					iconOff: MingcuteGroup2Line
				},
				{
					value: 'colective',
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
