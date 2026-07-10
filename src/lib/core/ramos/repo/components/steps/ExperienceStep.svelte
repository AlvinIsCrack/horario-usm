<script module>
	const GRADE_MAP_TO_STRING: Record<number, string> = {
		1: 'failed-low',
		2: 'failed-high',
		3: 'passed-low',
		4: 'passed-mid',
		5: 'passed-high'
	};

	const GRADE_MAP_TO_NUMERIC: Record<string, number> = {
		'failed-low': 1,
		'failed-high': 2,
		'passed-low': 3,
		'passed-mid': 4,
		'passed-high': 5
	};
</script>

<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import Slider from '$lib/components/ui/Slider.svelte';
	import MingcuteTimeFill from '$lib/helpers/MingcuteTimeFill.svelte';
	import MaterialSymbolsTimer1 from '$lib/icons/MaterialSymbolsTimer1.svelte';
	import MaterialSymbolsTimer2 from '$lib/icons/MaterialSymbolsTimer2.svelte';
	import MaterialSymbolsTimer3 from '$lib/icons/MaterialSymbolsTimer3.svelte';
	import MingcuteCheckCircleFill from '$lib/icons/MingcuteCheckCircleFill.svelte';
	import MingcuteCheckCircleLine from '$lib/icons/MingcuteCheckCircleLine.svelte';
	import MingcuteCloseCircleFill from '$lib/icons/MingcuteCloseCircleFill.svelte';
	import MingcuteCloseCircleLine from '$lib/icons/MingcuteCloseCircleLine.svelte';
	import MingcuteDelete2Fill from '$lib/icons/MingcuteDelete2Fill.svelte';
	import MingcuteDelete2Line from '$lib/icons/MingcuteDelete2Line.svelte';
	import MingcuteForbidCircleFill from '$lib/icons/MingcuteForbidCircleFill.svelte';
	import MingcuteForbidCircleLine from '$lib/icons/MingcuteForbidCircleLine.svelte';
	import MingcuteMinusCircleFill from '$lib/icons/MingcuteMinusCircleFill.svelte';
	import MingcuteMinusCircleLine from '$lib/icons/MingcuteMinusCircleLine.svelte';
	import MingcuteThumbDown2Fill from '$lib/icons/MingcuteThumbDown2Fill.svelte';
	import MingcuteThumbDown2Line from '$lib/icons/MingcuteThumbDown2Line.svelte';
	import MingcuteThumbUp2Fill from '$lib/icons/MingcuteThumbUp2Fill.svelte';
	import MingcuteThumbUp2Line from '$lib/icons/MingcuteThumbUp2Line.svelte';
	import MingcuteTimeLine from '$lib/icons/MingcuteTimeLine.svelte';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import IconToggleField from '../forms/IconToggleField.svelte';
	import ToggleField from '../forms/ToggleField.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

