<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import { Form } from '$lib/components/ui/form';
	import StarCalification from '$lib/components/ui/form/components/StarCalification.svelte';
	import MingcuteBook2Fill from '$lib/icons/MingcuteBook2Fill.svelte';
	import MingcuteBook2Line from '$lib/icons/MingcuteBook2Line.svelte';
	import MingcuteForbidCircleFill from '$lib/icons/MingcuteForbidCircleFill.svelte';
	import MingcuteForbidCircleLine from '$lib/icons/MingcuteForbidCircleLine.svelte';
	import MingcuteGroup2Fill from '$lib/icons/MingcuteGroup2Fill.svelte';
	import MingcuteGroup2Line from '$lib/icons/MingcuteGroup2Line.svelte';
	import MingcuteThreeCirclesFill from '$lib/icons/MingcuteThreeCirclesFill.svelte';
	import MingcuteThreeCirclesLine from '$lib/icons/MingcuteThreeCirclesLine.svelte';
	import MingcuteUserLockFill from '$lib/icons/MingcuteUserLockFill.svelte';
	import MingcuteUserLockLine from '$lib/icons/MingcuteUserLockLine.svelte';
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
	<Form.Field name="teacher-factor" class={styles.container()}>
		<FieldHeader
			title="Factor Docente"
			description="¿El ramo sigue un programa estandarizado o tu nota final depende casi totalmente del profesor que te tocó?"
			htmlFor="teacher-factor"
		/>
		<IconToggleField
			items={[
				{
					value: 'null',
					label: 'No sé',
					desc: 'Sin información',
					tooltip:
						'Aún no curso el ramo o no tengo referencias sobre cómo se evalúa ni el impacto de los profesores.',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'low',
					label: 'Bajo',
					desc: 'Estandarizado',
					tooltip:
						'El ramo sigue un programa estricto. Evaluaciones y notas son idénticas para todas las secciones, sin importar el profesor.',
					iconOn: MingcuteBook2Fill,
					iconOff: MingcuteBook2Line
				},
				{
					value: 'medium',
					label: 'Medio',
					desc: 'Impacto parcial',
					tooltip:
						'Existe un temario común, pero cada profesor tiene flexibilidad para diseñar sus propias pruebas, tareas o criterios de corrección.',
					iconOn: MingcuteGroup2Fill,
					iconOff: MingcuteGroup2Line
				},
				{
					value: 'high',
					label: 'Alto',
					desc: 'Dependiente',
					tooltip:
						'La nota final y la dificultad dependen completamente del criterio, estilo de evaluación y nivel de exigencia del profesor asignado.',
					iconOn: MingcuteUserLockFill,
					iconOff: MingcuteUserLockLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['teacher-factor']}
	<Form.Field name="snowball-effect" class={styles.container()}>
		<FieldHeader
			title="Continuidad del Contenido"
			description="Si te pierdes al principio, ¿puedes recuperarte más adelante o cada clase depende estrictamente de la anterior?"
			htmlFor="snowball-effect"
		/>
		<IconToggleField
			items={[
				{
					value: 'low',
					label: 'Independiente',
					tooltip:
						'Los contenidos cambian por unidad. Si te va mal en un certamen, puedes partir desde cero y entender el siguiente tema sin problemas.',
					iconOn: MingcuteThreeCirclesFill,
					iconOff: MingcuteThreeCirclesLine
				},
				{
					value: 'medium',
					label: 'Gradual',
					tooltip:
						'Se necesitan las bases conceptuales, pero es totalmente posible ponerse al día de forma autónoma si te retrasas un par de semanas.',
					iconOn: MingcuteWebhookFill,
					iconOff: MingcuteWebhookLine
				},
				{
					value: 'high',
					label: 'Secuencial',
					tooltip:
						'Efecto bola de nieve inmediato. Cada clase construye sobre la anterior; perderse una semana hace casi imposible seguir el hilo del ramo.',
					iconOn: MingcuteVersionFill,
					iconOff: MingcuteVersionLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['snowball-effect']}
	<Form.Field name="calification" class={styles.container()}>
		<FieldHeader
			title="Calificación Personal"
			description="¿Qué nota resume tu experiencia con este ramo? Piensa en lo desafiante, frustrante o gratificante que fue cursarlo"
			htmlFor="calification"
		/>
		<StarCalification
			star={form.values['calification'] || 0}
			onValueChange={(_new) => {
				form.setFieldValue('calification', _new);
			}}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['calification']}
	{@const maxLength = 400}
	{@const remainingLength = maxLength - (form.values['comment']?.length || 0)}
	<Form.Field name="comment" class={styles.container()}>
		<FieldHeader title="Comentarios Adicionales" htmlFor="comment">
			{#snippet description()}
				<p>¿Qué le dirías a un amigo que va a inscribir este ramo el próximo semestre?</p>
				<p
					class="text-muted-foreground/80 -translate-y-2 text-xs opacity-0 transition-all transition-discrete group-hover/field:translate-y-0 group-hover/field:opacity-100"
				>
					Evita mencionar nombres de profesores. Enfócate en tips de estudio, material clave,
					advertencias de tiempo o la dinámica real del ramo
				</p>
			{/snippet}
		</FieldHeader>
		<div class="flex flex-col items-end gap-1">
			<span
				id="comment-counter"
				class={cn(
					'text-muted-foreground text-xs',
					remainingLength < 100 && 'text-amber-500',
					remainingLength < 20 && 'text-destructive-foreground'
				)}
				aria-live="polite"
			>
				{remainingLength} caracteres restantes
			</span>
			<textarea
				id="comment"
				name="comment"
				bind:value={
					() => form.values['comment'],
					(v) => {
						form.setFieldValue('comment', v);
					}
				}
				maxlength={maxLength}
				rows={4}
				placeholder=""
				aria-describedby="comment-help"
				style:max-height="calc(5lh+10px)"
				class={cn(
					'placeholder:text-muted-foreground/80 w-full flex-1 overflow-y-auto rounded border p-2 text-sm placeholder:text-sm'
				)}
			></textarea>
		</div>
		<Form.Message />
	</Form.Field>
{/if}
