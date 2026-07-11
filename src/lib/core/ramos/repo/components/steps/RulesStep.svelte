<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import MingcuteDiamondSquareFill from '$lib/icons/MingcuteDiamondSquareFill.svelte';
	import MingcuteDiamondSquareLine from '$lib/icons/MingcuteDiamondSquareLine.svelte';
	import MingcuteFireFill from '$lib/icons/MingcuteFireFill.svelte';
	import MingcuteFireLine from '$lib/icons/MingcuteFireLine.svelte';
	import MingcuteHeartbeatFill from '$lib/icons/MingcuteHeartbeatFill.svelte';
	import MingcuteHeartbeatLine from '$lib/icons/MingcuteHeartbeatLine.svelte';
	import MingcuteMenuFill from '$lib/icons/MingcuteMenuFill.svelte';
	import MingcuteMenuLine from '$lib/icons/MingcuteMenuLine.svelte';
	import MingcuteWaveFill from '$lib/icons/MingcuteWaveFill.svelte';
	import MingcuteWaveLine from '$lib/icons/MingcuteWaveLine.svelte';
	import { slide } from 'svelte/transition';
	import FieldContainer from '../forms/FieldContainer.svelte';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';
	import ToggleField from '../forms/ToggleField.svelte';
	import MingcuteUserFollow2Fill from '$lib/icons/MingcuteUserFollow2Fill.svelte';
	import MingcuteUserFollow2Line from '$lib/icons/MingcuteUserFollow2Line.svelte';
	import MingcuteEye2Fill from '$lib/icons/MingcuteEye2Fill.svelte';
	import MingcuteEye2Line from '$lib/icons/MingcuteEye2Line.svelte';
	import MingcuteQuestionFill from '$lib/icons/MingcuteQuestionFill.svelte';
	import MingcuteQuestionLine from '$lib/icons/MingcuteQuestionLine.svelte';
	import MingcuteUserQuestionFill from '$lib/icons/MingcuteUserQuestionFill.svelte';
	import MingcuteUserQuestionLine from '$lib/icons/MingcuteUserQuestionLine.svelte';
	import MingcuteThumbUp2Fill from '$lib/icons/MingcuteThumbUp2Fill.svelte';
	import MingcuteThumbUp2Line from '$lib/icons/MingcuteThumbUp2Line.svelte';
	import MingcuteMinusCircleFill from '$lib/icons/MingcuteMinusCircleFill.svelte';
	import MingcuteMinusCircleLine from '$lib/icons/MingcuteMinusCircleLine.svelte';
	import MingcuteCloseCircleFill from '$lib/icons/MingcuteCloseCircleFill.svelte';
	import MingcuteCloseCircleLine from '$lib/icons/MingcuteCloseCircleLine.svelte';
	import MingcuteAngelFill from '$lib/icons/MingcuteAngelFill.svelte';
	import MingcuteAngelLine from '$lib/icons/MingcuteAngelLine.svelte';
	import MingcuteSkullFill from '$lib/icons/MingcuteSkullFill.svelte';
	import MingcuteSkullLine from '$lib/icons/MingcuteSkullLine.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

