<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import { Form } from '$lib/components/ui/form';
	import StarCalification from '$lib/components/ui/form/components/StarCalification.svelte';
	import LucideEqual from '$lib/icons/LucideEqual.svelte';
	import LucideEqualApproximately from '$lib/icons/LucideEqualApproximately.svelte';
	import LucideEqualNot from '$lib/icons/LucideEqualNot.svelte';
	import MaterialSymbolsEqualRounded from '$lib/icons/MaterialSymbolsEqualRounded.svelte';
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
			description="Si un amigo cursara este mismo ramo en otro paralelo o con otro profesor, ¿creen que su experiencia y exigencia serían muy distintas?"
			htmlFor="teacher-factor"
		/>
		<IconToggleField
			items={[
				{
					value: 'null',
					label: 'Sin opinión',
					desc: 'No lo sé/poca información',
					tooltip:
						'Aún no curso el ramo o no tengo referencias sobre cómo se evalúa ni el impacto de los profesores',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'low',
					label: 'Coordinado',
					desc: 'Da lo mismo el paralelo',
					tooltip:
						'Todos los profesores siguen el mismo ritmo, evalúan con los mismos criterios y las notas son justas e independientes de quién te dicte la clase',
					iconOn: LucideEqual,
					iconOff: LucideEqual
				},
				{
					value: 'medium',
					label: 'Variable',
					desc: 'Cambia la experiencia',
					tooltip:
						'Las evaluaciones principales son comunes, pero el nivel de explicación, las exigencias en tareas y el ambiente de la clase cambian según el profesor',
					iconOn: LucideEqualApproximately,
					iconOff: LucideEqualApproximately
				},
				{
					value: 'high',
					label: 'Lotería',
					desc: 'Suerte del paralelo',
					tooltip:
						'No hay coordinación. El nivel de dificultad, la exigencia en las correcciones y la probabilidad de aprobar dependen casi al 100% del profesor que te toque',
					iconOn: LucideEqualNot,
					iconOff: LucideEqualNot
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
					value: 'independent',
					label: 'Aislado',
					desc: 'Remontada fácil',
					tooltip:
						'Los temas cambian por unidad. Si te va mal en el primer certamen, puedes partir de cero y entender perfecto el segundo',
					iconOn: MingcuteThreeCirclesFill,
					iconOff: MingcuteThreeCirclesLine
				},
				{
					value: 'cumulative',
					label: 'Conectado',
					desc: 'Pide constancia',
					tooltip:
						'Las materias se apoyan entre sí. Si te pierdes una clase te va a costar reenganchar, pero es totalmente recuperable con estudio',
					iconOn: MingcuteWebhookFill,
					iconOff: MingcuteWebhookLine
				},
				{
					value: 'chained',
					label: 'Encadenado',
					desc: 'Cero retraso',
					tooltip:
						'Secuencia estricta de contenido y materia clase a clase. Si no dominas la base de las primeras semanas, es imposible entender lo que sigue',
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
		<FieldHeader optional title="Comentarios Adicionales" htmlFor="comment">
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
