<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import ToggleField from '../forms/ToggleField.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

<div class={styles.container()}>
	<FieldHeader
		title="Horas de estudio real"
		description="¿Cuántas horas a la semana dedicaste fuera de clases (estudiar, tareas, proyectos)?"
		htmlFor="real-study-hours"
		{styles}
	/>
	<ToggleField
		id="real-study-hours"
		{form}
		items={[
			{ value: 'light', label: '0-2hrs', desc: 'Muy ligera' },
			{ value: 'moderate', label: '3-5hrs', desc: 'Normal' },
			{ value: 'demanding', label: '6-8hrs', desc: 'Exigente' },
			{ value: 'intense', label: '9+hrs', desc: 'Extremo' }
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Distribución de esfuerzo"
		description="¿El ramo te exige trabajo constante todas las semanas o te revienta solo en época de certámenes?"
		htmlFor="temporal-distribution"
		{styles}
	/>
	<ToggleField
		id="temporal-distribution"
		{form}
		items={[
			{ value: 'constant', label: 'Constante' },
			{ value: 'intermitent', label: 'Intermitente' },
			{ value: 'end-heavy', label: 'Al Final' }
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Demanda Física y Asistencia"
		description="¿Exige mucha asistencia obligatoria, laboratorios largos o salidas a terreno que te dejen agotado?"
		htmlFor="assistance"
		{styles}
	/>
	<ToggleField
		id="assistance"
		{form}
		items={[
			{ value: 'low', label: 'Baja', desc: 'Poca exigencia/online' },
			{ value: 'moderate', label: 'Normal', desc: 'Asistencia estándar/desgaste común' },
			{ value: 'high', label: 'Alta', desc: 'Desgaste físico, asistencia estricta, bloques largos' }
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Opciones de Recuperación"
		description="¿Existen 'salvavidas'? (ej. certamen recuperativo, se borra la peor nota, eximición)."
		htmlFor="recovery-options"
		{styles}
	/>
	<ToggleField
		id="recovery-options"
		{form}
		items={[
			{ value: 'none', label: 'Inexistentes', desc: 'Si te va mal en una, arrastras la nota' },
			{ value: 'few', label: 'Pocas / Difíciles', desc: 'Hay un recuperativo global al final' },
			{
				value: 'flexible',
				label: 'Buenas Vías',
				desc: 'Se borra la peor nota o hay controles salvavidas'
			}
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Criterio de Corrección"
		description="¿Qué tan estrictos son para revisar? ¿Te dan puntaje por el desarrollo lógico o te castigan si fallas el resultado final?"
		htmlFor="grading-strictness"
		{styles}
	/>
	<ToggleField
		id="grading-strictness"
		{form}
		items={[
			{ value: 'flexible', label: 'Flexible', desc: 'Premian el intento y desarrollo' },
			{ value: 'fair', label: 'Rúbrica Justa', desc: 'Descuento proporcional al error' },
			{ value: 'inflexible', label: 'Inflexible', desc: 'Error numérico o de coma es todo malo' }
		]}
	/>
</div>