{#if form}
	{@const id = 'real-work-hours'}
	<FieldContainer {styles} {id}>
		<FieldHeader
			title="Horas de estudio real"
			description="En una semana típica del ramo ¿cuántas horas a la semana le dedicaste fuera de clases (estudiar, tareas, proyectos)?"
			htmlFor={id}
			{styles}
		/>
		<IconToggleField
			{id}
			{form}
			items={[
				{
					value: 'light',
					label: '0-3 hrs',
					desc: 'Repasos cortos y lecturas',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'moderate',
					label: '4-7 hrs',
					desc: 'Estudio regular y tareas',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'demanding',
					label: '8-12 hrs',
					desc: 'Estudio fuerte e informes',
					iconOn: MingcuteDiamondSquareFill,
					iconOff: MingcuteDiamondSquareLine
				},
				{
					value: 'intense',
					label: '13+ hrs',
					desc: 'Proyectos y dedicación extrema',
					iconOn: MingcuteFireFill,
					iconOff: MingcuteFireLine
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['real-work-hours']}
	{@const id = 'effort-distribution'}
	<FieldContainer {styles} {id}>
		<FieldHeader
			title="Distribución de Esfuerzo"
			description="¿Es un trabajo constante semana a semana, o se concentra todo a final de mes para las pruebas?"
			htmlFor={id}
			{styles}
		/>
		<IconToggleField
			{id}
			{form}
			items={[
				{
					value: 'constant',
					label: 'Constante',
					desc: 'Ritmo regular y diario',
					iconOn: MingcuteMenuFill,
					iconOff: MingcuteMenuLine
				},
				{
					value: 'intermitent',
					label: 'Cíclico',
					desc: 'Demanda alternante',
					iconOn: MingcuteWaveFill,
					iconOff: MingcuteWaveLine
				},
				{
					value: 'concentrated',
					label: 'Concentrado',
					desc: 'Peaks intensos',
					iconOn: MingcuteHeartbeatFill,
					iconOff: MingcuteHeartbeatLine
				}
			]}
		/>

		{#if form.values['effort-distribution']}
			{@const selectedeffort = form.values['effort-distribution']}
			<div
				transition:slide={{ axis: 'y' }}
				class="mt-2 mb-2 flex min-h-20 w-full basis-full! justify-end py-2"
			>
				{#snippet effortCalendar(
					efforts: { day: number; level: 'none' | 'low' | 'medium' | 'high' }[]
				)}
					{@const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']}
					{@const LEVEL_CLASSES = {
						none: 'text-muted-foreground/60 border-border/30 border',
						low: 'bg-primary/20 text-primary-dark dark:text-primary-light border-primary/10 border',
						medium: 'bg-primary/50 text-primary-foreground border-primary/30 border',
						high: 'bg-primary text-primary-foreground border-primary border'
					}}

					<div class="w-fit">
						<div class="bg-card rounded border p-2 shadow-sm">
							<div
								class="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium opacity-80"
							>
								{#each DAYS_SHORT as day}
									<div class="flex aspect-square size-6 w-full items-center justify-center">
										{day}
									</div>
								{/each}
							</div>

							<div class="grid grid-cols-7 gap-1">
								{#each Array(28) as _, index}
									{@const dayNumber = index + 1}
									{@const weekDay = (dayNumber - 1) % 7}
									{@const effort = efforts.find((e) => e.day === dayNumber)}
									{@const level = effort?.level || 'none'}
									{@const isWeekend = weekDay > 4}
									{@const noneBg = isWeekend ? 'bg-card' : 'bg-accent'}

									<div
										class="relative flex aspect-square size-6 w-full items-center justify-center rounded transition-colors duration-200
                        {LEVEL_CLASSES[level]} 
                        {level === 'none' ? noneBg : ''}"
									></div>
								{/each}
							</div>
						</div>

						<div class="text-muted-foreground mt-2 flex flex-wrap justify-center text-xs">
							<div
								class="to-primary bg-card from-accent via-primary/20 h-2 w-full rounded-full border bg-linear-to-r from-10% via-50%"
							></div>
							<div class="mt-0.5 flex w-full justify-between gap-4">
								<div>Sin demanda</div>
								<div>Demanda máxima</div>
							</div>
						</div>
					</div>
				{/snippet}

				{#if selectedeffort === 'constant'}
					{@render effortCalendar([
						{ day: 1, level: 'low' },
						{ day: 2, level: 'low' },
						{ day: 3, level: 'low' },
						{ day: 8, level: 'medium' },
						{ day: 9, level: 'low' },
						{ day: 10, level: 'low' },
						{ day: 15, level: 'medium' },
						{ day: 16, level: 'low' },
						{ day: 17, level: 'low' },
						{ day: 22, level: 'high' },
						{ day: 23, level: 'medium' },
						{ day: 24, level: 'low' }
					])}
				{:else}
					{@const iscyclic = selectedeffort === 'intermitent'}
					{#if iscyclic}
						{@render effortCalendar([
							{ day: 1, level: 'medium' },
							{ day: 2, level: 'low' },
							{ day: 3, level: 'low' },
							{ day: 8, level: 'low' },
							{ day: 9, level: 'low' },
							{ day: 22, level: 'high' },
							{ day: 23, level: 'medium' },
							{ day: 24, level: 'low' }
						])}
					{:else}
						{@render effortCalendar([
							{ day: 8, level: 'high' },
							{ day: 22, level: 'high' }
						])}
					{/if}
				{/if}
			</div>
		{/if}
	</FieldContainer>
{/if}

{#if form.values['effort-distribution']}
	{@const id = 'assistance-exigence'}
	<FieldContainer {styles} {id}>
		<FieldHeader
			title="Exigencia de Asistencia"
			description="¿Qué tan estricta o necesaria es la presencialidad en el ramo? "
			htmlFor={id}
			{styles}
		/>
		<IconToggleField
			{id}
			{form}
			items={[
				{
					value: 'flexible',
					label: 'Opcional',
					desc: 'Estudio autónomo',
					iconOn: MingcuteUserQuestionFill,
					iconOff: MingcuteUserQuestionLine
				},
				{
					value: 'moderate',
					label: 'Por Reglamento',
					desc: 'Lista, estándar',
					iconOn: MingcuteUserFollow2Fill,
					iconOff: MingcuteUserFollow2Line
				},
				{
					value: 'strict',
					label: 'Crucial',
					desc: 'Materia única en clase',
					iconOn: MingcuteEye2Fill,
					iconOff: MingcuteEye2Line
				}
			]}
		/>
	</FieldContainer>
{/if}

{#if form.values['assistance-exigence']}
	{@const id = 'relief-mechanics'}
	<FieldContainer {styles} {id}>
		<FieldHeader
			title="Mecánicas de Alivio"
			description="¿Cuánta flexibilidad o segundas oportunidades ofrece el ramo si te va mal?"
			htmlFor={id}
			{styles}
		/>
		<IconToggleField
			{id}
			{form}
			items={[
				{
					value: 'high',
					label: 'Alta',
					desc: 'Alta recuperabilidad ',
					iconOn: MingcuteAngelFill,
					iconOff: MingcuteAngelLine
				},
				{
					value: 'moderate',
					label: 'Moderada',
					desc: 'Ayudas justas, mínimas',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'none',
					label: 'Nula',
					desc: 'Sin piedad, acumulativo',
					iconOn: MingcuteSkullFill,
					iconOff: MingcuteSkullLine
				}
			]}
		/>
	</FieldContainer>
{/if}
