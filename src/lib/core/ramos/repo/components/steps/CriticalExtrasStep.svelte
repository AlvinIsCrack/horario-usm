<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import { Form } from '$lib/components/ui/form';
	import StarCalification from '$lib/components/ui/form/components/StarCalification.svelte';
	import MingcuteBriefcaseFill from '$lib/icons/MingcuteBriefcaseFill.svelte';
	import MingcuteBriefcaseLine from '$lib/icons/MingcuteBriefcaseLine.svelte';
	import MingcuteCalendarMonthFill from '$lib/icons/MingcuteCalendarMonthFill.svelte';
	import MingcuteCalendarMonthLine from '$lib/icons/MingcuteCalendarMonthLine.svelte';
	import MingcuteCalendarTimeAddFill from '$lib/icons/MingcuteCalendarTimeAddFill.svelte';
	import MingcuteCalendarTimeAddLine from '$lib/icons/MingcuteCalendarTimeAddLine.svelte';
	import MingcuteFolderDeleteFill from '$lib/icons/MingcuteFolderDeleteFill.svelte';
	import MingcuteFolderDeleteLine from '$lib/icons/MingcuteFolderDeleteLine.svelte';
	import MingcuteForbidCircleFill from '$lib/icons/MingcuteForbidCircleFill.svelte';
	import MingcuteForbidCircleLine from '$lib/icons/MingcuteForbidCircleLine.svelte';
	import MingcuteQuestionFill from '$lib/icons/MingcuteQuestionFill.svelte';
	import MingcuteQuestionLine from '$lib/icons/MingcuteQuestionLine.svelte';
	import MingcuteThreeCirclesFill from '$lib/icons/MingcuteThreeCirclesFill.svelte';
	import MingcuteThreeCirclesLine from '$lib/icons/MingcuteThreeCirclesLine.svelte';
	import MingcuteVersionFill from '$lib/icons/MingcuteVersionFill.svelte';
	import MingcuteVersionLine from '$lib/icons/MingcuteVersionLine.svelte';
	import MingcuteWebhookFill from '$lib/icons/MingcuteWebhookFill.svelte';
	import MingcuteWebhookLine from '$lib/icons/MingcuteWebhookLine.svelte';
	import TablerPuzzle from '$lib/icons/TablerPuzzle.svelte';
	import TablerPuzzleFilled from '$lib/icons/TablerPuzzleFilled.svelte';
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
	<Form.Field name="organization-coordination" class={styles.container()}>
		<FieldHeader
			title="Orden y Cumplimiento"
			description="¿Qué tan ordenada fue la gestión del equipo docente (evaluaciones, entrega de notas, coordinación de paralelos)?"
			htmlFor="organization-coordination"
		/>
		<IconToggleField
            items={[
                {
                    value: 'low',
                    label: 'Ordenado',
                    desc: 'Todo al día',
                    tooltip:
                        'Excelente gestión. Las fechas de evaluación se respetan estrictamente, las notas se entregan en los plazos acordados y el equipo docente está bien comunicado',
                    iconOn: MingcuteCalendarMonthFill,
                    iconOff: MingcuteCalendarMonthLine
                },
                {
                    value: 'medium',
                    label: 'Irregular',
                    desc: 'Atraso ocasional',
                    tooltip:
                        'Gestión aceptable pero con ripios. Hay demoras esporádicas en la entrega de notas, desajustes menores entre profesores o cambios de fecha avisados con poco tiempo',
                    iconOn: MingcuteCalendarTimeAddFill,
                    iconOff: MingcuteCalendarTimeAddLine
                },
                {
                    value: 'high',
                    label: 'Caótico',
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

{#if form.values['organization-coordination']}
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
						'Secuencia estricta de contenido clase a clase. Si no dominas la base de las primeras semanas, es imposible entender lo que sigue',
					iconOn: MingcuteVersionFill,
					iconOff: MingcuteVersionLine
				}
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['snowball-effect']}
	<Form.Field name="relevance-utility" class={styles.container()}>
		<FieldHeader
			title="Relevancia y Utilidad"
			description="¿Sientes que los contenidos aprendidos en este ramo son útiles o relevantes para tu formación profesional?"
			htmlFor="relevance-utility"
		/>
		<IconToggleField
			items={[
				{
					value: 'no-opinion',
					label: "Sin opinión",
					desc: "No sé",
					tooltip: "Me falta avanzar más o no soy capaz de responder",
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				},
				{
					value: 'low',
					label: "Trámite",
					desc: "Poco útil",
					tooltip: 'Contenido obsoleto o desconectado del perfil de la carrera',
					iconOn: MingcuteFolderDeleteFill,
					iconOff: MingcuteFolderDeleteLine
				},
				{
					value: 'medium',
					label: "Formativo",
					desc: "Suma buena base",
					tooltip: "Aporta lógica, pensamiento crítico y bases teóricas útiles",
					iconOn: TablerPuzzleFilled,
					iconOff: TablerPuzzle
				},
				{
					value: 'high',
					label: "Esencial",
					desc: "Uso real",
					tooltip: "Herramientas clave y modernas que usaré directo en el trabajo",
					iconOn: MingcuteBriefcaseFill,
					iconOff: MingcuteBriefcaseLine
				},
			]}
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['relevance-utility']}
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