<div class={styles.container()}>
	<FieldHeader
		title="Contexto Temporal"
		description="¿Hace cuánto lo cursaste, aproximadamente?"
		htmlFor="temporal-context"
		{styles}
	/>
	<IconToggleField
		id="temporal-context"
		{form}
		items={[
			{
				value: 'recent',
				label: 'Reciente',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			},
			{
				value: 'one-year',
				label: '~1 año',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			},
			{
				value: 'two-years',
				label: '~2 años',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			},
			{
				value: 'older',
				label: '~3+ años',
				iconOn: MingcuteTimeFill,
				iconOff: MingcuteTimeLine
			}
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Situación Final"
		description="¿Cuál fue tu resultado en el ramo durante ese semestre?"
		htmlFor="final-status"
		{styles}
	/>
	<IconToggleField
		id="final-status"
		{form}
		items={[
			{
				value: 'pass',
				label: 'Pasé',
				iconOn: MingcuteCheckCircleFill,
				iconOff: MingcuteCheckCircleLine
			},
			{
				value: 'fail',
				label: 'Repetí',
				iconOn: MingcuteCloseCircleFill,
				iconOff: MingcuteCloseCircleLine
			},
			{
				value: 'drop',
				label: 'Botado',
				iconOn: MingcuteDelete2Fill,
				iconOff: MingcuteDelete2Line
			}
		]}
	/>
</div>

{#if form.values['final-status'] === 'pass' || form.values['final-status'] === 'fail'}
	<div class={styles.container()}>
		<FieldHeader
			title="Evaluación Global/Recuperativa"
			description="¿Llegaste a usar el examen global/recuperativo?"
			htmlFor="used-global"
			{styles}
		/>
		<IconToggleField
			id="used-global"
			{form}
			items={[
				{
					value: 'yes',
					label: 'Sí',
					iconOn: MingcuteCheckCircleFill,
					iconOff: MingcuteCheckCircleLine
				},
				{
					value: 'no',
					label: 'No',
					iconOn: MingcuteCloseCircleFill,
					iconOff: MingcuteCloseCircleLine
				},
				{
					value: 'inexistent',
					label: 'No había',
					iconOn: MingcuteForbidCircleFill,
					iconOff: MingcuteForbidCircleLine
				}
			]}
		/>
	</div>
{/if}

<div class={styles.container()}>
	<FieldHeader
		title="Intentos"
		description="¿Era la primera vez que dabas el ramo?"
		htmlFor="previous-attempts"
		{styles}
	/>
	<IconToggleField
		id="previous-attempts"
		{form}
		items={[
			{
				value: '1',
				label: '1ra vez',
				iconOn: MaterialSymbolsTimer1,
				iconOff: MaterialSymbolsTimer1
			},
			{
				value: '2',
				label: '2da vez',
				iconOn: MaterialSymbolsTimer2,
				iconOff: MaterialSymbolsTimer2
			},
			{
				value: '3+',
				label: '3ra+ vez',
				iconOn: MaterialSymbolsTimer3,
				iconOff: MaterialSymbolsTimer3
			}
		]}
	/>
</div>

<!-- 
<div class={styles.container()}>
	<FieldHeader
		title="Nota Final"
		description="¿Con qué nota cerraste? Pregunta opcional, 100% anónima, para motivo de estadísticas agregadas."
		htmlFor="final-grade"
		{styles}
	/>
	<div>
		<Slider
			id="final-grade"
			min={1}
			max={5}
			step={1}
			value={GRADE_MAP_TO_NUMERIC[form.values['final-grade']] || 1}
			onValueChange={(v) => {
				const stringValue = GRADE_MAP_TO_STRING[v];
				if (stringValue) {
					form.setFieldValue('final-grade', stringValue);
				}
			}}
			formatValue={(v) => `${v}`}
			ticks={[
				{ value: 1, label: '0-39' },
				{ value: 2, label: '40-54' },
				{ value: 3, label: '55-69' },
				{ value: 4, label: '70-84' },
				{ value: 5, label: '85-100' }
			]}
		/>
		<div class="text-muted-foreground flex justify-between text-center text-xs font-medium">
			<span>Baja</span>
			<span>Excelente</span>
		</div>
	</div>
</div> -->

{#if form.values['final-status'] !== 'drop' && form.values['final-status']}
	<div class={styles.container()}>
		<FieldHeader
			title="Intención de Abandono"
			description="¿En algún momento del semestre pensaste seriamente en botar el ramo por la carga de estrés o dificultad?"
			htmlFor="dropout-intention"
			{styles}
		/>
		<IconToggleField
			id="dropout-intention"
			{form}
			items={[
				{
					value: 'never',
					label: 'Nunca',
					iconOn: MingcuteThumbDown2Fill,
					iconOff: MingcuteThumbDown2Line
				},
				{
					value: 'sometimes',
					label: 'A Veces',
					iconOn: MingcuteMinusCircleFill,
					iconOff: MingcuteMinusCircleLine
				},
				{
					value: 'often',
					label: 'A Menudo',
					iconOn: MingcuteThumbUp2Fill,
					iconOff: MingcuteThumbUp2Line
				}
			]}
		/>
	</div>
{/if}

<div class={styles.container()}>
	<FieldHeader
		title="Frustración vs. Recompensa"
		description="¿Sientes que el esfuerzo invertido se refleja justamente en tus notas o generó frustración constante?"
		htmlFor="reward-ratio"
		{styles}
	/>
	<IconToggleField
		id="reward-ratio"
		{form}
		items={[
			{
				value: 'bad',
				label: 'Frustrante',
				iconOn: MingcuteThumbDown2Fill,
				iconOff: MingcuteThumbDown2Line
			},
			{
				value: 'neutral',
				label: 'Justo',
				iconOn: MingcuteMinusCircleFill,
				iconOff: MingcuteMinusCircleLine
			},
			{
				value: 'good',
				label: 'Recompensado',
				iconOn: MingcuteThumbUp2Fill,
				iconOff: MingcuteThumbUp2Line
			}
		]}
	/>
</div>
