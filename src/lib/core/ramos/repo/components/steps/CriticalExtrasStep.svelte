<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import { Form } from '$lib/components/ui/form';
	import StarCalification from '$lib/components/ui/form/components/StarCalification.svelte';
	import MingcuteCalendarMonthFill from '$lib/icons/MingcuteCalendarMonthFill.svelte';
	import MingcuteCalendarMonthLine from '$lib/icons/MingcuteCalendarMonthLine.svelte';
	import MingcuteCalendarTimeAddFill from '$lib/icons/MingcuteCalendarTimeAddFill.svelte';
	import MingcuteCalendarTimeAddLine from '$lib/icons/MingcuteCalendarTimeAddLine.svelte';
	import MingcuteQuestionFill from '$lib/icons/MingcuteQuestionFill.svelte';
	import MingcuteQuestionLine from '$lib/icons/MingcuteQuestionLine.svelte';
	import MingcuteThreeCirclesFill from '$lib/icons/MingcuteThreeCirclesFill.svelte';
	import MingcuteThreeCirclesLine from '$lib/icons/MingcuteThreeCirclesLine.svelte';
	import MingcuteVersionFill from '$lib/icons/MingcuteVersionFill.svelte';
	import MingcuteVersionLine from '$lib/icons/MingcuteVersionLine.svelte';
	import MingcuteWebhookFill from '$lib/icons/MingcuteWebhookFill.svelte';
	import MingcuteWebhookLine from '$lib/icons/MingcuteWebhookLine.svelte';
	import { cn } from '$lib/utils';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { styles, form }: Props = $props();
</script>

{#if form}
	<Form.Field name="course-order-coordination" class={styles.container()}>
		<FieldHeader
			title="Orden y Cumplimiento"
			description="¿Qué tan ordenada fue la gestión del equipo docente (evaluaciones, entrega de notas, coordinación de paralelos)?"
			htmlFor="course-order-coordination"
		/>
		<IconToggleField
            items={[
                {
                    value: 'efficient',
                    label: 'Eficiente',
                    desc: 'Cero atraso',
                    tooltip:
                        'Excelente gestión. Las fechas de evaluación se respetan estrictamente, las notas se entregan en los plazos acordados y el equipo docente está bien comunicado',
                    iconOn: MingcuteCalendarMonthFill,
                    iconOff: MingcuteCalendarMonthLine
                },
                {
                    value: 'regular',
                    label: 'Regular',
                    desc: 'Con detalles',
                    tooltip:
                        'Gestión aceptable pero con ripios. Hay demoras esporádicas en la entrega de notas, desajustes menores entre profesores o cambios de fecha avisados con poco tiempo',
                    iconOn: MingcuteCalendarTimeAddFill,
                    iconOff: MingcuteCalendarTimeAddLine
                },
                {
                    value: 'deficient',
                    label: 'Deficiente',
                    desc: 'Improvisado',
                    tooltip:
                        'Mala gestión. Fechas que cambian constantemente, notas que tardan semanas o meses en publicarse y evidente falta de comunicación en el equipo docente',
                    iconOn: MingcuteQuestionFill,
                    iconOff: MingcuteQuestionLine
                }
            ]}
        />
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['course-order-coordination']}
	<Form.Field name="content-continuity" class={styles.container()}>
		<FieldHeader
			title="Continuidad del Contenido"
			description="¿Qué tan de conectados son los contenidos del ramo, por si pierdes el hilo y quieres recuperar?"
			htmlFor="content-continuity"
		/>
		<IconToggleField
			items={[
				{
					value: 'independent',
					label: 'Independientes',
					desc: 'Temas aislados',
					tooltip:
						'Si te va mal en un certamen, puedes partir de cero y recuperarte perfectamente para el siguiente',
					iconOn: MingcuteThreeCirclesFill,
					iconOff: MingcuteThreeCirclesLine
				},
				{
					value: 'cumulative',
					label: 'Acumulativos',
					desc: 'Temas en apoyo',
					tooltip:
						'Perder una clase dificulta avanzar, pero es totalmente recuperable estudiando por tu cuenta',
					iconOn: MingcuteWebhookFill,
					iconOff: MingcuteWebhookLine
				},
				{
					value: 'strict-secuencial',
					label: 'Dependientes',
					desc: 'Efecto dominó',
					tooltip:
						'No entender la base hace matemáticamente y conceptualmente imposible digerir lo que sigue',
					iconOn: MingcuteVersionFill,
					iconOff: MingcuteVersionLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['content-continuity']}
	<Form.Field name="course-calification" class={styles.container()}>
		<FieldHeader
			title="Calificación Personal"
			description="¿Qué nota resume tu experiencia con este ramo? Piensa en lo desafiante, frustrante o gratificante que fue cursarlo"
			htmlFor="course-calification"
		/>
		<StarCalification
			star={form.values['course-calification'] || 0}
			onValueChange={(_new) => {
				form.setFieldValue('course-calification', _new);
			}}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['course-calification']}
	{@const maxLength = 400}
	{@const remainingLength = maxLength - (form.values['additional-comments']?.length || 0)}
	<Form.Field name="additional-comments" class={styles.container()}>
		<FieldHeader optional title="Comentarios Adicionales" htmlFor="additional-comments">
			{#snippet description()}
				<p>¿Qué le dirías a un amigo que va a inscribir este ramo el próximo semestre?</p>
				<p
					class="-translate-y-2 text-xs font-medium text-sky-500 opacity-0 transition-all transition-discrete group-hover/field:translate-y-0 group-hover/field:opacity-100"
				>
					Evita mencionar nombres de profesores. Enfócate en tips de estudio, material clave,
					advertencias de tiempo o la dinámica real del ramo
				</p>
			{/snippet}
		</FieldHeader>
		<div class="flex flex-col items-end gap-1">
			<div class="w-full flex flex-row justify-between gap-8">
				<p
				id="additional-comments-counter"
				class={cn(
					'ml-auto text-muted-foreground text-xs',
					remainingLength < 100 && 'text-amber-500',
					remainingLength < 20 && 'text-destructive-foreground'
				)}
				aria-live="polite"
			>
				{remainingLength} caracteres restantes
			</p>
			</div>
			<textarea
				id="additional-comments"
				name="additional-comments"
				bind:value={
					() => form.values['additional-comments'],
					(v) => {
						form.setFieldValue('additional-comments', v);
					}
				}
				maxlength={maxLength}
				rows={4}
				placeholder=""
				aria-describedby="additional-comments-help"
				style:max-height="calc(5lh+10px)"
				class={cn(
					'placeholder:text-muted-foreground/80 w-full flex-1 overflow-y-auto rounded border p-2 text-sm placeholder:text-sm'
				)}
			></textarea>
		</div>
		<Form.Message />
	</Form.Field>
{/if}
