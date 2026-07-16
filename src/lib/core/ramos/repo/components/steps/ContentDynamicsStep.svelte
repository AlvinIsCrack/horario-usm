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
	import { isFieldAnswered } from '$lib/components/ui/form/helpers';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';
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
			label: 'Análisis y Deducción',
			description: 'Cálculo matemático, lógica abstracta, resolución de problemas o programación.',
			icon: MingcuteBrainFill,
			colors: { stroke: 'stroke-sky-500', text: 'text-sky-600' }
		},
		'memory-concepts': {
			label: 'Teoría y Memorización',
			description: 'Memorizar datos o conceptos: leyes, fórmulas, anatomía, teoría o clasificaciones.',
			icon: TablerAbc,
			colors: { stroke: 'stroke-red-400', text: 'text-red-500' }
		},
		'procedure-technique': {
			label: 'Herramientas y Protocolos',
			description: 'Uso de software técnico (CAD, planillas), normativas de diseño o manuales de procedimiento.',
			icon: MingcuteToolFill,
			colors: { stroke: 'stroke-green-400', text: 'text-green-500' }
		},
		'creative-synthetic': {
			label: 'Diseño y Creación',
			description: 'Proyectos desde cero, ideas originales, expresión artística o soluciones abiertas sin respuesta única.',
			icon: MingcutePaletteFill,
			colors: { stroke: 'stroke-amber-400', text: 'text-amber-500' }
		},
		'collaborative-interpersonal': {
			label: 'Coordinación y Grupo',
			description: 'Trabajo en equipo, exposiciones orales, debates o roles de liderazgo.',
			icon: MingcuteGroup3Fill,
			colors: { stroke: 'stroke-violet-400', text: 'text-violet-500' }
		},
		'motor-execution': {
			label: 'Ejecución Práctica o Física',
			description: 'Trabajo manual o corporal: laboratorios, maquetación, instrumental o actividad física.',
			icon: MaterialSymbolsDirectionsRunRounded,
			colors: { stroke: 'stroke-slate-400', text: 'text-slate-300' }
		}
	} as const;

const TAXONOMY_KEYS = Object.keys(INPUTS);

	const currentPoints = $derived(
		TAXONOMY_KEYS.reduce((acc, key) => acc + (Number(form.values?.[key]) || 0), 0)
	);

	const pointsLeft = $derived(TOTAL_BUDGET - currentPoints);

	const isProfileComplete = $derived(currentPoints === TOTAL_BUDGET);
	const isAffinitySelected = $derived(isFieldAnswered(form, 'student-familiarity-level'));
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
	<Form.Field name="student-familiarity-level" class={styles.container()}>
		<FieldHeader
			title="Familiaridad Previa"
			description="¿Qué tan cercano, intuitivo o familiar te resultaba el entorno conceptual, técnico o práctico de este ramo antes de cursarlo?"
			htmlFor="student-familiarity-level"
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

						const colors = INPUTS[key as keyof typeof INPUTS]?.colors ?? {
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
				{@const color = input.colors ?? {
					bg: 'bg-muted',
					stroke: 'stroke-white',
					text: 'text-foreground'
				}}

				<div
					class="flex w-full flex-row items-center justify-between gap-4 rounded bg-linear-to-r from-transparent to-transparent pr-2 transition-colors odd:to-black/60"
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
							'bg-background border flex flex-row items-center overflow-hidden rounded shadow-md/20',
							value && 'bg-primary/40'
						)}
					>
						<button
							type="button"
							class="bg-muted cursor-pointer hover:bg-muted/80 flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-30"
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
							class="bg-muted cursor-pointer hover:bg-muted/80 flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-30"
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
					label: 'Individual',
					desc: 'Eval. puramente personales',
					tooltip:
						'El ramo se aprueba mediante el esfuerzo puramente personal; no hay trabajos en equipo.',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'group-support',
					label: 'Apoyo',
					desc: 'Eval. grupales menores',
					tooltip:
						'El trabajo es individual, pero incluye tareas o talleres breves en equipo que suman puntaje.',
					iconOn: MingcuteUser3Fill,
					iconOff: MingcuteUser3Line
				},
				{
					value: 'hybrid',
					label: 'Híbrido',
					desc: 'Proyecto o lab. pesado',
					tooltip:
						'La teoría se evalúa de forma individual, pero hay un proyecto o laboratorio grupal obligatorio y pesado.',
					iconOn: MingcuteGroup2Fill,
					iconOff: MingcuteGroup2Line
				},
				{
					value: 'colective',
					label: 'Grupal',
					desc: 'Trabajo en equipo crítico',
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
